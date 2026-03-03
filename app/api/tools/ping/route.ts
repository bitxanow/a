import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url")
  if (!target) return NextResponse.json({ error: "url required" }, { status: 400 })
  const host = target.replace(/^https?:\/\//, "").split("/")[0]
  const url = target.startsWith("http") ? target : `http://${host}`
  try {
    const start = Date.now()
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    })
    const ms = Date.now() - start
    return NextResponse.json({
      ms,
      ok: res.ok,
      statusCode: res.status,
      status: res.ok ? "ONLINE" : res.status >= 500 ? "ERRO" : "RESPOSTA",
    })
  } catch (e) {
    return NextResponse.json({ ms: -1, ok: false, statusCode: 0, status: "OFFLINE", error: String(e) })
  }
}
