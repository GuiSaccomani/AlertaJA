package com.alertaja.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegiaoRequest(
    @NotBlank(message = "O nome da região é obrigatório")
    @Size(min = 2, max = 100, message = "O nome da região deve ter entre 2 e 100 caracteres")
    String nome,

    @NotBlank(message = "A cidade é obrigatória")
    @Size(min = 2, max = 100, message = "A cidade deve ter entre 2 e 100 caracteres")
    String cidade,

    @NotBlank(message = "O estado (UF) é obrigatório")
    @Pattern(regexp = "^[A-Z]{2}$", message = "O estado deve conter exatamente 2 letras maiúsculas (ex: SP, RJ)")
    String estado
) {}
