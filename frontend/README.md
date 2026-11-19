# AlertaJá — Frontend mobile (React)

Aplicativo do cidadão e do administrador do AlertaJá. É feito em **React 18 + Vite** e
aparece dentro de uma **moldura de smartphone** no navegador do computador. Em um celular
de verdade (tela com menos de 500 px), a moldura some e o app ocupa a tela inteira.

O app **consome a API ASP.NET Core do grupo** (`backend/AlertaJa.Api`). Ele lê e grava
dados por ela.

## Requisitos

- Node.js 18 ou superior (testado com Node 24)
- API AlertaJá rodando no perfil **https** (`https://localhost:7275`), conforme o README principal

## Como executar

```powershell
# 1) Em um terminal, suba a API (pasta backend/AlertaJa.Api)
dotnet run --launch-profile https

# 2) Em outro terminal, na pasta frontend/
npm install
npm run dev
```

Depois, abra **http://localhost:5173**.

> O Vite redireciona `/api` para `https://localhost:7275` (veja `vite.config.js`). Isso
> resolve duas coisas sem alterar o backend: a falta de CORS e o certificado HTTPS de
> desenvolvimento. Para usar outra URL da API, defina a variável antes de rodar:
> `$env:VITE_API_TARGET="https://localhost:7275"; npm run dev`

Build de produção: `npm run build` gera a pasta `dist/`. Para servi-la com o mesmo proxy,
use `npm run preview` (porta 4173).

## Credenciais de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador (`ROLE_ADMIN`) | admin@alertaja.com | admin123 |
| Cidadã (`ROLE_CIDADAO`) | maria@email.com | maria123 |
| Cidadão (`ROLE_CIDADAO`) | joao@email.com | joao123 |

Na tela de login, os botões "Administrador" e "Cidadã (Maria)" preenchem o formulário.

## Telas

| # | Tela | API consumida | Perfil |
|---|---|---|---|
| 1 | **Login**: valida campos e mostra o erro 401 da API | `POST /api/auth/login` | todos |
| 2 | **Painel**: maior risco, contagem por nível, alertas ativos e regiões. Atualiza sozinho a cada 10 s e tem botão de atualizar | `GET /api/regioes`, `GET /api/alertas` | todos |
| 3 | **Alertas**: abas Ativos e Resolvidos | `GET /api/alertas` | todos |
| 4 | **Detalhe do alerta**: nível, status, região, sensor e datas. Excluir com confirmação | `GET /api/alertas/{id}`, `DELETE /api/alertas/{id}` | excluir: admin |
| 5 | **Detalhe da região**: sensores, última leitura, mini-gráfico com as faixas de limite e histórico | `GET /api/regioes/{id}`, `/api/sensores`, `/api/medicoes` | todos |
| 6 | **Cadastro**: nova região, novo sensor (limites atenção < alerta < perigo) e editar ou desativar região | `POST /api/regioes`, `POST /api/sensores`, `PUT /api/regioes/{id}` | admin |
| 7 | **Perfil**: dados do usuário, papel, validade do token, teste de conexão e sair | `GET /api/status` | todos |

## Tratamento de erros e usabilidade

- Todas as chamadas passam por um único wrapper (`src/api.js`). Ele envia o token JWT
  (`Authorization: Bearer`) e traduz as respostas:
  - **Falha de rede ou API fora do ar**: aparece a faixa "Sem conexão com a API" com o botão "Tentar novamente".
  - **400**: mostra as mensagens de validação do ASP.NET (`errors`) em cada campo, ou o `{ mensagem }` da API.
  - **401** em ação protegida: encerra a sessão e volta ao login com um aviso.
  - **403**: mostra "Sem permissão".
  - **500**: mostra uma mensagem amigável.
- Avisos curtos (toasts) confirmam sucesso ou erro, e há indicadores de carregamento e
  telas para listas vazias.
- O cidadão não vê a aba Cadastro nem o botão Excluir. Se tentar abrir `/#/cadastro` pela
  URL, o app o leva ao painel.
- A sessão fica no `sessionStorage` e expira junto com o JWT.
- A API Key do simulador **não** fica no frontend. Medições são enviadas só pelo simulador IoT.

## Estrutura

```
frontend/
├── index.html
├── vite.config.js          # proxy /api -> API https
├── scripts/screenshots.mjs # gera os prints de evidência (puppeteer-core + Chrome)
└── src/
    ├── main.jsx            # entrada (HashRouter)
    ├── App.jsx             # moldura do celular, rotas, barra de abas, proteção por perfil
    ├── api.js              # wrapper fetch + sessão + erros
    ├── context.jsx         # sessão, toasts, estado de conexão
    ├── hooks.js            # useLoad (carregamento + auto-refresh)
    ├── format.js           # níveis de risco, datas pt-BR, rótulos
    ├── styles.css          # estilos (sem bibliotecas de UI)
    ├── components/ui.jsx   # Badge, Header, Toasts, Dialog, Sparkline, estados
    └── pages/              # Login, Painel, Alertas, AlertaDetalhe, RegiaoDetalhe, Cadastro, Perfil
```

## Gerar as evidências (prints)

Com a API e o `npm run dev` rodando:

```powershell
node scripts/screenshots.mjs ..\evidencias\front
```

O script percorre o app como administrador e como cidadã. Ele cria **uma** região de teste
("QA Front — Teste") e a desativa logo em seguida. Se ela já existir, não cria outra. O
script não cadastra sensores nem exclui alertas.
