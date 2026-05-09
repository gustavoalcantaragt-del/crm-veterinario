# Tarefas Pendentes — CRM Thiago
> Documento para o estagiário. Cada tarefa é independente — pode ser feita em qualquer ordem.

---

## Estrutura de arquivos atual

```
CRM Thiago/
├── index (3).html      ← HTML principal (não mexer no <script>, só no HTML)
├── config.js           ← URL e chave do Supabase (não commitar!)
├── config.example.js   ← Exemplo de config sem credenciais reais
├── constants.js        ← Cores, roles, mapa de origens
├── utils.js            ← Funções utilitárias (toast, debounce, withLoading…)
├── supabase.js         ← Todas as queries ao banco
├── state.js            ← Variáveis globais de estado
├── styles.css          ← Todo o CSS
└── js/
    ├── auth.js         ← Login, logout, roles
    ├── data.js         ← loadAll, mappers DB↔JS
    ├── navigation.js   ← showPage, renderSidebar, dirty pages
    ├── dashboard.js    ← renderDashboard
    ├── kanban.js       ← Kanban board + drag-and-drop
    ├── leads.js        ← Tabela, detail panel, CRUD de leads
    ├── funnels.js      ← CRUD de funis e etapas
    ├── reports.js      ← Página de relatórios
    ├── tasks.js        ← Tarefas do Thiago (aba Estagiário)
    ├── mentorships.js  ← Mentorias (aba Thiago)
    ├── marketing.js    ← Página de marketing
    └── abordagem.js    ← Scripts de abordagem WhatsApp
```

---

## TAREFA 1 — Substituir `prompt()` por modal (Fácil)

**Arquivo:** `js/auth.js`, linha 144

**Problema:** A função `updateUserName` usa `prompt()` nativo do browser, que é feio e bloqueante.

**O que fazer:** Substituir pelo modal `showConfirm` que já existe em `utils.js`.

**Código atual (linha 143–150 de auth.js):**
```js
async function updateUserName(userId, currentName){
  const newName = prompt('Novo nome:', currentName);
  if(!newName || newName === currentName) return;
  const { error } = await dbUpdateProfileName(userId, newName);
  if(error){ showError(error.message); return; }
  toast(`✅ Nome atualizado!`);
  renderUsuarios();
}
```

**Como deve ficar:**
Criar um mini-modal de input. Adicione esta função em `utils.js` depois de `showConfirm`:

```js
function showInputModal({ title, label, defaultValue = '', onConfirm }){
  let modal = document.getElementById('mo-input');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'mo-input';
    modal.className = 'mo';
    modal.innerHTML = `
      <div class="modal" style="max-width:380px">
        <div class="modal-hd">
          <h3 id="mo-input-title" style="font-size:16px"></h3>
          <button class="modal-close" onclick="closeMo('mo-input')">
            <svg viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body" style="padding:16px 24px">
          <div class="field">
            <label id="mo-input-label" style="font-size:12px;font-weight:600;color:var(--text3)"></label>
            <input id="mo-input-value" type="text" style="margin-top:6px">
          </div>
        </div>
        <div class="modal-ft">
          <button class="btn" onclick="closeMo('mo-input')">Cancelar</button>
          <button class="btn btn-gold" id="mo-input-btn" style="font-weight:700">Salvar</button>
        </div>
      </div>`;
    modal.addEventListener('click', e => { if(e.target === modal) closeMo('mo-input'); });
    document.getElementById('mo-input-value').addEventListener('keydown', e => {
      if(e.key === 'Enter') document.getElementById('mo-input-btn').click();
    });
    document.body.appendChild(modal);
  }
  document.getElementById('mo-input-title').textContent = title;
  document.getElementById('mo-input-label').textContent = label;
  const inp = document.getElementById('mo-input-value');
  inp.value = defaultValue;
  document.getElementById('mo-input-btn').onclick = async () => {
    const val = inp.value.trim();
    if(!val) return;
    closeMo('mo-input');
    await onConfirm(val);
  };
  openMo('mo-input');
  setTimeout(() => inp.focus(), 150);
}
```

Depois altere `updateUserName` em `auth.js`:
```js
async function updateUserName(userId, currentName){
  showInputModal({
    title: 'Editar Nome',
    label: 'Novo nome',
    defaultValue: currentName,
    onConfirm: async (newName) => {
      if(newName === currentName) return;
      const { error } = await dbUpdateProfileName(userId, newName);
      if(error){ showError(error.message); return; }
      toast('✅ Nome atualizado!');
      renderUsuarios();
    }
  });
}
```

---

## TAREFA 2 — Criar README.md (Fácil)

**Arquivo a criar:** `CRM Thiago/README.md`

**O que deve conter:**

```markdown
# ThiagoCRM

CRM veterinário com funis de vendas, kanban, mentorias e módulo de abordagem WhatsApp.

## Stack
- HTML + CSS + JavaScript puro (sem framework, sem build)
- Supabase (banco de dados + autenticação)
- Fontes: Google Fonts (Outfit + DM Mono)

## Como rodar localmente

1. Copie o arquivo de configuração:
   cp config.example.js config.js

2. Abra config.js e preencha com as credenciais reais do Supabase:
   const APP_CONFIG = {
     supabaseUrl: 'https://SEU_PROJETO.supabase.co',
     supabaseKey: 'sua_anon_key_aqui',
   };

3. Abra index (3).html diretamente no browser
   OU use Live Server no VS Code (extensão recomendada)

## Configuração do Supabase

1. Acesse app.supabase.com e abra o projeto
2. Vá em Settings → API para copiar a URL e a anon key
3. Execute os SQLs em /supabase/ para criar as tabelas (ver Tarefa 3)
4. Configure as políticas RLS (ver /supabase/rls.sql)

## Adicionar novo usuário

1. Supabase → Authentication → Users → Invite user
2. Digite o e-mail e envie o convite
3. O usuário define a senha pelo link no e-mail
4. Acesse a aba Usuários no CRM para definir o perfil (admin, estagiário, etc.)

## Estrutura de arquivos

[cole o diagrama de arquivos do topo deste documento]

## Roles e permissões

| Role       | Páginas acessíveis                                              |
|------------|----------------------------------------------------------------|
| admin      | Todas                                                          |
| dev        | Todas                                                          |
| estagiario | Dashboard, Kanban, Leads, Funis, Relatórios, Estagiário, Abord.|
| marketing  | Dashboard, Leads, Relatórios, Marketing                        |
```

---

## TAREFA 3 — Criar SQLs do banco (Médio)

**Pasta a criar:** `CRM Thiago/supabase/`
**Arquivos a criar:** `schema.sql` e `rls.sql`

### schema.sql

Crie um arquivo com os CREATEs de cada tabela. Baseie-se nos mappers em `js/data.js` para saber as colunas.

**Tabela `funnels`** (baseado em `mapFunnel`):
```sql
create table funnels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  icon       text default '📋',
  color      text default '#d4af37',
  stages     jsonb default '[]',
  created_at timestamptz default now()
);
```

**Tabela `leads`** (baseado em `mapLead` e `leadToDb`):
```sql
create table leads (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text,
  phone           text,
  instagram       text,
  company         text,
  origin          text default 'ig_comentario',
  is_vet          boolean default true,
  funnel_id       uuid references funnels(id) on delete set null,
  stage_id        uuid,
  value           numeric default 0,
  tags            text[] default '{}',
  notes           text,
  follow_up       date,
  converted       boolean default false,
  converted_date  date,
  service_months  int default 0,
  activities      jsonb default '[]',
  date            date default current_date,
  created_at      timestamptz default now()
);
```

**Tabela `tasks`** (baseado em `mapTask` e `taskToDb`):
```sql
create table tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  priority    text default 'media',   -- urgente | alta | media | baixa
  status      text default 'pendente', -- pendente | em_andamento | concluida
  deadline    date,
  created_at  timestamptz default now()
);
```

**Tabela `mentorships`** (baseado em `mapMentorship` e `mentorshipToDb`):
```sql
create table mentorships (
  id                    uuid primary key default gen_random_uuid(),
  client                text not null,
  type                  text default 'Mentoria Individual',
  hours_per_session     numeric default 1,
  sessions_per_week     int default 1,
  total_weeks           int default 4,
  start_date            date,
  end_date              date,
  active                boolean default true,
  value                 numeric default 0,
  notes                 text,
  schedule_type         text default 'nenhuma',
  schedule_day_of_week  int[],
  schedule_day_of_month int,
  schedule_interval_days int,
  schedule_sessions     jsonb default '[]',
  created_at            timestamptz default now()
);
```

**Tabela `settings`**:
```sql
create table settings (
  key   text primary key,
  value text
);
```

**Tabela `user_profiles`** (criada automaticamente quando um usuário confirma o convite — verifique se já existe no projeto. Se não existir, crie):
```sql
create table user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text default 'estagiario',
  avatar     text,
  updated_at timestamptz default now()
);
```

**View `users_with_email`** (usada em `dbListProfiles` para mostrar o e-mail dos usuários):
```sql
create view users_with_email as
  select p.id, p.name, p.role, p.avatar, u.email, u.created_at
  from user_profiles p
  join auth.users u on u.id = p.id;
```
> Atenção: para acessar `auth.users` numa view, talvez precise executar como `service_role`. Consulte a documentação do Supabase sobre views com auth schema.

---

### rls.sql

Políticas de Row Level Security. Habilite RLS em cada tabela e crie as políticas:

```sql
-- Habilitar RLS em todas as tabelas
alter table funnels     enable row level security;
alter table leads       enable row level security;
alter table tasks       enable row level security;
alter table mentorships enable row level security;
alter table settings    enable row level security;
alter table user_profiles enable row level security;

-- FUNNELS: qualquer usuário autenticado pode ler/escrever
create policy "funnels_auth" on funnels
  for all to authenticated using (true) with check (true);

-- LEADS: qualquer usuário autenticado pode ler/escrever
create policy "leads_auth" on leads
  for all to authenticated using (true) with check (true);

-- TASKS: qualquer usuário autenticado pode ler/escrever
create policy "tasks_auth" on tasks
  for all to authenticated using (true) with check (true);

-- MENTORSHIPS: qualquer usuário autenticado pode ler/escrever
create policy "mentorships_auth" on mentorships
  for all to authenticated using (true) with check (true);

-- SETTINGS: qualquer usuário autenticado pode ler/escrever
create policy "settings_auth" on settings
  for all to authenticated using (true) with check (true);

-- USER_PROFILES: cada usuário lê/edita apenas o próprio perfil
create policy "profiles_select" on user_profiles
  for select to authenticated using (true);

create policy "profiles_update" on user_profiles
  for update to authenticated using (auth.uid() = id);
```

> Para rodar esses SQLs: acesse Supabase → SQL Editor → cole e execute.

---

## TAREFA 4 — Adicionar JSDoc (Fácil/Médio)

Adicionar comentários JSDoc nas funções dos 3 arquivos principais. Não precisa documentar tudo — foque nas funções menos óbvias.

### supabase.js

Exemplo do padrão a seguir:
```js
/**
 * Busca todos os dados em paralelo no login inicial.
 * @returns {Promise<[funnels, leads, tasks, mentorships, settings]>}
 */
const dbLoadAll = () => Promise.all([...]);

/**
 * Insere um novo lead e retorna o registro criado.
 * @param {Object} data - Objeto no formato do banco (snake_case). Use leadToDb() para converter.
 * @returns {Promise<{data, error}>}
 */
const dbInsertLead = data => sb.from('leads').insert(data).select().single();

/**
 * Atualiza campos de um lead existente.
 * @param {string} id - UUID do lead
 * @param {Object} data - Campos a atualizar (pode ser parcial)
 */
const dbUpdateLead = (id, data) => sb.from('leads').update(data).eq('id', id);
```

Documente desta forma todas as funções de `supabase.js`. Para `auth.js` e `utils.js`, documente pelo menos: `initAuth`, `loadProfile`, `canAccess`, `withLoading`, `showConfirm`, `debounce`, `validateForm`.

---

## TAREFA 5 — Criar CHANGELOG.md (Fácil)

**Arquivo a criar:** `CRM Thiago/CHANGELOG.md`

```markdown
# Changelog

## [2.0.0] — 2026-05-08

### Refatoração completa (6 fases)

#### Fase 1 — Bugs críticos
- Corrigido: função `saveLead` duplicada (mantida versão com Supabase)
- Adicionado: `await` em todas as operações assíncronas do Supabase
- Corrigido: drag-and-drop do Kanban agora persiste o stage no banco
- Adicionado: null checks antes de manipulações de DOM

#### Fase 2 — Segurança
- Adicionado: `config.js` para isolar credenciais do Supabase
- Adicionado: `config.example.js` para onboarding sem expor credenciais
- Adicionado: função `esc()` (escapeHtml) aplicada em todos os innerHTML com dados do usuário
- Adicionado: `stripTags()` nos campos de texto antes de salvar
- Adicionado: `validEmail()` para validação de e-mail

#### Fase 3 — Modularização
- Extraído: todo o CSS para `styles.css`
- Criado: `constants.js` (PALETTE, ORIGIN_MAP, ROLE_PAGES, etc.)
- Criado: `utils.js` (toast, debounce, withLoading, esc, etc.)
- Criado: `supabase.js` (todas as queries como funções nomeadas)
- Criado: `state.js` (variáveis globais centralizadas)
- Extraído: 12 módulos JS em `js/` (auth, data, navigation, dashboard, kanban, leads, funnels, reports, tasks, mentorships, marketing, abordagem)
- O `<script>` inline do HTML reduziu de ~3500 linhas para 1 linha (`initAuth()`)

#### Fase 4 — Performance
- Adicionado: `debounce(fn, 280ms)` nas buscas do kanban, tabela de leads e abordagem
- Adicionado: paginação client-side de 50 leads por página na tabela
- Adicionado: sistema de `_dirtyPages` — tabs não re-renderizam quando dados não mudaram
- Adicionado: `invalidateLeadPages()`, `invalidateTaskPages()`, etc. chamados após cada CRUD

#### Fase 5 — UX e Validação
- Adicionado: `withLoading(btn, fn)` — botões de salvar desabilitam e mostram spinner
- Adicionado: `validateForm(checks)` — validação padronizada de formulários
- Adicionado: `showConfirm({...})` — modal de confirmação reutilizável (substituiu todos os `confirm()` nativos)
- Removido: `_deleteCallback` e `confirmDelete` — simplificados com `showConfirm`
- Adicionado: empty states com CTA na página de Relatórios
- Adicionado: CSS responsivo para tablets (769px–1199px)

## [1.0.0] — data original
- Versão monolítica (5033 linhas em um único HTML)
```

---

## TAREFA 6 — Configurar ESLint (Médio)

ESLint ajuda a encontrar erros e padronizar o código sem precisar de build.

**Pré-requisito:** ter Node.js instalado (`node --version` no terminal).

**Passo a passo:**

1. Abra o terminal na pasta `CRM Thiago/`

2. Crie o `package.json`:
```bash
npm init -y
```

3. Instale o ESLint:
```bash
npm install --save-dev eslint
```

4. Crie o arquivo `.eslintrc.json` na raiz de `CRM Thiago/`:
```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "globals": {
    "supabase": "readonly",
    "APP_CONFIG": "readonly",
    "PALETTE": "readonly",
    "STAGE_COLORS": "readonly",
    "ORIGIN_MAP": "readonly",
    "ROLE_PAGES": "readonly",
    "ROLE_COLORS": "readonly",
    "ROLE_LABELS": "readonly",
    "ROLE_EDIT": "readonly",
    "ROLE_DELETE": "readonly",
    "funnels": "writable",
    "leads": "writable",
    "tasks": "writable",
    "mentorships": "writable",
    "estagiarioObs": "writable",
    "activeFunnelId": "writable",
    "activeLeadId": "writable",
    "editingLeadId": "writable",
    "editingFunnelId": "writable",
    "editingTaskId": "writable",
    "editingMentorshipId": "writable",
    "movingLeadId": "writable",
    "mfColor": "writable",
    "tableFilter": "writable",
    "tableSearch": "writable",
    "currentPage": "writable",
    "currentUser": "writable",
    "currentProfile": "writable",
    "getFunnel": "readonly",
    "getLead": "readonly"
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-undef": "error",
    "no-console": "off",
    "eqeqeq": ["warn", "always"],
    "no-var": "warn"
  }
}
```

5. Adicione o script no `package.json`:
```json
"scripts": {
  "lint": "eslint js/"
}
```

6. Para rodar:
```bash
npm run lint
```

7. Para corrigir automaticamente o que for possível:
```bash
npx eslint js/ --fix
```

> Os avisos `no-unused-vars` vão aparecer para funções chamadas via `onclick=""` no HTML — isso é esperado. Ignore ou adicione um comentário `// eslint-disable-next-line no-unused-vars` antes dessas funções se quiser limpar os avisos.

---

## TAREFA 7 — Criar TESTING.md (Fácil)

**Arquivo a criar:** `CRM Thiago/TESTING.md`

```markdown
# Checklist de Testes Manuais

Execute este checklist após cada deploy ou mudança grande.

## Auth
- [ ] Login com e-mail/senha corretos → entra no sistema
- [ ] Login com senha errada → mensagem de erro, campo de senha limpa
- [ ] Botão de logout → volta para tela de login, dados limpos
- [ ] Usuário estagiário NÃO vê abas Thiago, Marketing, Usuários
- [ ] Usuário marketing NÃO vê Kanban, Funis, Estagiário

## Leads
- [ ] Criar lead → aparece no kanban e na tabela
- [ ] Editar lead → alterações salvas corretamente
- [ ] Excluir lead → modal de confirmação aparece, lead removido ao confirmar
- [ ] Busca na tabela → filtra por nome, e-mail e empresa (com debounce)
- [ ] Paginação → mostra 50 leads por página, botões prev/next funcionam
- [ ] Drag-and-drop no kanban → stage atualizado no banco
- [ ] Detalhe do lead → abre painel lateral com histórico de atividades
- [ ] Mover lead entre funis → aparece no funil correto
- [ ] Marcar como convertido → aparece na aba Estagiário em "Leads Convertidos"

## Funis e Etapas
- [ ] Criar funil → aparece no kanban e na página de funis
- [ ] Editar etapas → drag para reordenar, salvar atualiza o kanban
- [ ] Excluir funil → bloqueia se houver leads vinculados e só remove funil vazio

## Tarefas (Estagiário)
- [ ] Criar tarefa → aparece na lista com prioridade e prazo
- [ ] Mudar status via botões → atualiza sem recarregar a página
- [ ] Tarefa atrasada → aparece badge vermelho
- [ ] Excluir tarefa → modal de confirmação aparece

## Mentorias (Thiago)
- [ ] Cadastrar mentoria com agendamento semanal → sessões geradas corretamente
- [ ] Editar mentoria → dados salvos
- [ ] Excluir → modal de confirmação aparece

## Abordagem
- [ ] Leads da planilha com telefone aparecem na lista
- [ ] Script gerado automaticamente por perfil (gestor/autônomo) e gênero
- [ ] Editar script global → todos os textareas atualizam em tempo real
- [ ] Link do WhatsApp gerado corretamente e abre no WA
- [ ] Marcar como abordado → lead some da lista (se "Mostrar abordados" desmarcado)

## Performance
- [ ] Com 100+ leads, kanban abre em < 1 segundo
- [ ] Busca no kanban tem delay (não trava a cada tecla)
- [ ] Navegar entre abas sem fazer CRUD → re-render não acontece (verificar no console)
- [ ] Botões de salvar mostram spinner durante a operação
- [ ] Double-click em "Salvar" não duplica o registro

## Responsivo
- [ ] Mobile (< 768px): sidebar funciona como drawer, bottom nav visível
- [ ] Tablet (769px–1199px): kanban com scroll horizontal, grids ajustados
- [ ] Modais não ultrapassam a largura da tela
```

---

## TAREFA 8 — Paginação server-side com `.range()` (Avançado)

**Quando implementar:** apenas se o número de leads da planilha ultrapassar ~2000 registros e o carregamento inicial ficar lento.

**Problema atual:** `dbLoadAll()` em `supabase.js` busca TODOS os leads de uma vez. Com muitos leads de planilha, isso pode ser lento.

**Solução:** usar `.range()` do Supabase para buscar os leads em páginas diretamente do banco.

**Arquivos a modificar:** `supabase.js`, `js/data.js`, `js/leads.js`

### Passo 1 — Adicionar função paginada em supabase.js

```js
// Adicionar junto aos helpers de leads:
const dbFetchLeadsPage = (page, size = 50) =>
  sb.from('leads')
    .select('*', { count: 'exact' })
    .order('created_at')
    .range(page * size, page * size + size - 1);
```

### Passo 2 — Criar estado de paginação em state.js

```js
// Adicionar ao final de state.js:
let leadsTotal      = 0;  // total de registros no banco
let leadsServerPage = 0;  // página atual (0-indexed)
const LEADS_SERVER_PAGE_SIZE = 50;
```

### Passo 3 — Modificar loadAll em data.js

Separar o carregamento de leads do resto:
```js
async function loadAll() {
  // ... código atual mas SEM buscar leads no Promise.all ...
  const [f, t, m, s] = await Promise.all([
    sb.from('funnels').select('*').order('created_at'),
    sb.from('tasks').select('*').order('created_at'),
    sb.from('mentorships').select('*').order('created_at'),
    sb.from('settings').select('*'),
  ]);
  // ... mapear funnels, tasks, mentorships, settings ...

  // Carregar primeira página de leads separadamente
  await loadLeadsPage(0);

  // ... resto do loadAll atual ...
}

async function loadLeadsPage(page) {
  const { data, error, count } = await dbFetchLeadsPage(page);
  if(error) throw error;
  leads = (data||[]).map(mapLead);
  leadsTotal = count || 0;
  leadsServerPage = page;
}
```

### Passo 4 — Adicionar botões de página server-side em leads.js

Nos controles de paginação de `renderLeadsTableBody`, adicionar lógica para detectar se há mais páginas no servidor e carregar sob demanda.

> Atenção: esta mudança quebra o filtro local (que filtra `leads` em memória). Você precisará ou (a) aceitar que o filtro funciona apenas nos leads carregados ou (b) passar os filtros para o Supabase com `.ilike()` e `.contains()`.

---

## Resumo de prioridades

| # | Tarefa | Dificuldade | Impacto |
|---|--------|-------------|---------|
| 1 | Substituir `prompt()` por modal | Fácil | UX |
| 2 | README.md | Fácil | Onboarding |
| 3 | SQLs do banco | Médio | Infra/docs |
| 4 | JSDoc | Fácil | Manutenção |
| 5 | CHANGELOG.md | Fácil | Histórico |
| 6 | ESLint | Médio | Qualidade |
| 7 | TESTING.md | Fácil | QA |
| 8 | Paginação server-side | Avançado | Performance futura |

**Sugestão de ordem para o estagiário:** 2 → 5 → 7 → 1 → 4 → 3 → 6 → 8
