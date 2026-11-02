package com.alertaja.exception;

public class EmailJaCadastradoException extends RuntimeException {
    public EmailJaCadastradoException(String email) {
        super("O e-mail informado já está cadastrado no sistema: " + email);
    }
}
