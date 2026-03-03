import { promises as fs } from "fs"
import path from "path"

const DB_DIR = path.join(process.cwd(), "database")

async function ensureDir() {
  await fs.mkdir(DB_DIR, { recursive: true })
}

export async function readJson<T>(file: string): Promise<T | null> {
  try {
    const p = path.join(DB_DIR, `${file}.json`)
    const data = await fs.readFile(p, "utf-8")
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

export async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir()
  const p = path.join(DB_DIR, `${file}.json`)
  await fs.writeFile(p, JSON.stringify(data, null, 2))
}

export async function appendAction(action: {
  id: string
  method: string
  target: string
  startedAt: string
  config: object
}): Promise<void> {
  const actions = (await readJson<typeof action[]>("actions")) ?? []
  actions.push(action)
  await writeJson("actions", actions)
}

export async function getActions(): Promise<object[]> {
  return (await readJson<object[]>("actions")) ?? []
}

export async function saveConfig(config: object): Promise<void> {
  await writeJson("config", config)
}

export async function getConfig(): Promise<object> {
  return (await readJson<object>("config")) ?? {}
}
