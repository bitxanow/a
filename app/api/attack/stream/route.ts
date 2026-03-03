import { getState, subscribe } from "@/lib/attack"

export const dynamic = "force-dynamic"

export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        const s = getState()
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(s)}\n\n`))
      }
      send()
      const unsub = subscribe(() => send())
      const iv = setInterval(send, 500)
      return () => {
        unsub()
        clearInterval(iv)
      }
    },
  })
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
