import { NextRequest, NextResponse } from "next/server"
import { stopAttack, getState } from "@/lib/attack"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const id = body?.id
    stopAttack(typeof id === "string" ? id : undefined)
  } catch {
    stopAttack()
  }
  return NextResponse.json({ ok: true, attacks: getState() })
}
