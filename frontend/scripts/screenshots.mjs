// Gera as evidências (prints) do frontend AlertaJá rodando contra a API real.
// Pré-requisitos: API em https://localhost:7275 e `npm run dev` em http://localhost:5173.
// Uso: node scripts/screenshots.mjs [pastaDeSaida]
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.FRONT_URL || 'http://localhost:5173'
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const OUT = path.resolve(process.argv[2] || 'evidencias')
const REGIAO_QA = 'QA Front — Teste'
fs.mkdirSync(OUT, { recursive: true })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const log = []

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--lang=pt-BR', '--window-size=1280,900'],
  defaultViewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
})
const page = await browser.newPage()
await page.emulateTimezone('America/Sao_Paulo')
page.on('pageerror', (e) => log.push(`pageerror: ${e.message}`))
page.on('response', (r) => {
  if (r.url().includes('/api/')) log.push(`${r.request().method()} ${r.url().replace(BASE, '')} -> ${r.status()}`)
})

async function shot(name, note = '') {
  await sleep(350)
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file })
  console.log('📸', name, note)
}
async function clickText(text, selector = 'button, a') {
  const ok = await page.evaluate((t, sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(t))
    if (el) { el.click(); return true }
    return false
  }, text, selector)
  if (!ok) throw new Error(`Elemento com texto "${text}" não encontrado`)
}
async function waitText(text, timeout = 15000) {
  await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text)
}
async function scrollScreen(y) {
  await page.evaluate((v) => { document.querySelector('.screen').scrollTop = v }, y)
}
async function typeInto(selector, value) {
  await page.click(selector, { clickCount: 3 })
  await page.keyboard.press('Backspace')
  if (value) await page.type(selector, value)
}
async function apiGet(p, token) {
  return page.evaluate(async (u, t) => {
    const r = await fetch(u, { headers: t ? { Authorization: `Bearer ${t}` } : {} })
    return r.json()
  }, p, token)
}
async function loginAs(email, senha) {
  await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle0' })
  await typeInto('input[type=email]', email)
  await typeInto('input[autocomplete=current-password]', senha)
  await clickText('Entrar', 'button')
  await page.waitForSelector('.tabbar', { timeout: 15000 })
  await waitText('Regiões monitoradas')
  await sleep(600)
}

try {
  // 1. Login
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.evaluate(() => sessionStorage.clear())
  await page.goto(`${BASE}/#/login`, { waitUntil: 'networkidle0' })
  await shot('01_login', 'tela de login')

  // 2. Login com senha errada -> mensagem da API (401)
  await typeInto('input[type=email]', 'admin@alertaja.com')
  await typeInto('input[autocomplete=current-password]', 'senhaErrada')
  await clickText('Entrar', 'button')
  await page.waitForSelector('.notice-error', { timeout: 15000 })
  await shot('02_login_erro', '401 E-mail ou senha inválidos')

  // 3. Login admin -> painel
  await clickText('Administrador', 'button.chip')
  await clickText('Entrar', 'button')
  await page.waitForSelector('.tabbar', { timeout: 15000 })
  await waitText('Regiões monitoradas')
  await sleep(800)
  await shot('03_painel_admin', 'painel com resumo e alertas ativos')
  await scrollScreen(560)
  await shot('03b_painel_regioes', 'lista de regiões com nível de risco')
  await clickText('Mostrar inativas', 'label')
  await sleep(300)
  await scrollScreen(2000)
  await shot('03c_painel_inativas', 'toggle mostrar inativas')

  // 4. Alertas
  await clickText('Alertas', '.tabbar a')
  await waitText('Ativos')
  await page.waitForSelector('.alert-card', { timeout: 15000 })
  await shot('04_alertas_ativos', 'aba ativos')
  await clickText('Resolvidos', '.segmented button')
  await sleep(400)
  await shot('04b_alertas_resolvidos', 'aba resolvidos')
  await clickText('Ativos', '.segmented button')
  await sleep(300)

  // 5. Detalhe de alerta (admin) + diálogo de exclusão (cancelado)
  await page.$eval('.alert-card', (e) => e.click())
  await waitText('Detalhe do alerta')
  await page.waitForSelector('.details', { timeout: 15000 })
  await sleep(500)
  await scrollScreen(400)
  await shot('05_alerta_detalhe_admin', 'botão Excluir visível para ROLE_ADMIN')
  await clickText('Excluir alerta', 'button')
  await page.waitForSelector('.dialog')
  await shot('05b_confirmar_exclusao', 'diálogo de confirmação (cancelado no teste)')
  await clickText('Cancelar', '.dialog button')

  // 6. Detalhe de região (sensores + medições + sparkline)
  const regioes = await apiGet('/api/regioes')
  const sensores = await apiGet('/api/sensores')
  const medicoes = await apiGet('/api/medicoes')
  const comMedicoes = (rid) => sensores.filter((s) => s.regiaoId === rid)
    .reduce((n, s) => n + medicoes.filter((m) => m.sensorId === s.id).length, 0)
  const ranking = regioes.filter((r) => r.ativo).sort((a, b) => comMedicoes(b.id) - comMedicoes(a.id))
  const alvo = regioes.find((r) => r.nivelRiscoAtual === 'PERIGO' && r.ativo) || ranking[0]
  await page.goto(`${BASE}/#/regioes/${alvo.id}`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.sensor-card', { timeout: 15000 })
  await sleep(600)
  await shot('06_regiao_detalhe', `região ${alvo.nome}/${alvo.cidade}`)
  await scrollScreen(420)
  await shot('06b_regiao_sensores', 'sensores com sparkline e limites')
  const outra = ranking.find((r) => r.id !== alvo.id)
  if (outra) {
    await page.goto(`${BASE}/#/regioes/${outra.id}`, { waitUntil: 'networkidle0' })
    await page.waitForSelector('.sensor-card', { timeout: 15000 })
    await sleep(600)
    await scrollScreen(250)
    await page.evaluate(() => { const d = document.querySelector('details.history'); if (d) d.open = true })
    await sleep(200)
    await shot('06c_regiao_historico', `histórico de medições ${outra.nome}/${outra.cidade}`)
  }

  // 7. Cadastro de região: validação + 1 escrita real
  await page.goto(`${BASE}/#/cadastro`, { waitUntil: 'networkidle0' })
  await page.waitForSelector('#form-regiao')
  await clickText('Cadastrar região', 'button')
  await page.waitForSelector('.field-error')
  await shot('07_cadastro_regiao_validacao', 'validação no cliente')

  const jaExiste = regioes.find((r) => r.nome === REGIAO_QA)
  if (!jaExiste) {
    const inputs = await page.$$('#form-regiao input')
    await inputs[0].type(REGIAO_QA)
    await inputs[1].type('São Paulo')
    await inputs[2].type('SP')
    await clickText('Cadastrar região', 'button')
    await page.waitForSelector('.toast-success, .toast-error', { timeout: 15000 })
    await shot('07b_cadastro_regiao_sucesso', 'POST /api/regioes 201')
  } else {
    console.log('ℹ região QA já existe — criação não repetida')
  }

  // 8. Cadastro de sensor: validação dos limites (não envia)
  await clickText('Novo sensor', '.segmented button')
  await page.waitForSelector('#form-sensor')
  const regAtiva = regioes.find((r) => r.ativo && r.nome !== REGIAO_QA)
  await page.select('#form-sensor select', regAtiva.id)
  const sIn = await page.$$('#form-sensor input')
  await sIn[0].type('PLUV-099')
  await sIn[1].type('30')
  await sIn[2].type('20')
  await sIn[3].type('10')
  await clickText('Cadastrar sensor', 'button')
  await page.waitForSelector('.field-error')
  await scrollScreen(300)
  await shot('08_cadastro_sensor', 'limites fora de ordem bloqueados no cliente')
  const nums = await page.$$('#form-sensor input[type=number]')
  for (const [i, v] of ['10', '25', '50'].entries()) {
    await nums[i].click({ clickCount: 3 }); await page.keyboard.press('Backspace'); await nums[i].type(v)
  }
  await sleep(200)
  await shot('08b_cadastro_sensor_preenchido', 'formulário válido (não enviado para não poluir o banco)')

  // 8c. Editar região QA -> inativa (PUT) e confirma pelo GET
  const regs2 = await apiGet('/api/regioes')
  const qa = regs2.find((r) => r.nome === REGIAO_QA)
  if (qa) {
    await clickText('Editar região', '.segmented button')
    await page.waitForSelector('#form-editar select')
    await page.select('#form-editar select', qa.id)
    await page.waitForSelector('#form-editar input[type=checkbox]')
    const checked = await page.$eval('#form-editar input[type=checkbox]', (e) => e.checked)
    if (checked) await page.click('#form-editar input[type=checkbox]')
    await shot('08c_editar_regiao', 'desativando a região de teste')
    await clickText('Salvar alterações', 'button')
    await page.waitForSelector('.toast-success, .toast-error', { timeout: 15000 })
    await shot('08d_editar_regiao_sucesso', 'PUT /api/regioes/{id} 200')
    const conf = await apiGet(`/api/regioes/${qa.id}`)
    console.log(`ℹ GET após PUT: ativo=${conf.ativo}`)
    log.push(`Região QA após PUT: ativo=${conf.ativo}`)
  }

  // 9. Perfil
  await clickText('Perfil', '.tabbar a')
  await waitText('Conexão com a API')
  await clickText('Testar', 'button')
  await page.waitForSelector('.ok-text, .error-text', { timeout: 10000 })
  await shot('09_perfil', 'perfil do administrador')

  // 10/11. Cidadã: sem aba Cadastro e sem botão Excluir
  await clickText('Sair da conta', 'button')
  await page.waitForSelector('.login')
  await loginAs('maria@email.com', 'maria123')
  await shot('10_painel_cidadao', 'tab bar sem Cadastro')
  await clickText('Alertas', '.tabbar a')
  await page.waitForSelector('.alert-card', { timeout: 15000 })
  await page.$eval('.alert-card', (e) => e.click())
  await page.waitForSelector('.details', { timeout: 15000 })
  await sleep(500)
  await scrollScreen(400)
  await shot('11_alerta_detalhe_cidadao', 'sem área do administrador')
  await page.goto(`${BASE}/#/cadastro`, { waitUntil: 'networkidle0' })
  await sleep(400)
  log.push(`Cidadã acessando /#/cadastro foi redirecionada para: ${page.url().replace(BASE, '')}`)

  // 12. Sem conexão: intercepta e aborta as chamadas /api
  await page.setRequestInterception(true)
  const block = (req) => (req.url().includes('/api/') ? req.abort('failed') : req.continue())
  page.on('request', block)
  await page.goto(`${BASE}/#/painel`, { waitUntil: 'networkidle0' })
  await page.reload({ waitUntil: 'networkidle0' })
  await page.waitForSelector('.offline-banner', { timeout: 15000 })
  await sleep(400)
  await shot('12_sem_conexao', 'banner + ErrorBox com tentar de novo')
  page.off('request', block)
  await page.setRequestInterception(false)

  // 13. Celular real (sem moldura)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.goto(`${BASE}/#/painel`, { waitUntil: 'networkidle0' })
  await waitText('Regiões monitoradas')
  await sleep(600)
  await shot('13_mobile_tela_cheia', 'viewport 390x844 sem moldura')
} catch (e) {
  console.error('❌', e.message)
  await page.screenshot({ path: path.join(OUT, 'erro.png') }).catch(() => {})
  process.exitCode = 1
} finally {
  fs.writeFileSync(path.join(OUT, 'log_requisicoes_front.txt'), log.join('\n'), 'utf8')
  await browser.close()
}
