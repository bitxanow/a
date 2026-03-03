import { NextRequest, NextResponse } from "next/server"
import dns from "dns/promises"

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain")
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 })
  const host = domain.replace(/^https?:\/\//, "").split("/")[0]
  try {
    const [a, aaaa, mx, txt] = await Promise.allSettled([
      dns.resolve4(host),
      dns.resolve6(host),
      dns.resolveMx(host),
      dns.resolveTxt(host),
    ])
    return NextResponse.json({
      A: a.status === "fulfilled" ? a.value : [],
      AAAA: aaaa.status === "fulfilled" ? aaaa.value : [],
      MX: mx.status === "fulfilled" ? mx.value : [],
      TXT: txt.status === "fulfilled" ? txt.value.flat() : [],
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
