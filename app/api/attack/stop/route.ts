import { NextResponse } from "next/server"
import { stopAttack } from "@/lib/attack"

export const dynamic = "force-dynamic"

export async function POST() {
  stopAttack()
  return NextResponse.json({ ok: true })
}
