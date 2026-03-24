import { useEffect, useRef, useState } from 'react'

import { apiFetch } from '../../lib/api'
import type { BirdviewCommandResult, CommandPreview } from '../../modules/commands'
import { useSurfaceUi } from '../admin/surface-ui-context'
import { DropletRenderer } from '../droplets/DropletRenderer'

type WorkspaceChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  preview: CommandPreview | null
}

export function WorkspaceChat({
  tenantId,
  companyName,
  themeLabel,
  queuedCommand,
  onQueuedCommandHandled,
}: {
  tenantId: string | null
  companyName: string
  themeLabel: string
  queuedCommand: string | null
  onQueuedCommandHandled: () => void
}) {
  const ui = useSurfaceUi()
  const [input, setInput] = useState('/help')
  const [messages, setMessages] = useState<WorkspaceChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `You are in ${companyName}. Use slash commands to explore ${themeLabel.toLowerCase()} and active droplets.`,
      preview: null,
    },
  ])
  const runningQueuedCommand = useRef<string | null>(null)

  async function runCommand(command: string) {
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', text: command, preview: null },
    ])

    if (!tenantId) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: 'This workspace company is not linked to a tenant yet, so commands are unavailable.',
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
          text: error instanceof Error ? error.message : 'Command execution failed.',
          preview: null,
        },
      ])
    }
  }

  useEffect(() => {
    if (!queuedCommand || runningQueuedCommand.current === queuedCommand) {
      return
    }

    runningQueuedCommand.current = queuedCommand
    setInput('')
    void runCommand(queuedCommand).finally(() => {
      onQueuedCommandHandled()
    })
  }, [onQueuedCommandHandled, queuedCommand, tenantId])

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `You are in ${companyName}. Use slash commands to explore ${themeLabel.toLowerCase()} and active droplets.`,
        preview: null,
      },
    ])
  }, [companyName, themeLabel])

  return (
    <section className={`flex min-h-[78vh] flex-col overflow-hidden ${ui.panelClass}`}>
      <div className={`border-b px-6 py-5 ${ui.mode === 'dark' ? 'border-white/10' : 'border-slate-200'}`}>
        <p className={ui.headerEyebrowClass}>
          Workspace Chat
        </p>
        <h2 className={`mt-3 text-2xl font-semibold ${ui.panelTitleClass}`}>{themeLabel}</h2>
        <p className={`mt-2 text-sm ${ui.panelDescriptionClass}`}>
          Chat-first exploration with slash commands and inline droplet rendering.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {messages.map((message) => (
          <article
            key={message.id}
            className={message.role === 'user' ? 'ml-auto max-w-3xl' : 'mr-auto max-w-4xl'}
          >
            <div
              className={`rounded-[1.35rem] border px-4 py-3.5 ${
                message.role === 'user'
                  ? 'border-blue-200 bg-blue-50 text-slate-900'
                  : ui.mode === 'dark'
                    ? 'border-white/10 bg-white/[0.03] text-slate-100'
                    : 'border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
            </div>
            {message.preview ? (
              <div className="mt-3">
                <DropletRenderer preview={message.preview} />
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <form
        className={`border-t px-6 py-5 ${ui.mode === 'dark' ? 'border-white/10' : 'border-slate-200'}`}
        onSubmit={(event) => {
          event.preventDefault()
          const command = input.trim()
          if (!command) return
          setInput('')
          void runCommand(command)
        }}
      >
        <div className={`rounded-[1.5rem] border p-3 ${ui.mode === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-slate-300 bg-white'} shadow-sm`}>
          <textarea
            className={`min-h-[68px] w-full resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none ${ui.mode === 'dark' ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`}
            placeholder="/help"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className={`text-xs ${ui.panelDescriptionClass}`}>Slash commands, mixed responses, and droplets inline.</p>
            <button className={ui.primaryButtonClass}>
              Send
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}
