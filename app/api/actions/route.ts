import { NextResponse } from "next/server"
import { getActions } from "@/lib/database"

export async function GET() {
  const actions = await getActions()
  return NextResponse.json(actions)
}
