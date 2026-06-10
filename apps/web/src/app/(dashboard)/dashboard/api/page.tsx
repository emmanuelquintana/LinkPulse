"use client";

import React, { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { localizeApiError } from "@/lib/api-errors";
import { useTranslation } from "@/i18n/I18nProvider";
import { sileo } from "sileo";
import { useConfirm } from "@/components/ConfirmProvider";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const SWAGGER_URL = API_BASE.replace(/\/api\/v\d+$/, "") + "/docs";

interface Workspace {
  id: string;
  name: string;
}

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

/** Bloque de código oscuro con botón de copiar. */
function CodeBlock({ code }: { code: string }) {
  const t = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 text-[13px] leading-relaxed rounded-2xl p-5 overflow-x-auto font-mono whitespace-pre">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      >
        {copied ? t.apiPage.copied : t.apiPage.copy}
      </button>
    </div>
  );
}

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={`text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0 ${
        method === "POST"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-sky-100 text-sky-700"
      }`}
    >
      {method}
    </span>
  );
}

export default function ApiPage() {
  const t = useTranslation();
  const confirm = useConfirm();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchApi("/workspaces");
        const data = res?.data ?? res;
        if (Array.isArray(data) && data.length) {
          setWorkspaces(data);
          setSelectedWorkspace(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
      }
    })();
  }, []);

  const loadKeys = useCallback(async () => {
    if (!selectedWorkspace) return;
    setLoadingKeys(true);
    try {
      const res = await fetchApi(`/api-keys?workspaceId=${selectedWorkspace}`);
      const data = res?.data ?? res;
      setKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      sileo.error({ title: t.apiPage.keyError, description: localizeApiError(err, t) });
    } finally {
      setLoadingKeys(false);
    }
  }, [selectedWorkspace, t]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !selectedWorkspace) return;
    setCreating(true);
    try {
      const res = await fetchApi("/api-keys", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: selectedWorkspace,
          name: newKeyName.trim(),
        }),
      });
      const data = res?.data ?? res;
      setRevealedKey(data.key);
      setKeyCopied(false);
      setNewKeyName("");
      await loadKeys();
    } catch (err) {
      sileo.error({ title: t.apiPage.keyError, description: localizeApiError(err, t) });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (key: ApiKeyRow) => {
    const ok = await confirm({
      title: t.apiPage.revoke,
      description: t.apiPage.revokeConfirm,
      confirmLabel: t.apiPage.revoke,
      variant: "danger",
    });
    if (!ok) return;
    try {
      await fetchApi(`/api-keys/${key.id}?workspaceId=${selectedWorkspace}`, {
        method: "DELETE",
      });
      sileo.success({ title: t.apiPage.keyRevoked });
      await loadKeys();
    } catch (err) {
      sileo.error({ title: t.apiPage.keyError, description: localizeApiError(err, t) });
    }
  };

  const copyRevealed = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setKeyCopied(true);
    } catch {}
  };

  const endpoints: Array<{
    method: "GET" | "POST";
    path: string;
    desc: string;
    example: string;
    response: string;
  }> = [
    {
      method: "POST",
      path: "/public/links",
      desc: t.apiPage.ep1Desc,
      example: `curl -X POST ${API_BASE}/public/links \\
  -H "Authorization: Bearer lp_TU_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destination": "https://ejemplo.com/pagina-muy-larga",
    "title": "Promo verano",
    "alias": "promo-verano"
  }'`,
      response: `{
  "code": "LP_API_200",
  "message": "Operation Successful",
  "traceId": "9f2c1ab4d3e84f01",
  "data": {
    "id": "0b9f7c52-1d44-4a8e-9c63-2f1a8a7b1e10",
    "shortCode": "promo-verano",
    "shortUrl": "https://go.linkpulse.app/promo-verano",
    "destination": "https://ejemplo.com/pagina-muy-larga",
    "title": "Promo verano",
    "status": "ACTIVE",
    "createdAt": "2026-06-10T18:00:00.000Z"
  }
}`,
    },
    {
      method: "GET",
      path: "/public/links?page=1&limit=20",
      desc: t.apiPage.ep2Desc,
      example: `curl "${API_BASE}/public/links?page=1&limit=20" \\
  -H "x-api-key: lp_TU_API_KEY"`,
      response: `{
  "code": "LP_API_200",
  "message": "Operation Successful",
  "traceId": "c4d19e72aa3b4c55",
  "data": [
    {
      "id": "0b9f7c52-1d44-4a8e-9c63-2f1a8a7b1e10",
      "shortCode": "promo-verano",
      "shortUrl": "https://go.linkpulse.app/promo-verano",
      "destination": "https://ejemplo.com/pagina-muy-larga",
      "title": "Promo verano",
      "status": "ACTIVE",
      "clicks": 1284,
      "createdAt": "2026-06-10T18:00:00.000Z"
    }
  ],
  "metadata": { "page": 1, "size": 20, "elements": 42 }
}`,
    },
    {
      method: "GET",
      path: "/public/links/:id",
      desc: t.apiPage.ep3Desc,
      example: `curl "${API_BASE}/public/links/0b9f7c52-1d44-4a8e-9c63-2f1a8a7b1e10" \\
  -H "x-api-key: lp_TU_API_KEY"`,
      response: `{
  "code": "LP_API_200",
  "data": {
    "id": "0b9f7c52-1d44-4a8e-9c63-2f1a8a7b1e10",
    "shortCode": "promo-verano",
    "shortUrl": "https://go.linkpulse.app/promo-verano",
    "destination": "https://ejemplo.com/pagina-muy-larga",
    "status": "ACTIVE",
    "clicks": 1284
  }
}`,
    },
    {
      method: "GET",
      path: "/public/links/:id/stats",
      desc: t.apiPage.ep4Desc,
      example: `curl "${API_BASE}/public/links/0b9f7c52-.../stats" \\
  -H "x-api-key: lp_TU_API_KEY"`,
      response: `{
  "code": "LP_API_200",
  "data": {
    "linkId": "0b9f7c52-1d44-4a8e-9c63-2f1a8a7b1e10",
    "shortCode": "promo-verano",
    "totalClicks": 1284,
    "byCountry": [
      { "country": "MX", "clicks": 812 },
      { "country": "US", "clicks": 304 }
    ],
    "byDevice": [
      { "device": "MOBILE", "clicks": 879 },
      { "device": "DESKTOP", "clicks": 405 }
    ],
    "recentClicks": [
      {
        "clickedAt": "2026-06-10T17:58:21.000Z",
        "country": "MX",
        "city": "CDMX",
        "deviceType": "MOBILE",
        "browser": "Chrome",
        "os": "Android",
        "referer": "https://instagram.com"
      }
    ]
  }
}`,
    },
  ];

  const errorRows: Array<{ code: string; desc: string }> = [
    { code: "400", desc: t.apiPage.err400 },
    { code: "401", desc: t.apiPage.err401 },
    { code: "404", desc: t.apiPage.err404 },
    { code: "409", desc: t.apiPage.err409 },
  ];

  return (
    <div className="max-w-5xl mx-auto font-sans pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {t.apiPage.title}
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
            {t.apiPage.subtitle}
          </p>
        </div>
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>

      {/* ===== API KEYS ===== */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">key</span>
          </span>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            {t.apiPage.keysTitle}
          </h3>
        </div>
        <p className="text-sm font-medium text-gray-500 mb-6 max-w-2xl">
          {t.apiPage.keysText}
        </p>

        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 mb-8">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={t.apiPage.keyNamePlaceholder}
            required
            className="flex-1 h-12 px-5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={creating || !newKeyName.trim()}
            className="h-12 px-6 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {creating ? t.apiPage.creatingKey : t.apiPage.createKey}
          </button>
        </form>

        {loadingKeys ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <p className="text-center text-sm font-medium text-gray-400 py-8">
            {t.apiPage.noKeys}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="py-3 pr-4">{t.apiPage.keyName}</th>
                  <th className="py-3 pr-4">{t.apiPage.colKey}</th>
                  <th className="py-3 pr-4">{t.apiPage.colCreated}</th>
                  <th className="py-3 pr-4">{t.apiPage.colLastUsed}</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-4 pr-4 text-sm font-black text-gray-900">{k.name}</td>
                    <td className="py-4 pr-4">
                      <code className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">
                        {k.keyPrefix}••••••••
                      </code>
                    </td>
                    <td className="py-4 pr-4 text-xs font-bold text-gray-400">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 pr-4 text-xs font-bold text-gray-400">
                      {k.lastUsedAt
                        ? new Date(k.lastUsedAt).toLocaleString()
                        : t.apiPage.never}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleRevoke(k)}
                        className="text-xs font-black text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-all"
                      >
                        {t.apiPage.revoke}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== DOCS ===== */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </span>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              {t.apiPage.docsTitle}
            </h3>
          </div>
          <p className="text-sm font-medium text-gray-500">{t.apiPage.docsText}</p>
        </div>

        {/* Base URL */}
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
            {t.apiPage.baseUrl}
          </h4>
          <CodeBlock code={API_BASE} />
        </div>

        {/* Auth */}
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
            {t.apiPage.authTitle}
          </h4>
          <p className="text-sm font-medium text-gray-500 mb-3">{t.apiPage.authText}</p>
          <CodeBlock
            code={`# Opción 1
Authorization: Bearer lp_TU_API_KEY

# Opción 2
x-api-key: lp_TU_API_KEY`}
          />
          <div className="mt-4">
            <CodeBlock
              code={`// JavaScript / Node.js
const res = await fetch("${API_BASE}/public/links", {
  headers: { "x-api-key": process.env.LINKPULSE_API_KEY },
});
const { data } = await res.json();`}
            />
          </div>
        </div>

        {/* Envelope */}
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
            {t.apiPage.envelopeTitle}
          </h4>
          <p className="text-sm font-medium text-gray-500 mb-3">
            {t.apiPage.envelopeText}
          </p>
          <CodeBlock
            code={`{
  "code": "LP_API_200",        // código interno
  "message": "Operation Successful",
  "traceId": "9f2c1ab4d3e84f01", // útil para soporte
  "data": { ... },              // el recurso solicitado
  "metadata": { "page": 1, "size": 20, "elements": 42 } // solo listados
}`}
          />
        </div>

        {/* Endpoints */}
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            {t.apiPage.endpointsTitle}
          </h4>
          <div className="space-y-6">
            {endpoints.map((ep) => (
              <div
                key={ep.method + ep.path}
                className="border border-gray-100 rounded-2xl overflow-hidden"
              >
                <div className="flex items-center gap-3 px-5 py-4 bg-gray-50/70 border-b border-gray-100">
                  <MethodBadge method={ep.method} />
                  <code className="text-sm font-black text-gray-900 break-all">
                    {ep.path}
                  </code>
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-sm font-medium text-gray-500">{ep.desc}</p>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      {t.apiPage.exampleRequest}
                    </p>
                    <CodeBlock code={ep.example} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      {t.apiPage.exampleResponse}
                    </p>
                    <CodeBlock code={ep.response} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Errors */}
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            {t.apiPage.errorsTitle}
          </h4>
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            {errorRows.map((row, i) => (
              <div
                key={row.code}
                className={`flex items-center gap-4 px-5 py-3.5 ${i % 2 ? "bg-gray-50/60" : "bg-white"}`}
              >
                <code className="text-xs font-black bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg shrink-0">
                  {row.code}
                </code>
                <span className="text-sm font-medium text-gray-600">{row.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Swagger + Webhooks */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={SWAGGER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-14 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            {t.apiPage.swaggerCta}
          </a>
          <div className="flex-1 flex items-center gap-3 h-14 px-5 bg-amber-50 border border-amber-100 rounded-2xl">
            <span className="material-symbols-outlined text-amber-500">webhook</span>
            <div className="min-w-0">
              <p className="text-xs font-black text-amber-700 uppercase tracking-widest">
                {t.apiPage.webhooksTitle}
              </p>
              <p className="text-[11px] font-medium text-amber-600 truncate">
                {t.apiPage.webhooksSoon}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== REVEAL-ONCE MODAL ===== */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-gray-200 animate-in zoom-in-95 duration-200 p-7">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined">key</span>
              </span>
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {t.apiPage.keyCreatedTitle}
                </h3>
                <p className="text-xs font-bold text-amber-600">
                  {t.apiPage.keyCreatedWarning}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-900 rounded-xl p-4">
              <code className="flex-1 text-emerald-300 text-sm font-mono break-all">
                {revealedKey}
              </code>
              <button
                onClick={copyRevealed}
                className="shrink-0 text-[10px] font-black uppercase tracking-widest bg-white/10 text-gray-200 hover:bg-white/20 px-3 py-2 rounded-lg transition-all"
              >
                {keyCopied ? t.apiPage.copied : t.apiPage.copy}
              </button>
            </div>

            <button
              onClick={() => setRevealedKey(null)}
              className="mt-6 w-full h-12 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
            >
              {t.apiPage.done}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
