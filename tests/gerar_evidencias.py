# -*- coding: utf-8 -*-
"""Gera resultados.csv e evidencias_api.html a partir das execuções do Newman."""
import json, re, csv, html, sys, os

base = sys.argv[1]
col = json.load(open(os.path.join(base, "AlertaJa.postman_collection.json"), encoding="utf-8"))
meta = {}
for f in col["item"]:
    for it in f["item"]:
        tests = " ".join(it["event"][-1]["script"]["exec"])
        m = re.search(r"have\.status\((\d+)\)", tests)
        meta[it["name"]] = {"pasta": f["name"], "esperado": m.group(1) if m else "",
                            "desc": it["request"]["description"],
                            "body": it["request"].get("body", {}).get("raw", "")}

def carregar(p):
    run = json.load(open(p, encoding="utf-8"))["run"]
    res = {}
    for ex in run["executions"]:
        nome = ex["item"]["name"]
        r = ex.get("response") or {}
        corpo = bytes((r.get("stream") or {}).get("data", [])).decode("utf-8", "replace")
        asserts = [(a["assertion"], "error" not in a) for a in ex.get("assertions", [])]
        u = ex["request"]["url"]
        url = "/" + "/".join(u.get("path", []))
        hdrs = {h["key"]: h["value"] for h in ex["request"].get("header", []) if not h.get("disabled")}
        res[nome] = {"metodo": ex["request"]["method"], "url": url, "codigo": r.get("code"),
                     "status": r.get("status"), "tempo": r.get("responseTime"), "corpo": corpo,
                     "asserts": asserts, "ok": all(x[1] for x in asserts),
                     "auth": (ex["request"].get("auth") or {}).get("type", "noauth"),
                     "apikey": "X-API-Key" in hdrs}
    return res

r1 = carregar(os.path.join(base, "run1", "resultado.json"))
r2 = carregar(os.path.join(base, "run2", "resultado.json"))

with open(os.path.join(base, "resultados.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f, delimiter=";")
    w.writerow(["id", "caso_de_teste", "modulo", "metodo", "endpoint", "status_esperado",
                "exec1_status_obtido", "exec1_resultado", "exec2_status_obtido", "exec2_resultado",
                "exec2_tempo_ms", "assercoes_exec2"])
    for nome, m in meta.items():
        a, b = r1.get(nome, {}), r2[nome]
        cid, titulo = nome.split(" - ", 1)
        w.writerow([cid, titulo, m["pasta"].split(" - ", 1)[1], b["metodo"], b["url"], m["esperado"],
                    a.get("codigo", ""), "PASS" if a.get("ok") else "FAIL",
                    b["codigo"], "PASS" if b["ok"] else "FAIL", b["tempo"],
                    f'{sum(x[1] for x in b["asserts"])}/{len(b["asserts"])}'])

def fmt(t, lim=900):
    try: t = json.dumps(json.loads(t), ensure_ascii=False, indent=2)
    except Exception: pass
    if len(t) > lim: t = t[:lim] + "\n... (truncado)"
    return html.escape(t)

def mask(t):
    return re.sub(r'(eyJ[\w-]{10})[\w.-]+', r'\1…', t)

cards, pasta_atual = [], None
tot1 = sum(1 for n in meta if r1.get(n, {}).get("ok"))
tot2 = sum(1 for n in meta if r2[n]["ok"])
a2 = sum(len(r2[n]["asserts"]) for n in meta)
for nome, m in meta.items():
    if m["pasta"] != pasta_atual:
        pasta_atual = m["pasta"]; cards.append(f'<h2>{html.escape(pasta_atual)}</h2>')
    b, a = r2[nome], r1.get(nome, {})
    cls = "pass" if b["ok"] else "fail"
    auth = {"bearer": "Authorization: Bearer &lt;JWT&gt;", "noauth": "sem token"}.get(b["auth"], b["auth"])
    if b["apikey"]: auth += " · X-API-Key"
    hist = "" if a.get("ok", True) == b["ok"] else \
        f'<div class="hist">Execução 1 (código original): <b>FAIL</b> — HTTP {a.get("codigo")} · corrigido na execução 2</div>'
    body = f'<pre class="req">{fmt(m["body"])}</pre>' if m["body"] else ""
    asserts = "".join(f'<li class="{"ok" if ok else "ko"}">{"✔" if ok else "✘"} {html.escape(t)}</li>' for t, ok in b["asserts"])
    cards.append(f'''<div class="card {cls}"><div class="hd"><span class="id">{nome.split(" - ")[0]}</span>
<span class="t">{html.escape(nome.split(" - ",1)[1])}</span><span class="badge {cls}">{"PASS" if b["ok"] else "FAIL"}</span></div>
<p class="d">{html.escape(m["desc"])}</p>
<div class="line"><span class="m {b["metodo"]}">{b["metodo"]}</span><code>{html.escape(b["url"])}</code><span class="au">{auth}</span></div>
{body}<div class="line"><b>Esperado:</b> HTTP {m["esperado"]} &nbsp;·&nbsp; <b>Obtido:</b> HTTP {b["codigo"]} {html.escape(b["status"] or "")} &nbsp;·&nbsp; {b["tempo"]} ms</div>
<pre class="res">{mask(fmt(b["corpo"]))}</pre><ul>{asserts}</ul>{hist}</div>''')

page = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Evidências dos testes de API</title><style>
body{{font-family:Segoe UI,Arial,sans-serif;margin:0;background:#f1f5f9;color:#0f172a}}
header{{background:#0f172a;color:#fff;padding:22px 32px}} header h1{{margin:0;font-size:22px}} header p{{margin:6px 0 0;color:#94a3b8;font-size:13px}}
.kpis{{display:flex;gap:12px;padding:16px 32px}} .k{{background:#fff;border-radius:10px;padding:12px 16px;flex:1;border:1px solid #e2e8f0}}
.k b{{font-size:22px;display:block}} .k span{{font-size:12px;color:#64748b}}
main{{padding:0 32px 32px}} h2{{font-size:16px;margin:22px 0 8px;color:#334155;border-bottom:2px solid #cbd5e1;padding-bottom:4px}}
.card{{background:#fff;border:1px solid #e2e8f0;border-left:5px solid #16a34a;border-radius:8px;padding:12px 14px;margin:10px 0;break-inside:avoid}}
.card.fail{{border-left-color:#dc2626}} .hd{{display:flex;align-items:center;gap:10px}} .id{{font-weight:700;color:#475569}}
.t{{font-weight:600;flex:1}} .badge{{font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;color:#fff;background:#16a34a}} .badge.fail{{background:#dc2626}}
.d{{margin:4px 0 6px;color:#64748b;font-size:12.5px}} .line{{font-size:12.5px;margin:4px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}}
.m{{font-weight:700;font-size:11px;padding:2px 6px;border-radius:4px;color:#fff;background:#2563eb}} .m.POST{{background:#d97706}} .m.PUT{{background:#7c3aed}} .m.DELETE{{background:#dc2626}} .m.GET{{background:#16a34a}}
.au{{color:#64748b;font-size:11.5px;margin-left:auto}} pre{{margin:4px 0;padding:8px 10px;border-radius:6px;font-size:11px;white-space:pre-wrap;word-break:break-all;max-height:220px;overflow:hidden}}
pre.req{{background:#fff7ed;border:1px solid #fed7aa}} pre.res{{background:#0f172a;color:#e2e8f0}}
ul{{margin:4px 0;padding-left:0;list-style:none;font-size:12px}} li.ok{{color:#15803d}} li.ko{{color:#b91c1c}}
.hist{{margin-top:6px;font-size:12px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:6px 8px;border-radius:6px}}
</style></head><body><header><h1>AlertaJá — Evidências dos testes de API (Postman/Newman)</h1>
<p>Coleção AlertaJa.postman_collection.json · executada por linha de comando com Newman contra https://localhost:7275 (ASP.NET Core 10 + Oracle 19c FIAP) · 19/11/2026</p></header>
<div class="kpis"><div class="k"><b>{len(meta)}</b><span>casos de teste (requisições)</span></div>
<div class="k"><b>{a2}</b><span>asserções automatizadas</span></div>
<div class="k"><b style="color:#dc2626">{tot1}/{len(meta)}</b><span>Execução 1 — código original</span></div>
<div class="k"><b style="color:#16a34a">{tot2}/{len(meta)}</b><span>Execução 2 — após correções</span></div></div>
<main>{"".join(cards)}</main></body></html>'''
open(os.path.join(base, "evidencias_api.html"), "w", encoding="utf-8").write(page)
print("exec1", tot1, "exec2", tot2, "de", len(meta))
