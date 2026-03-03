"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Target,
  Zap,
  Activity,
  Server,
  Settings,
  FileText,
  BarChart3,
  Wifi,
  Wrench,
} from "lucide-react"
import { LAYER7_METHODS, LAYER4_METHODS, DEFAULT_CONFIG, METHOD_LABELS } from "@/lib/config"
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
  const [toolsTab, setToolsTab] = useState(false)
  const [toolInput, setToolInput] = useState("")
  const [toolResult, setToolResult] = useState<string | null>(null)
  const [toolLoading, setToolLoading] = useState(false)

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
    const iv = setInterval(fetchState, 2000)
    return () => clearInterval(iv)
  }, [state?.running, fetchState])

  useEffect(() => {
    if (methodType === "layer7") {
      setMethod("GET")
    } else {
      setMethod("TCP")
    }
  }, [methodType])

  const start = async () => {
    if (!target.trim()) return
    setLoading(true)
    try {
      await fetch("/api/attack/start", {
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
      await fetchState()
    } finally {
      setLoading(false)
    }
  }

  const stop = async () => {
    await fetch("/api/attack/stop", { method: "POST" })
    await fetchState()
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
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between border-b border-border/50 pb-6">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Silence</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setToolsTab(!toolsTab)}
            className="gap-2"
          >
            <Wrench className="h-4 w-4" />
            Tools
          </Button>
        </header>

        {toolsTab && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wrench className="h-4 w-4" />
                Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Input (domain/url)</Label>
                <Input
                  placeholder="exemplo.com ou https://site.com"
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["CFIP", "DNS", "TSSRV", "PING", "CHECK", "CHECKHOST", "DSTAT"].map((t) => {
                  const ToolIcon = TOOL_ICONS[t] || Wrench
                  return (
                    <Button
                      key={t}
                      variant="outline"
                      size="sm"
                      onClick={() => runTool(t)}
                      disabled={toolLoading}
                      className="gap-2"
                    >
                      <ToolIcon className="h-4 w-4" />
                      {t}
                    </Button>
                  )
                })}
              </div>
              {toolResult && (
                <ScrollArea className="h-64 rounded border border-border/50 p-3 font-mono text-xs">
                  <pre className="whitespace-pre-wrap">{toolResult}</pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4" />
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Tipo
                  </Label>
                  <Select
                    value={methodType}
                    onValueChange={(v) => setMethodType(v as "layer7" | "layer4")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="layer7">
                        <span className="flex items-center gap-2">
                          <Layer7Icon className="h-4 w-4 shrink-0" />
                          Layer 7
                        </span>
                      </SelectItem>
                      <SelectItem value="layer4">
                        <span className="flex items-center gap-2">
                          <Layer4Icon className="h-4 w-4 shrink-0" />
                          Layer 4
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Método
                  </Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      {methods.map((m) => {
                        const Icon = METHOD_ICONS[m] || Zap
                        return (
                          <SelectItem key={m} value={m}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4 shrink-0" />
                              {m} {METHOD_LABELS[m] ? `| ${METHOD_LABELS[m]}` : ""}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Alvo (URL ou IP:porta)</Label>
                <Input
                  placeholder="https://exemplo.com ou 192.168.1.1:80"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  disabled={!!state?.running}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Threads</Label>
                  <Input
                    type="number"
                    value={threads}
                    onChange={(e) => setThreads(parseInt(e.target.value) || 500)}
                    disabled={!!state?.running}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5" title="Requests Per Connection - requisições por conexão antes de abrir nova">
                    RPC
                    <span className="text-muted-foreground text-xs font-normal">(req/conexão)</span>
                  </Label>
                  <Input
                    type="number"
                    value={rpc}
                    onChange={(e) => setRpc(parseInt(e.target.value) || 50)}
                    disabled={!!state?.running}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (s)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                    disabled={!!state?.running}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={start}
                  disabled={!!state?.running || loading}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Button>
                <Button
                  variant="outline"
                  onClick={stop}
                  disabled={!state?.running}
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4" />
                Métricas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {state ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border/50 p-3">
                      <p className="text-xs text-muted-foreground">Requests</p>
                      <p className="text-2xl font-bold">{formatNum(state.requests)}</p>
                    </div>
                    <div className="rounded-lg border border-border/50 p-3">
                      <p className="text-xs text-muted-foreground">Bytes</p>
                      <p className="text-2xl font-bold">{formatBytes(state.bytes)}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/50 p-3">
                    <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Wifi className="h-3 w-3" />
                      Ping (ms)
                    </p>
                    {pingChartData.length > 0 ? (
                      <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={pingChartData}>
                            <Area
                              type="monotone"
                              dataKey="ms"
                              stroke="hsl(263 70% 50%)"
                              fill="hsl(263 70% 50% / 0.2)"
                            />
                            <YAxis hide domain={[0, "auto"]} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aguardando...</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma ação ativa</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4" />
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              {state ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reqChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="time" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => formatNum(v)} />
                      <Tooltip formatter={(v) => formatNum(Number(v))} />
                      <Line
                        type="monotone"
                        dataKey="requests"
                        stroke="hsl(263 70% 50%)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum dado</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 rounded-md border border-border/50 p-3 font-mono text-xs">
                {(state?.logs ?? []).length > 0 ? (
                  (state?.logs ?? []).map((log, i) => (
                    <div key={i} className="py-0.5">
                      {log}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Aguardando logs...</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
