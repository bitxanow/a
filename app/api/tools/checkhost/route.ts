import { NextRequest, NextResponse } from "next/server"

type NodeInfo = [string, string, string, string, string] // countryCode, country, city, ip, asn
type HttpResult = [number, number, string, string | null, string | null] // ok, time, msg, code, ip

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get("host")?.trim()
  if (!host) return NextResponse.json({ error: "host required" }, { status: 400 })

  const url = host.startsWith("http") ? host : `http://${host}`
  const maxNodes = Math.min(parseInt(req.nextUrl.searchParams.get("nodes") || "10") || 10, 20)

  try {
    const initRes = await fetch(
      `https://check-host.net/check-http?host=${encodeURIComponent(url)}&max_nodes=${maxNodes}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) }
    )
    const init = (await initRes.json()) as {
      ok?: number
      request_id?: string
      permanent_link?: string
      nodes?: Record<string, NodeInfo>
    }
    if (!init.ok || !init.request_id) {
      return NextResponse.json({ error: "Check-Host API error", raw: init }, { status: 502 })
    }

    const nodes = init.nodes || {}
    let results: Record<string, HttpResult[]> | null = null
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000))
      const resRes = await fetch(
        `https://check-host.net/check-result/${init.request_id}`,
        { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) }
      )
      const resData = (await resRes.json()) as Record<string, HttpResult[] | null>
      const hasNull = Object.values(resData).some((v) => v === null)
      const hasEmpty = Object.values(resData).some((v) => Array.isArray(v) && v.length === 0)
      if (!hasNull && !hasEmpty && Object.keys(resData).length > 0) {
        results = resData as Record<string, HttpResult[]>
        break
      }
    }

    const rows: { location: string; result: string; time: number; code: string; ip: string }[] = []
    for (const [nodeId, info] of Object.entries(nodes)) {
      const res = results?.[nodeId]?.[0]
      const [, country, city] = info
      const location = `${country}, ${city}`
      if (res) {
        const [ok, time, msg, code, ip] = res
        rows.push({
          location,
          result: ok ? "OK" : msg || "Erro",
          time: Math.round(time * 1000),
          code: code || "-",
          ip: ip || "-",
        })
      } else {
        rows.push({ location, result: "Aguardando...", time: 0, code: "-", ip: "-" })
      }
    }

    return NextResponse.json({
      request_id: init.request_id,
      permanent_link: init.permanent_link,
      host: url,
      nodes: rows,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
