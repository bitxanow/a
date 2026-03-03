import { NextRequest, NextResponse } from "next/server"
import dns from "dns/promises"

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain")
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 })
  const host = domain.replace(/^https?:\/\//, "").split("/")[0]
  try {
    const [tcp, udp] = await Promise.allSettled([
      dns.resolveSrv("_tsdns._tcp." + host),
      dns.resolveSrv("_ts3._udp." + host),
    ])
    const tcpVal = tcp.status === "fulfilled" ? tcp.value.map((r) => `${r.name}:${r.port}`) : []
    const udpVal = udp.status === "fulfilled" ? udp.value.map((r) => `${r.name}:${r.port}`) : []
    return NextResponse.json({
      "_tsdns._tcp": tcpVal.length ? tcpVal : "Not found",
      "_ts3._udp": udpVal.length ? udpVal : "Not found",
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
