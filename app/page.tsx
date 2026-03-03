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
  Settings,
  BarChart3,
  Wifi,
  Wrench,
  Globe,
  ChevronDown,
  ChevronUp,
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
  const [state, setState] = useState<AttackState | null>(null)
  const [loading, setLoading] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(true)
  const [toolInput, setToolInput] = useState("")
  const [toolResult, setToolResult] = useState<string | null>(null)
  const [toolLoading, setToolLoading] = useState(false)
  const [globalCheck, setGlobalCheck] = useState<{
    nodes: { location: string; result: string; time: number; code: string; ip: string }[]
    loading: boolean
    permanent_link?: string
  } | null>(null)

  const methods = methodType === "layer7" ? LAYER7_METHODS : LAYER4_METHODS
  const Layer7Icon = METHOD_TYPE_ICONS.layer7
  const Layer4Icon = METHOD_TYPE_ICONS.layer4

  const runTool = async (tool: string) => {
    if (tool !== "DSTAT" && !toolInput.trim()) return
    setToolLoading(true)
    setToolResult(null)
    try {
      let res: Response
      const enc = encodeURIComponent(toolInput.trim())
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
    try {
      const res = await fetch("/api/attack/status")
      const data = await res.json()
      setState(data)
    } finally {
      fetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  useEffect(() => {
    if (!state?.running) return
    const iv = setInterval(fetchState, 1000)
    return () => clearInterval(iv)
  }, [state?.running, fetchState])

  useEffect(() => {
    if (methodType === "layer7") setMethod("GET")
    else setMethod("TCP")
  }, [methodType])

  const start = async () => {
    if (!target.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/attack/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (data.state) setState(data.state)
      else if (res.ok) await fetchState()
      if (res.ok && !data.state) await fetchState()
    } finally {
      setLoading(false)
    }
  }

  const stop = async () => {
    await fetch("/api/attack/stop", { method: "POST" })
    await fetchState()
  }

  const runGlobalCheck = async () => {
    const host = target.trim() || toolInput.trim()
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

  const pingChartData = (state?.pingHistory ?? []).map((p) => ({
    time: new Date(p.time).toLocaleTimeString(),
    ms: p.ms < 0 ? 0 : p.ms,
  }))

  const reqChartData = (state?.requestHistory ?? []).map((r) => ({
    time: new Date(r.time).toLocaleTimeString(),
    requests: r.requests,
  }))

  return (
    <div className="flex min-h-screen flex-col bg-[#080808]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center gap-4 border-b border-[#171717] bg-[#0a0a0a] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold text-[#f97316]">BitNuke</span>
          <span className="text-[10px] text-[#525252]">v1</span>
        </div>
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Target URL or IP:port"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={!!state?.running}
            className="max-w-md border-[#1f1f1f] bg-[#0d0d0d] font-mono text-sm"
          />
          <Button
            onClick={start}
            disabled={!!state?.running || loading}
            className="bg-[#f97316] font-medium text-black hover:bg-[#ea580c]"
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
          <Button
            variant="outline"
            onClick={stop}
            disabled={!state?.running}
            className="border-[#1f1f1f]"
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
        <section className="border-b border-[#171717] bg-[#0a0a0a] px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-[10px] text-muted-foreground">Input</Label>
              <Input
                placeholder="domain.com or https://..."
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                className="mt-1 border-[#1f1f1f] bg-[#0d0d0d] font-mono"
              />
            </div>
            {["CFIP", "DNS", "TSSRV", "PING", "CHECK", "CHECKHOST", "DSTAT"].map((t) => {
              const ToolIcon = TOOL_ICONS[t] || Wrench
              return (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  onClick={() => runTool(t)}
                  disabled={toolLoading}
                  className="border-[#1f1f1f]"
                >
                  <ToolIcon className="h-3.5 w-3.5" />
                  {t}
                </Button>
              )
            })}
          </div>
          {toolResult && (
            <ScrollArea className="mt-3 h-40 rounded border border-[#1f1f1f] bg-[#080808] p-3 font-mono text-[11px]">
              <pre className="whitespace-pre-wrap">{toolResult}</pre>
            </ScrollArea>
          )}
        </section>
      )}

      {/* Main content */}
      <main className="flex flex-1 gap-4 p-4">
        {/* Left: Config */}
        <aside className="w-64 shrink-0">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className="flex w-full items-center justify-between rounded border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-[#141414]"
          >
            Config
            {configOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {configOpen && (
            <div className="mt-2 space-y-3 rounded border border-[#1f1f1f] bg-[#0d0d0d] p-3">
              <div>
                <Label className="text-[10px] text-muted-foreground">Type</Label>
                <Select value={methodType} onValueChange={(v) => setMethodType(v as "layer7" | "layer4")}>
                  <SelectTrigger className="mt-1 border-[#1f1f1f] bg-[#080808]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                <Label className="text-[10px] text-muted-foreground">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="mt-1 border-[#1f1f1f] bg-[#080808]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                    disabled={!!state?.running}
                    className="mt-1 border-[#1f1f1f] bg-[#080808] font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">RPC</Label>
                  <Input
                    type="number"
                    value={rpc}
                    onChange={(e) => setRpc(parseInt(e.target.value) || 50)}
                    disabled={!!state?.running}
                    className="mt-1 border-[#1f1f1f] bg-[#080808] font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Duration (s)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  disabled={!!state?.running}
                  className="mt-1 border-[#1f1f1f] bg-[#080808] font-mono text-xs"
                />
              </div>
            </div>
          )}
        </aside>

        {/* Right: Dashboard */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Metrics strip */}
          <div className="flex gap-4 rounded border border-[#1f1f1f] bg-[#0d0d0d] p-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground">Requests</span>
              <span className="font-mono text-xl font-semibold tabular-nums text-[#f97316]">
                {state ? formatNum(state.requests) : "—"}
              </span>
            </div>
            <div className="h-4 w-px bg-[#1f1f1f]" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground">Bytes</span>
              <span className="font-mono text-xl font-semibold tabular-nums">
                {state ? formatBytes(state.bytes) : "—"}
              </span>
            </div>
            {state?.running && (
              <>
                <div className="h-4 w-px bg-[#1f1f1f]" />
                <span className="flex items-center gap-1.5 rounded bg-[#f97316]/15 px-2 py-0.5 text-[10px] font-medium text-[#f97316]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f97316]" />
                  LIVE
                </span>
              </>
            )}
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded border border-[#1f1f1f] bg-[#0d0d0d] p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                <Wifi className="h-3 w-3" />
                Ping
              </div>
              {state && pingChartData.length > 0 ? (
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pingChartData}>
                      <Area type="monotone" dataKey="ms" stroke="#f97316" fill="rgba(249,115,22,0.1)" />
                      <YAxis hide domain={[0, "auto"]} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
                  {state ? "Coletando..." : "—"}
                </div>
              )}
            </div>
            <div className="rounded border border-[#1f1f1f] bg-[#0d0d0d] p-4">
              <div className="mb-3 flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                <BarChart3 className="h-3 w-3" />
                Progresso
              </div>
              {state ? (
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reqChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                      <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#525252" />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => formatNum(v)} stroke="#525252" />
                      <Tooltip formatter={(v) => formatNum(Number(v))} contentStyle={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f" }} />
                      <Line type="monotone" dataKey="requests" stroke="#f97316" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">—</div>
              )}
            </div>
          </div>

          {/* Global status */}
          <div className="rounded border border-[#1f1f1f] bg-[#0d0d0d]">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] px-4 py-2">
              <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                <Globe className="h-3 w-3" />
                Status global
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={runGlobalCheck}
                disabled={globalCheck?.loading || (!target.trim() && !toolInput.trim())}
                className="h-7 text-xs"
              >
                {globalCheck?.loading ? "..." : "Verificar"}
              </Button>
            </div>
            <div className="max-h-52 overflow-auto">
              {globalCheck?.nodes && globalCheck.nodes.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#0d0d0d]">
                    <tr className="border-b border-[#1f1f1f]">
                      <th className="p-2 text-left font-medium text-muted-foreground">Local</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Result</th>
                      <th className="p-2 text-right font-medium text-muted-foreground">Time</th>
                      <th className="p-2 text-center font-medium text-muted-foreground">Code</th>
                      <th className="p-2 font-mono text-muted-foreground">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {globalCheck.nodes.map((row, i) => (
                      <tr key={i} className="border-b border-[#171717] hover:bg-[#141414]">
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
                className="block border-t border-[#1f1f1f] px-4 py-2 text-[10px] text-[#f97316] hover:underline"
              >
                Check-Host →
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
