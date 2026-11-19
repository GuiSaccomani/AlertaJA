import os
import oracledb
def conectar():
    return oracledb.connect(user=os.getenv("ORACLE_USER", "SEU_RM"), password=os.getenv("ORACLE_PASSWORD", "SUA_SENHA"),
                            dsn=oracledb.makedsn("oracle.fiap.com.br", 1521, sid="ORCL"))
