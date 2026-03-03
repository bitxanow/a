import { NextRequest, NextResponse } from "next/server"
import { startAttack, getState } from "@/lib/attack"
import { appendAction } from "@/lib/database"
import { LAYER7_METHODS, LAYER4_METHODS, DEFAULT_CONFIG } from "@/lib/config"
import { randomUUID } from "crypto"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { methodType, method, target, threads, rpc, duration } = body

    if (!target?.trim()) {
      return NextResponse.json({ error: "Target required" }, { status: 400 })
    }

    const validMethod =
      (methodType === "layer7" && LAYER7_METHODS.includes(method)) ||
      (methodType === "layer4" && LAYER4_METHODS.includes(method))

    if (!validMethod) {
      return NextResponse.json({ error: "Invalid method" }, { status: 400 })
    }

    const cfg = {
      threads: threads ?? DEFAULT_CONFIG.threads,
      rpc: rpc ?? DEFAULT_CONFIG.rpc,
      duration: duration ?? DEFAULT_CONFIG.duration,
    }

    const id = randomUUID()
    await appendAction({
      id,
      method,
      target: target.trim(),
      startedAt: new Date().toISOString(),
      config: cfg,
    })

    startAttack(
      id,
      method,
      methodType,
      target.trim(),
      cfg.threads,
      cfg.rpc,
      cfg.duration
    )

    return NextResponse.json({ id, ok: true, state: getState() })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
