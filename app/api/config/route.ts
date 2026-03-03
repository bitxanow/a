import { NextRequest, NextResponse } from "next/server"
import { getConfig, saveConfig } from "@/lib/database"
import { DEFAULT_CONFIG } from "@/lib/config"

export async function GET() {
  const cfg = await getConfig()
  return NextResponse.json({ ...DEFAULT_CONFIG, ...cfg })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  await saveConfig(body)
  return NextResponse.json({ ok: true })
}
