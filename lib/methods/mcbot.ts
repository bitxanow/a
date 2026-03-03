import * as minecraft from "./minecraft"

export async function flood(
  url: string,
  rpc: number,
  onStats: (req: number, bytes: number) => void
): Promise<void> {
  await minecraft.flood(url, rpc, onStats)
}
