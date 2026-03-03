import { NextResponse } from "next/server"
import { getState } from "@/lib/attack"

export async function GET() {
  const state = getState()
  return NextResponse.json(state)
}
