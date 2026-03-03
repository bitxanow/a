import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url")
  if (!target) return NextResponse.json({ error: "url required" }, { status: 400 })
  const url = target.startsWith("http") ? target : `http://${target}`
  try {
    const start = Date.now()
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
    const ms = Date.now() - start
    return NextResponse.json({
      statusCode: res.status,
      status: res.ok ? "ONLINE" : res.status >= 500 ? "ERRO" : "RESPOSTA",
      ms,
      ok: res.ok,
    })
  } catch (e) {
    return NextResponse.json({ statusCode: 0, status: "OFFLINE", ms: -1, ok: false, error: String(e) })
  }
}
