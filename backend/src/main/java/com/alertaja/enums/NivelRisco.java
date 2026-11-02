package com.alertaja.enums;

public enum NivelRisco {
    NORMAL(0),
    ATENCAO(1),
    ALERTA(2),
    PERIGO(3);

    private final int severidade;

    NivelRisco(int severidade) {
        this.severidade = severidade;
    }

    public int getSeveridade() {
        return severidade;
    }

    public boolean isRisco() {
        return this != NORMAL;
    }

    public static NivelRisco maiorRisco(NivelRisco a, NivelRisco b) {
        if (a == null) return b != null ? b : NORMAL;
        if (b == null) return a;
        return a.severidade >= b.severidade ? a : b;
    }
}
