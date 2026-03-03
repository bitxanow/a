import * as net from "net"

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
    const sock = net.createConnection({ host, port }, () => {
      onStats(1, 0)
    })
    sock.on("data", () => {})
    sock.on("error", () => resolve())
    sock.on("close", () => resolve())
    sock.setTimeout(30000, () => {
      sock.destroy()
      resolve()
    })
  })
}
