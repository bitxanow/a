import { NextRequest, NextResponse } from "next/server"
import dns from "dns/promises"

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain")
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 })
  const host = domain.replace(/^https?:\/\//, "").split("/")[0]
  try {
    const a = await dns.resolve4(host)
    return NextResponse.json({ ips: a, domain: host })
  } catch (e) {
    return NextResponse.json({ error: String(e), ips: [] })
  }
}
