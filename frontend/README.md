# AlertaJá - Interface Web (Frontend)

> **AVISO IMPORTANTE / AMBIENTE ACADÊMICO:**  
> Este frontend é parte integrante do sistema acadêmico **AlertaJá**, desenvolvido para monitoramento hidrológico e simulação de resposta a riscos de alagamento.  
> Todas as leituras e gráficos apresentados são baseados em dados **FICTÍCIOS / SIMULADOS**.  
> **NÃO** deve ser utilizado como ferramenta de previsão oficial da Defesa Civil.

---

## 1. Visão Geral e Tecnologias

A interface web foi desenvolvida com foco em alta fidelidade visual, simulando um moderno centro integrado de comando e controle urbano contra desastres climáticos:

- **Framework & Linguagem:** React 19 com TypeScript
- **Build Tool:** Vite
- **Comunicação HTTP:** Axios com interceptors de autenticação JWT e tratamento global de 401/403
- **Roteamento:** React Router DOM (v7) com guardiões de rota (`AdminRoute`)
- **Design System:** Vanilla CSS com variáveis customizadas, Dark Theme (`#090d16` e `#0f172a`), badges semânticos de risco (`NORMAL`, `ATENCAO`, `ALERTA`, `PERIGO` com animação de pulso) e tipografia Google Inter
- **Ícones:** Lucide React

---

## 2. Telas Implementadas

| Rota | Tela | Funcionalidades |
| :--- | :--- | :--- |
| `/login` | **Login** | Autenticação por e-mail e senha, atalhos de preenchimento rápido (Admin e Cidadão Demo) e tratamento de erros. |
| `/cadastro` | **Cadastro** | Criação de contas de cidadão (`ROLE_CIDADAO`) com validação de senha e tratamento de e-mail duplicado. |
| `/dashboard` | **Dashboard Integrado** | Visão geral dos riscos, cartões de métricas, alertas abertos no momento, tabela de últimas medições e **polling automático a cada 10 segundos** com contador regressivo e botão manual de atualização. |
| `/regioes` | **Regiões** | Listagem das bacias monitoradas, busca por nome, filtro de ativas/inativas e paginação. |
| `/regioes/:id` | **Detalhes da Região** | Nível de risco da bacia, sensores vinculados com limiares e histórico de telemetria paginado. |
| `/alertas` | **Central de Alertas** | Listagem completa de ocorrências, filtros dinâmicos por nível e status (`ATIVO`, `RESOLVIDO_AUTO`, `RESOLVIDO_MANUAL`) e **resolução manual** exclusiva para administradores. |
| `/sensores` | **Rede de Sensores IoT** | Consulta de sensores pluviométricos e fluviométricos, limiares de risco configurados e horário da última leitura. |
| `/admin` | **Painel Administrativo** | Acesso restrito a `ROLE_ADMIN`: criação de regiões e sensores, edição, validação obrigatória dos limiares (`Atenção < Alerta < Perigo`) e **exclusão lógica (soft delete / reativação)**. |

---

## 3. Como Executar

### 3.1. Instalação das Dependências

Na pasta `frontend/`:

```bash
npm install
```

### 3.2. Configuração de Variáveis de Ambiente

Crie um arquivo `.env` (ou utilize o padrão):

```env
# URL da API Spring Boot
VITE_API_URL=http://localhost:8080
```

### 3.3. Execução em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### 3.4. Compilação para Produção

```bash
npm run build
```

---

## 4. Segurança e Boas Práticas

- **Sem dados sensíveis:** Nenhuma senha ou API Key de sensor é mantida ou exposta no frontend.
- **Autorização real:** O frontend esconde elementos restritos, mas a segurança é imposta no backend Spring Security (401/403).
- **Tratamento de Sessão:** Tokens expirados ou inválidos são limpos automaticamente, redirecionando para a tela de login.
