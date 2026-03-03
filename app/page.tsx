"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Play,
  Square,
  Server,
  BarChart3,
  Wifi,
  Wrench,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
} from "lucide-react"
import { LAYER7_METHODS, LAYER4_METHODS, DEFAULT_CONFIG } from "@/lib/config"
import { METHOD_ICONS, TOOL_ICONS, METHOD_TYPE_ICONS } from "@/lib/icons"
import { formatBytes, formatNum } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

type AttackState = {
  id: string
  method: string
  methodType: string
  target: string
  running: boolean
  requests: number
  bytes: number
  startTime: number
  logs: string[]
  pingHistory: { time: number; ms: number }[]
  requestHistory?: { time: number; requests: number; bytes: number }[]
}

export default function Home() {
  const [methodType, setMethodType] = useState<"layer7" | "layer4">("layer7")
  const [method, setMethod] = useState<string>("GET")
  const [target, setTarget] = useState("")
  const [threads, setThreads] = useState(DEFAULT_CONFIG.threads)
  const [rpc, setRpc] = useState(DEFAULT_CONFIG.rpc)
  const [duration, setDuration] = useState(DEFAULT_CONFIG.duration)
  const [attacks, setAttacks] = useState<AttackState[]>([])
  const [loading, setLoading] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<string>("PING")
  const [toolResult, setToolResult] = useState<string | null>(null)
  const [toolLoading, setToolLoading] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [appName, setAppName] = useState("BitNuke")
  const [accentColor, setAccentColor] = useState("#ef4444")
  const [bgImageUrl, setBgImageUrl] = useState("https://preview.redd.it/anime-girl-demon-horn-red-eyes-4k-wallpaper-3840x2160-v0-g2hgw3a9n94f1.jpeg?width=1080&crop=smart&auto=webp&s=a397abe7352035a98a67a17d1ce62dc8e2fee4d1")
  const [globalCheck, setGlobalCheck] = useState<{
    nodes: { location: string; result: string; time: number; code: string; ip: string }[]
    loading: boolean
    permanent_link?: string
  } | null>(null)

  const methods = methodType === "layer7" ? LAYER7_METHODS : LAYER4_METHODS
  const Layer7Icon = METHOD_TYPE_ICONS.layer7
  const Layer4Icon = METHOD_TYPE_ICONS.layer4

  useEffect(() => {
    const n = localStorage.getItem("bitnuke_appName")
    const c = localStorage.getItem("bitnuke_accentColor")
    const b = localStorage.getItem("bitnuke_bgImageUrl")
    if (n) setAppName(n)
    if (c) setAccentColor(c)
    if (b) setBgImageUrl(b)
  }, [])

  useEffect(() => {
    document.body.style.backgroundImage = bgImageUrl ? `url("${bgImageUrl}")` : "none"
    document.body.style.backgroundSize = "cover"
    document.body.style.backgroundAttachment = "fixed"
    document.body.style.backgroundPosition = "center"
    return () => {
      document.body.style.backgroundImage = ""
      document.body.style.backgroundSize = ""
      document.body.style.backgroundAttachment = ""
      document.body.style.backgroundPosition = ""
    }
  }, [bgImageUrl])

  const saveSettings = () => {
    localStorage.setItem("bitnuke_appName", appName)
    localStorage.setItem("bitnuke_accentColor", accentColor)
    localStorage.setItem("bitnuke_bgImageUrl", bgImageUrl)
    setSettingsOpen(false)
  }

  const runTool = async (tool: string) => {
    const host = target.trim()
    if (tool !== "DSTAT" && !host) return
    setToolLoading(true)
    setToolResult(null)
    try {
      let res: Response
      const enc = encodeURIComponent(host)
      if (tool === "PING") res = await fetch(`/api/tools/ping?url=${enc}`)
      else if (tool === "CHECK") res = await fetch(`/api/tools/check?url=${enc}`)
      else if (tool === "CHECKHOST") res = await fetch(`/api/tools/checkhost?host=${enc}`)
      else if (tool === "DNS") res = await fetch(`/api/tools/dns?domain=${enc}`)
      else if (tool === "TSSRV") res = await fetch(`/api/tools/tssrv?domain=${enc}`)
      else if (tool === "CFIP") res = await fetch(`/api/tools/cfip?domain=${enc}`)
      else if (tool === "DSTAT") res = await fetch("/api/tools/dstat")
      else return
      const data = await res.json()
      setToolResult(JSON.stringify(data, null, 2))
    } catch (e) {
      setToolResult(String(e))
    } finally {
      setToolLoading(false)
    }
  }

  const fetchingRef = useRef(false)
  const fetchState = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 8000)
    try {
      const res = await fetch(`/api/attack/status?t=${Date.now()}`, {
        cache: "no-store",
        signal: ctrl.signal,
      })
      const data = await res.json()
      setAttacks(Array.isArray(data) ? data : data.attacks ?? [])
    } catch {
      // AbortError/timeout ou rede: mantém state anterior
    } finally {
      clearTimeout(to)
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  useEffect(() => {
    if (!attacks.some((a) => a.running)) setAttackJustStarted(false)
  }, [attacks])

  const hasAnyRunning = attacks.some((a) => a.running)
  useEffect(() => {
    if (!hasAnyRunning) return
    const iv = setInterval(fetchState, 1000)
    return () => clearInterval(iv)
  }, [hasAnyRunning, fetchState])

  useEffect(() => {
    if (methodType === "layer7") setMethod("GET")
    else setMethod("TCP")
  }, [methodType])

  const [attackJustStarted, setAttackJustStarted] = useState(false)

  const start = async () => {
    if (!target.trim()) return
    setLoading(true)
    setAttackJustStarted(false)
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 15000)
    try {
      const res = await fetch("/api/attack/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: ctrl.signal,
        body: JSON.stringify({
          methodType,
          method,
          target: target.trim(),
          threads,
          rpc,
          duration,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAttackJustStarted(true)
        setAttacks(data.attacks ?? [])
        if (!data.attacks?.length) await fetchState()
      }
    } catch {
      // AbortError ou rede: ignora
    } finally {
      clearTimeout(to)
      setLoading(false)
    }
  }

  const stop = async (id?: string) => {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 10000)
    try {
      await fetch("/api/attack/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify(id ? { id } : {}),
      })
      setAttackJustStarted(false)
    } catch {
      // AbortError ou rede: ignora
    } finally {
      clearTimeout(to)
      await fetchState()
    }
  }

  const canStop = hasAnyRunning || attackJustStarted
  const primaryAttack = attacks.find((a) => a.running) ?? attacks[attacks.length - 1]
  const totalRequests = attacks.reduce((s, a) => s + a.requests, 0)
  const totalBytes = attacks.reduce((s, a) => s + a.bytes, 0)

  const runGlobalCheck = async () => {
    const host = target.trim()
    if (!host) return
    setGlobalCheck((prev) => (prev ? { ...prev, loading: true } : { nodes: [], loading: true }))
    try {
      const res = await fetch(`/api/tools/checkhost?host=${encodeURIComponent(host)}`)
      const data = await res.json()
      if (data.nodes) {
        setGlobalCheck({ nodes: data.nodes, loading: false, permanent_link: data.permanent_link })
      } else {
        setGlobalCheck({ nodes: [], loading: false })
      }
    } catch {
      setGlobalCheck((prev) => (prev ? { ...prev, loading: false } : null))
    }
  }

  const pingChartData = (primaryAttack?.pingHistory ?? []).map((p) => ({
    time: new Date(p.time).toLocaleTimeString(),
    ms: p.ms < 0 ? 0 : p.ms,
  }))

  const reqChartData = (primaryAttack?.requestHistory ?? []).map((r) => ({
    time: new Date(r.time).toLocaleTimeString(),
    requests: r.requests,
  }))

  const previewUrl = (() => {
    const t = target.trim()
    if (!t) return null
    if (t.includes("://")) return t
    if (t.includes(":")) return `http://${t}`
    return `https://${t}`
  })()

  return (
    <div className="flex min-h-screen flex-col bg-black/40">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center gap-4 border-b border-white/10 bg-black/50 backdrop-blur-sm px-4 py-3">
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="font-mono text-lg font-bold" style={{ color: accentColor }}>{appName}</span>
          <span className="text-[10px] text-[#525252]">v1</span>
        </button>
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="URL ou IP:PORT"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="max-w-md border-white/10 bg-black/40 backdrop-blur-sm font-mono text-sm"
          />
          <Button
            onClick={start}
            disabled={loading}
            className="font-medium text-black hover:brightness-90 transition-all"
            style={{ backgroundColor: accentColor }}
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
          <Button
            variant="outline"
            onClick={() => stop()}
            disabled={!canStop}
            className="border-white/10"
          >
            <Square className="h-4 w-4" />
            Stop
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setToolsOpen(!toolsOpen)}
          className="gap-2 text-muted-foreground"
        >
          <Wrench className="h-4 w-4" />
          Tools
          {toolsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </header>

      {/* Tools panel */}
      {toolsOpen && (
        <section className="border-b border-white/10 bg-black/50 backdrop-blur-sm px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-36">
              <Label className="text-[10px] text-muted-foreground">Ferramenta</Label>
              <Select value={selectedTool} onValueChange={setSelectedTool}>
                <SelectTrigger className="mt-1 border-white/10 bg-black/40 backdrop-blur-sm font-mono text-xs">
                <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/50 backdrop-blur-md border-white/10">
                  {["PING", "CHECK", "CHECKHOST", "CFIP", "DNS", "TSSRV", "DSTAT"].map((t) => {
                    const ToolIcon = TOOL_ICONS[t] || Wrench
                    return (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          <ToolIcon className="h-3.5 w-3.5" />
                          {t}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => runTool(selectedTool)}
              disabled={toolLoading || (selectedTool !== "DSTAT" && !target.trim())}
              className="font-medium text-black hover:brightness-90 transition-all"
              style={{ backgroundColor: accentColor }}
            >
              {toolLoading ? "..." : "Executar"}
            </Button>
          </div>
          {toolResult && (
            <ScrollArea className="mt-3 h-40 rounded border border-white/10 bg-black/40 backdrop-blur-sm p-3 font-mono text-[11px]">
              <pre className="whitespace-pre-wrap">{toolResult}</pre>
            </ScrollArea>
          )}
        </section>
      )}

      {/* Main content */}
      <main className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex min-h-0 flex-1 gap-4">
        {/* Left: Config */}
        <aside className="flex w-64 shrink-0">
          <div className="flex flex-1 flex-col gap-3 rounded border border-white/10 bg-black/50 backdrop-blur-sm p-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">Tipo</Label>
                <Select value={methodType} onValueChange={(v) => setMethodType(v as "layer7" | "layer4")}>
                  <SelectTrigger className="mt-1 border-white/10 bg-black/40 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/50 backdrop-blur-md border-white/10">
                    <SelectItem value="layer7">
                      <span className="flex items-center gap-2">
                        <Layer7Icon className="h-3.5 w-3.5" />
                        Layer 7
                      </span>
                    </SelectItem>
                    <SelectItem value="layer4">
                      <span className="flex items-center gap-2">
                        <Layer4Icon className="h-3.5 w-3.5" />
                        Layer 4
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Método</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="mt-1 border-white/10 bg-black/40 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/50 backdrop-blur-md border-white/10">
                    {methods.map((m) => {
                      const Icon = METHOD_ICONS[m] || Server
                      return (
                        <SelectItem key={m} value={m}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            {m}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Threads</Label>
                  <Input
                    type="number"
                    value={threads}
                    onChange={(e) => setThreads(parseInt(e.target.value) || 500)}
                    className="mt-1 border-white/10 bg-black/40 backdrop-blur-sm font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">RPC</Label>
                  <Input
                    type="number"
                    value={rpc}
                    onChange={(e) => setRpc(parseInt(e.target.value) || 50)}
                    className="mt-1 border-white/10 bg-black/40 backdrop-blur-sm font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Duração (s)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  className="mt-1 border-white/10 bg-black/40 backdrop-blur-sm font-mono text-xs"
                />
              </div>
            </div>
        </aside>

        {/* Right: Dashboard */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Metrics strip */}
          <div className="flex gap-4 rounded border border-white/10 bg-black/50 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground">Requisições</span>
              <span className="font-mono text-xl font-semibold tabular-nums" style={{ color: accentColor }}>
                {attacks.length ? formatNum(totalRequests) : "—"}
              </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground">Bytes</span>
              <span className="font-mono text-xl font-semibold tabular-nums">
                {attacks.length ? formatBytes(totalBytes) : "—"}
              </span>
            </div>
            {hasAnyRunning && (
              <>
                <div className="h-4 w-px bg-[#1f1f1f]" />
                <span className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${accentColor}26`, color: accentColor }}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ backgroundColor: accentColor }} />
                  LIVE {attacks.filter((a) => a.running).length}
                </span>
              </>
            )}
          </div>

          {/* Lista de ataques */}
          {attacks.length > 0 && (
            <div className="rounded border border-white/10 bg-black/50 backdrop-blur-sm p-3">
              <div className="mb-2 text-[10px] uppercase text-muted-foreground">
                Ataques ({attacks.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {attacks.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 rounded border border-white/10 bg-black/40 px-3 py-1.5 text-xs"
                  >
                    <span className="font-mono truncate max-w-[180px]" title={a.target}>
                      {a.target}
                    </span>
                    <span className="text-muted-foreground">{a.method}</span>
                    {a.running && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => stop(a.id)}
                        className="h-6 px-1.5 text-[10px] text-red-400 hover:text-red-300"
                      >
                        Parar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded border border-white/10 bg-black/50 backdrop-blur-sm p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                <Wifi className="h-3 w-3" />
                Ping
              </div>
              {primaryAttack && pingChartData.length > 0 ? (
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pingChartData}>
                      <Area type="monotone" dataKey="ms" stroke={accentColor} fill={`${accentColor}1a`} />
                      <YAxis hide domain={[0, "auto"]} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
                  {primaryAttack ? "Coletando..." : "—"}
                </div>
              )}
            </div>
            <div className="rounded border border-white/10 bg-black/50 backdrop-blur-sm p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                Progresso
              </div>
              {primaryAttack ? (
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reqChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                      <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#525252" />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => formatNum(v)} stroke="#525252" />
                      <Tooltip formatter={(v) => formatNum(Number(v))} contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <Line type="monotone" dataKey="requests" stroke={accentColor} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
                  {attacks.length ? "—" : "—"}
                </div>
              )}
            </div>
          </div>

          {/* Global status */}
          <div className="rounded border border-white/10 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
              <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                <Globe className="h-3 w-3" />
                Status global
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={runGlobalCheck}
                disabled={globalCheck?.loading || !target.trim()}
                className="h-7 text-xs"
              >
                {globalCheck?.loading ? "..." : "Verificar"}
              </Button>
            </div>
            <div className="max-h-52 overflow-auto">
              {globalCheck?.nodes && globalCheck.nodes.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-black/70">
                    <tr className="border-b border-white/10">
                      <th className="p-2 text-left font-medium text-muted-foreground">Local</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Resultado</th>
                      <th className="p-2 text-right font-medium text-muted-foreground">Tempo</th>
                      <th className="p-2 text-center font-medium text-muted-foreground">Código</th>
                      <th className="p-2 font-mono text-muted-foreground">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalCheck.nodes.map((row, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-2">{row.location}</td>
                        <td className="p-2">
                          <span
                            className={
                              row.result === "OK"
                                ? "text-emerald-500"
                                : row.result === "Aguardando..."
                                  ? "text-muted-foreground"
                                  : "text-red-400"
                            }
                          >
                            {row.result}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono">{row.time > 0 ? `${row.time}ms` : "-"}</td>
                        <td className="p-2 text-center font-mono">{row.code}</td>
                        <td className="p-2 font-mono text-muted-foreground">{row.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                  {globalCheck?.loading ? "Consultando..." : "Alvo + Verificar"}
                </div>
              )}
            </div>
            {globalCheck?.permanent_link && (
              <a
                href={globalCheck.permanent_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-t border-white/10 px-4 py-2 text-[10px] hover:underline"
                style={{ color: accentColor }}
              >
                Check-Host →
              </a>
            )}
          </div>
        </div>
        </div>

        {/* Preview em tempo real */}
        <div className="flex min-h-0 flex-1 flex-col rounded border border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <span className="text-[10px] uppercase text-muted-foreground">Preview em tempo real</span>
            {previewUrl && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="h-7 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3" />
                  Atualizar
                </Button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] hover:underline flex items-center gap-1"
                  style={{ color: accentColor }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir
                </a>
              </div>
            )}
          </div>
          <div className="min-h-[70vh] flex-1">
            {previewUrl ? (
              <iframe
                key={previewKey}
                src={previewUrl}
                className="h-full min-h-[70vh] w-full border-0 bg-white"
                sandbox="allow-scripts allow-forms allow-same-origin"
                title="Preview do target"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Informe o target para visualizar
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Modal de configurações */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg border border-white/10 bg-black/50 backdrop-blur-md p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">Personalizar</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="BitNuke"
                  className="mt-1 border-white/10 bg-black/40 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Cor de destaque</Label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-black/60"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#ef4444"
                    className="flex-1 border-white/10 bg-black/40 backdrop-blur-sm font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">URL da imagem de fundo</Label>
                <Input
                  value={bgImageUrl}
                  onChange={(e) => setBgImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 border-white/10 bg-black/40 backdrop-blur-sm font-mono text-xs"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)} className="border-white/10">
                Cancelar
              </Button>
              <Button onClick={saveSettings} className="text-black hover:brightness-90 transition-all" style={{ backgroundColor: accentColor }}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
