# -*- coding: utf-8 -*-
"""
Valida os scripts SQL do AlertaJá no Oracle sem tocar nas tabelas reais:
 1. Cria cópias das tabelas com prefixo QA_ executando db_ddl.sql
 2. Executa db_dml.sql (carga inicial) nessas cópias
 3. Executa consultas.sql nas cópias e também nas tabelas reais (dados vivos)
 4. Remove as tabelas QA_
Gera um log de evidências.
"""
import re, sys, datetime
from conn import conectar

TABELAS = ["usuarios", "regioes", "sensores", "medicoes", "alertas"]

def para_qa(sql):
    for t in TABELAS:
        sql = re.sub(r'"%s"' % t.upper(), "QA_" + t.upper(), sql)
        sql = re.sub(r'\b%s\b' % t, "qa_" + t, sql, flags=re.I)
    return re.sub(r'\b(uk|chk|fk|idx)_', r'qa_\1_', sql, flags=re.I)

def comandos(texto):
    texto = "\n".join(l for l in texto.splitlines() if not l.strip().startswith("--"))
    # divide apenas em ";" no fim da linha (há ";" dentro de textos do DML)
    for c in re.split(r";[ \t]*(?:\n|$)", texto):
        c = c.strip()
        if c and c.upper() != "COMMIT":
            yield c

def tabela(cur, sql, log, limite=40):
    cur.execute(sql)
    cols = [d[0] for d in cur.description]
    linhas = [["" if v is None else str(v) for v in r] for r in cur.fetchall()]
    larg = [max(len(c), *(len(l[i]) for l in linhas)) if linhas else len(c) for i, c in enumerate(cols)]
    fmt = " | ".join("{:<%d}" % w for w in larg)
    log(fmt.format(*cols)); log("-+-".join("-" * w for w in larg))
    for l in linhas[:limite]:
        log(fmt.format(*l))
    log(f"({len(linhas)} linha(s))")
    return len(linhas)

def main(saida):
    out = open(saida, "w", encoding="utf-8")
    def log(s=""):
        print(s); out.write(s + "\n")
    con = conectar(); cur = con.cursor()
    log(f"VALIDAÇÃO DOS SCRIPTS SQL - ALERTAJÁ  |  {datetime.datetime.now():%d/%m/%Y %H:%M:%S}")
    log(f"Servidor Oracle {con.version} - oracle.fiap.com.br:1521/ORCL")
    log("=" * 100)
    for t in reversed(TABELAS):
        try: cur.execute(f"DROP TABLE qa_{t} CASCADE CONSTRAINTS PURGE")
        except Exception: pass

    erros = 0
    for nome in ("db_ddl.sql", "db_dml.sql"):
        log(f"\n>>> Executando {nome} (em tabelas QA_*)")
        ok = 0
        for c in comandos(open(nome, encoding="utf-8").read()):
            try:
                cur.execute(para_qa(c)); ok += 1
                if nome == "db_ddl.sql":
                    log("  OK  " + " ".join(c.split()[:3]))
            except Exception as e:
                erros += 1; log(f"  ERRO {e}\n       {c[:120]}")
        con.commit()
        log(f"  {ok} comando(s) executado(s) com sucesso em {nome}")

    log("\n>>> Contagem de registros após a carga inicial")
    for t in TABELAS:
        n = cur.execute(f"SELECT COUNT(*) FROM qa_{t}").fetchone()[0]
        log(f"  QA_{t.upper():<10} {n:>3} registro(s)")

    consultas = open("consultas.sql", encoding="utf-8").read()
    blocos = re.findall(r"-- (C\d\..*?)\n.*?(SELECT.*?);", consultas, flags=re.S)
    for alvo, conv in (("TABELAS QA_* (carga inicial do db_dml.sql)", para_qa),
                       ("TABELAS REAIS (dados vivos, após testes e simulações IoT)", lambda s: s)):
        log("\n" + "=" * 100); log(f"CONSULTAS DE USO - {alvo}"); log("=" * 100)
        for titulo, sql in blocos:
            log(f"\n[{titulo.strip()}]")
            try: tabela(cur, conv(sql), log)
            except Exception as e:
                erros += 1; log(f"  ERRO {e}")

    log("\n>>> Removendo tabelas QA_*")
    for t in reversed(TABELAS):
        cur.execute(f"DROP TABLE qa_{t} CASCADE CONSTRAINTS PURGE")
    log("  Tabelas temporárias removidas.")
    log("\n" + ("RESULTADO: TODOS OS SCRIPTS EXECUTARAM SEM ERROS" if erros == 0
                else f"RESULTADO: {erros} ERRO(S) ENCONTRADO(S)"))
    out.close()
    sys.exit(1 if erros else 0)

if __name__ == "__main__":
    main(sys.argv[1])
