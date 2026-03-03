import { NextResponse } from "next/server"
import { stopAttack } from "@/lib/attack"

export async function POST() {
  stopAttack()
  return NextResponse.json({ ok: true })
}
