"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Mail, ShieldCheck } from "lucide-react";

export function AuthScreen({ allowSuperuserShortcut = false }: { allowSuperuserShortcut?: boolean }) {
  const [email, setEmail] = useState("");
  const [previewLink, setPreviewLink] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, startTransition] = useTransition();

  async function requestMagicLink() {
    setError("");
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json() as { error?: string; magicLinkPreview?: string; expiresAt?: string };
      if (!response.ok) {
        setError(body.error ?? "Nao foi possivel gerar o link de login.");
        return;
      }
      setPreviewLink(body.magicLinkPreview ?? "");
      setMessage(body.magicLinkPreview
        ? `Link gerado localmente. Expira em ${body.expiresAt ?? "breve"}.`
        : "Link de login enviado por email.");
    });
  }

  async function shortcutSuperuserLogin() {
    setError("");
    setMessage("");
    setPreviewLink("");
    startTransition(async () => {
      const response = await fetch("/api/auth/superuser-shortcut", {
        method: "POST",
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Nao foi possivel entrar como superuser.");
        return;
      }
      window.location.href = "/";
    });
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#07131c,#0b202b)] px-4 py-10 text-white">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(13,38,49,0.96),rgba(7,23,34,0.78))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-emerald-200/90">
            <ShieldCheck size={14} />
            Secure access
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">SimStock</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            A app passou a exigir autenticacao por email antes de permitir acesso ao portfolio, trading, estrategias,
            agentes e backoffice.
          </p>
          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-medium text-white">Como entrar</div>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <div>1. Introduz o email de um utilizador existente.</div>
              <div>2. Pede um codigo temporario.</div>
              <div>3. Introduz o codigo para abrir uma sessao segura.</div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
            <Mail size={14} />
            Login by email
          </div>
          <div className="mt-6 space-y-4">
            <label className="block rounded-[24px] border border-white/8 bg-white/4 p-4">
              <div className="text-sm font-medium">Email</div>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="default@simstock.local"
                className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
              />
            </label>
            {previewLink ? (
              <div className="rounded-[20px] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                <div>Magic link local de teste:</div>
                <a
                  href={previewLink}
                  className="mt-2 inline-flex items-center gap-2 break-all text-amber-50 underline underline-offset-4"
                >
                  <ExternalLink size={14} />
                  {previewLink}
                </a>
              </div>
            ) : null}
            {message ? (
              <div className="rounded-[20px] border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-[20px] border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={saving || !email.trim()}
                onClick={() => void requestMagicLink()}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-950 disabled:opacity-50"
              >
                Enviar magic link
              </button>
              {allowSuperuserShortcut ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void shortcutSuperuserLogin()}
                  className="rounded-full border border-emerald-300/30 bg-emerald-300/12 px-5 py-2.5 text-sm font-medium text-emerald-100 disabled:opacity-50"
                >
                  Entrar como superuser
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
