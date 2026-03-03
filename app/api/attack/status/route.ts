import { NextResponse } from "next/server"
import { getState } from "@/lib/attack"

export const dynamic = "force-dynamic"

export async function GET() {
  const attacks = getState()
  return NextResponse.json(attacks)
}
