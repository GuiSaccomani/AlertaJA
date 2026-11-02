package com.alertaja.controller;

import com.alertaja.dto.RegiaoRequest;
import com.alertaja.dto.RegiaoResponse;
import com.alertaja.service.RegiaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/regioes")
@Tag(name = "Regiões Monitoradas", description = "Endpoints para gerenciamento e consulta de regiões geográficas de risco")
@SecurityRequirement(name = "BearerAuth")
public class RegiaoController {

    private final RegiaoService regiaoService;

    public RegiaoController(RegiaoService regiaoService) {
        this.regiaoService = regiaoService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Criar Região", description = "Cadastra uma nova região monitorada. Restrito a ROLE_ADMIN.")
    public ResponseEntity<RegiaoResponse> criar(@Valid @RequestBody RegiaoRequest request) {
        RegiaoResponse response = regiaoService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar Região por ID", description = "Consulta os dados de uma região monitorada específica.")
    public ResponseEntity<RegiaoResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(regiaoService.buscarPorId(id));
    }

    @GetMapping
    @Operation(summary = "Listar Regiões", description = "Retorna lista paginada de regiões ativas (administradores podem usar incluirInativos=true).")
    public ResponseEntity<Page<RegiaoResponse>> listar(
        @RequestParam(required = false, defaultValue = "false") Boolean incluirInativos,
        @PageableDefault(size = 20, sort = "nome", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(regiaoService.listar(incluirInativos, pageable));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Atualizar Região", description = "Atualiza os dados de uma região ativa existente. Restrito a ROLE_ADMIN.")
    public ResponseEntity<RegiaoResponse> atualizar(
        @PathVariable Long id,
        @Valid @RequestBody RegiaoRequest request
    ) {
        return ResponseEntity.ok(regiaoService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Desativar Região (Soft Delete)", description = "Executa exclusão lógica da região e de seus sensores, preservando o histórico. Restrito a ROLE_ADMIN.")
    public ResponseEntity<Void> desativar(@PathVariable Long id) {
        regiaoService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reativar")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reativar Região", description = "Reativa uma região previamente desativada. Restrito a ROLE_ADMIN.")
    public ResponseEntity<RegiaoResponse> reativar(@PathVariable Long id) {
        return ResponseEntity.ok(regiaoService.reativar(id));
    }
}
