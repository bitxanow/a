import * as get from "./get"

export async function flood(
  url: string,
  rpc: number,
  onStats: (req: number, bytes: number) => void
): Promise<void> {
  const floodFn = get.flood
  const workers: Promise<void>[] = []
  for (let i = 0; i < 50; i++) {
    workers.push(floodFn(url, rpc, onStats))
  }
  await Promise.all(workers)
}
