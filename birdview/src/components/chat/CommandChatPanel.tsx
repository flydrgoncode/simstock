import { useState } from 'react'

import { apiFetch } from '../../lib/api'
import type { BirdviewCommandResult, CommandPreview } from '../../modules/commands'
import { useSurfaceUi } from '../admin/surface-ui-context'
import { DropletRenderer } from '../droplets/DropletRenderer'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  preview: CommandPreview | null
}

export function CommandChatPanel({
  tenantId,
  title,
}: {
  tenantId: string | null
  title: string
}) {
  const ui = useSurfaceUi()
  const [input, setInput] = useState('/help')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Use slash commands to explore active tenant droplets. Start with /help or /droplet list.',
      preview: null,
    },
  ])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const command = input.trim()
    if (!command) return

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', text: command, preview: null },
    ])
    setInput('')

    if (!tenantId) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'Select a tenant before using commands.',
          preview: null,
        },
      ])
      return
    }

    try {
      const response = await apiFetch<BirdviewCommandResult>(
        `/api/tenants/${tenantId}/commands/execute`,
        {
          method: 'POST',
          body: JSON.stringify({ command }),
        }
      )

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: response.summaryText,
          preview: response.preview,
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text:
            error instanceof Error
              ? error.message
              : 'Command execution failed.',
          preview: null,
        },
      ])
    }
  }

  return (
    <section className={ui.panelClass}>
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${ui.panelTitleClass}`}>{title}</h3>
        <p className={`mt-1 text-sm ${ui.panelDescriptionClass}`}>
          Slash-command exploration for active tenant droplets.
        </p>
      </div>
      <div className="max-h-[32rem] space-y-4 overflow-y-auto pr-1">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`space-y-3 rounded-2xl border px-4 py-3 ${
              message.role === 'user'
                ? 'border-blue-200 bg-blue-50'
                : ui.mode === 'dark'
                  ? 'border-white/10 bg-white/[0.03]'
                  : 'border-slate-200 bg-slate-50'
            }`}
          >
            <p className={`whitespace-pre-wrap text-sm ${ui.mode === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
              {message.text}
            </p>
            {message.preview ? <DropletRenderer preview={message.preview} /> : null}
          </article>
        ))}
      </div>
      <form className="mt-4 flex gap-3" onSubmit={handleSubmit}>
        <input
          className={`min-w-0 flex-1 ${ui.inputClass}`}
          placeholder="/help"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className={ui.primaryButtonClass}>
          Send
        </button>
      </form>
    </section>
  )
}
