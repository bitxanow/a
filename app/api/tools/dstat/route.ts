import { NextResponse } from "next/server"
import os from "os"

export async function GET() {
  const cpus = os.cpus()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem
  return NextResponse.json({
    cpu: cpus.length,
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      percent: ((usedMem / totalMem) * 100).toFixed(1),
    },
    uptime: os.uptime(),
  })
}
