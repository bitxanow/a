import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url")
  if (!target) {
    return NextResponse.json({ error: "url required" }, { status: 400 })
  }
  const url = target.startsWith("http") ? target : `http://${target}`
  try {
    const start = Date.now()
    await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000) })
    const ms = Date.now() - start
    return NextResponse.json({ ms, ok: true })
  } catch (e) {
    return NextResponse.json({ ms: -1, error: String(e) })
  }
}
