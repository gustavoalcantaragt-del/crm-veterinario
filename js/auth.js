/* ── Auth state ── */
let currentUser    = null;
let currentProfile = null;

function canAccess(page){ return (ROLE_PAGES[currentUser?.role]||[]).includes(page); }
function canEdit()      { return ROLE_EDIT[currentUser?.role]  ?? false; }

async function initAuth(){
  const { data: { session } } = await dbGetSession();
  if(session){
    await loadProfile(session.user);
    hideLoginScreen();
    loadAll();
  } else {
    showLoginScreen();
  }
}

async function loadProfile(user){
  const { data, error } = await dbGetProfile(user.id);
  if(error) console.warn('Perfil não encontrado, usando padrões:', error.message);
  const role   = data?.role || 'estagiario';
  const name   = data?.name || user.email.split('@')[0];
  const avatar = data?.avatar || name[0].toUpperCase();
  currentUser = { id:user.id, email:user.email, name, role, avatar };
}

async function doLogin(){
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  const btn   = document.getElementById('login-btn');

  if(!email || !pass){ errEl.textContent='Preencha e-mail e senha.'; errEl.style.display='block'; return; }

  btn.textContent = 'Entrando…'; btn.disabled = true;
  const { data, error } = await dbSignIn(email, pass);
  btn.textContent = 'Entrar'; btn.disabled = false;

  if(error){
    errEl.textContent = 'E-mail ou senha incorretos.';
    errEl.style.display = 'block';
    document.getElementById('login-pass').value = '';
    return;
  }

  errEl.style.display = 'none';
  await loadProfile(data.user);
  hideLoginScreen();
  loadAll();
}

async function doLogout(){
  await dbSignOut();
  currentUser = null;
  leads=[]; funnels=[]; tasks=[]; mentorships=[];
  showLoginScreen();
}

function togglePassVis(){
  const inp = document.getElementById('login-pass');
  const ico = document.getElementById('eye-icon');
  if(inp.type === 'password'){
    inp.type = 'text';
    ico.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    inp.type = 'password';
    ico.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function updateUIForUser(){
  if(!currentUser) return;
  const color1 = ROLE_COLORS[currentUser.role] || '#2d9d8f';
  const color2 = (ROLE_COLORS[currentUser.role] || '#2d9d8f') + '88';
  const gradient = `linear-gradient(135deg,${color1},${color2})`;

  // Topbar: avatar + nome + role
  const tbAv = document.getElementById('tb-av');
  const tbNm = document.getElementById('tb-user-nm');
  const tbRl = document.getElementById('tb-user-rl');
  if(tbAv){ tbAv.textContent = currentUser.avatar; tbAv.style.background = gradient; }
  if(tbNm) tbNm.textContent = currentUser.name;
  if(tbRl){ tbRl.textContent = ROLE_LABELS[currentUser.role]||currentUser.role.toUpperCase(); tbRl.style.color = color1; }

  // Dropdown: nome + role
  const ddNm = document.getElementById('tb-dd-nm');
  const ddRl = document.getElementById('tb-dd-rl');
  if(ddNm) ddNm.textContent = currentUser.name;
  if(ddRl){ ddRl.textContent = (ROLE_LABELS[currentUser.role]||currentUser.role.toUpperCase()); ddRl.style.color = color1; }

  // Mostrar link de Configurações no dropdown só para quem tem acesso
  const configLink = document.getElementById('td-config-link');
  const configSep  = document.getElementById('td-config-sep');
  if(configLink && canAccess('configuracoes')){
    configLink.style.display = '';
    if(configSep) configSep.style.display = '';
  }
}

function toggleUserDropdown(e){
  if(e) e.stopPropagation();
  document.getElementById('tb-dropdown').classList.toggle('open');
}

function closeUserDropdown(){
  const dd = document.getElementById('tb-dropdown');
  if(dd) dd.classList.remove('open');
}

// Fecha dropdown ao clicar fora
document.addEventListener('click', e => {
  const menu = document.getElementById('tb-user-menu');
  if(menu && !menu.contains(e.target)) closeUserDropdown();
});

async function renderUsuarios(){
  const el = document.getElementById('usuarios-content');
  if(!el) return;
  el.innerHTML = `<div class="empty"><div class="empty-icon" style="font-size:28px">⏳</div><p>Carregando usuários…</p></div>`;

  const { data: profiles, error } = await dbListProfiles();
  if(error){
    el.innerHTML = `<div class="empty"><div class="empty-icon">❌</div><p style="color:var(--red)">Erro: ${esc(error.message)}</p></div>`;
    return;
  }

  _usuariosCache      = profiles || [];
  _usuariosSearch     = '';
  _usuariosRoleFilter = 'all';

  const total        = _usuariosCache.length;
  const nAdmins      = _usuariosCache.filter(p => ['admin','dev'].includes(p.role)).length;
  const nEstagiarios = _usuariosCache.filter(p => p.role === 'estagiario').length;
  const nMarketing   = _usuariosCache.filter(p => p.role === 'marketing').length;

  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:16px">
      ${miniKpi('Total de Usuários', total,        '#3b82f6','rgba(59,130,246,.1)')}
      ${miniKpi('Admin / Dev',       nAdmins,      '#d4af37','rgba(212,175,55,.1)')}
      ${miniKpi('Estagiários',       nEstagiarios, '#a855f7','rgba(168,85,247,.1)')}
      ${miniKpi('Marketing',         nMarketing,   '#f97316','rgba(249,115,22,.1)')}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="padding:12px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="position:relative;flex:1;min-width:200px">
          <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:13px;height:13px;color:var(--text3)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="u-search" type="text" placeholder="Buscar por nome ou e-mail…" oninput="filterUsuarios()"
            style="width:100%;padding:7px 12px 7px 32px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);font-size:12px;font-family:var(--font);color:var(--text);outline:none">
        </div>
        <select id="u-role-filter" onchange="filterUsuarios()"
          style="padding:7px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);font-size:12px;font-family:var(--font);color:var(--text);outline:none;cursor:pointer">
          <option value="all">Todos os perfis</option>
          <option value="admin">👑 Admin</option>
          <option value="dev">💻 Dev</option>
          <option value="estagiario">📋 Estagiário</option>
          <option value="marketing">📣 Marketing</option>
        </select>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-hd">
        <span class="card-title">👥 Equipe</span>
        <span class="card-sub" id="u-count">${total} usuário${total!==1?'s':''}</span>
      </div>
      <div id="u-table-wrap" style="overflow-x:auto">
        ${_buildUserTable(_usuariosCache)}
      </div>
    </div>

    ${_renderPermissionsMatrix()}

    <div class="card" style="margin-top:16px">
      <div class="card-hd"><span class="card-title">ℹ️ Como adicionar usuários</span></div>
      <div style="padding:14px 18px;font-size:13px;color:var(--text2);line-height:1.9">
        <strong style="color:var(--text)">1.</strong> Acesse o <strong style="color:var(--gold)">Supabase</strong> → Authentication → Users → <strong style="color:var(--gold)">Invite user</strong><br>
        <strong style="color:var(--text)">2.</strong> Informe o e-mail e clique em <strong style="color:var(--gold)">Send invite</strong><br>
        <strong style="color:var(--text)">3.</strong> A pessoa recebe e-mail para definir a senha<br>
        <strong style="color:var(--text)">4.</strong> Após confirmar, o usuário aparece aqui — defina o perfil de acesso
      </div>
    </div>
  `;
}

function _buildUserTable(profiles){
  const hasFilter = _usuariosSearch || _usuariosRoleFilter !== 'all';
  if(!profiles.length) return `
    <div class="empty">
      <div class="empty-icon">👥</div>
      <p>Nenhum usuário encontrado</p>
      ${hasFilter ? `<button class="btn btn-sm btn-ghost" style="margin-top:8px" onclick="document.getElementById('u-search').value='';document.getElementById('u-role-filter').value='all';filterUsuarios()">Limpar filtros</button>` : ''}
    </div>`;

  return `<table>
    <thead><tr>
      <th>Usuário</th>
      <th>Perfil</th>
      <th>Criado em</th>
      <th style="text-align:right;padding-right:16px">Ações</th>
    </tr></thead>
    <tbody>${profiles.map(p => _userRow(p)).join('')}</tbody>
  </table>`;
}

function _userRow(p){
  const isSelf  = p.id === currentUser?.id;
  const color   = ROLE_COLORS[p.role] || '#888';
  const label   = ROLE_LABELS[p.role] || p.role;
  const icons   = { admin:'👑', dev:'💻', estagiario:'📋', marketing:'📣' };
  const icon    = icons[p.role] || '👤';
  const created = p.created_at ? fmtDate(p.created_at.slice(0,10)) : '—';

  return `<tr style="${isSelf ? 'background:rgba(45,157,143,.04)' : ''}">
    <td>
      <div class="td-lead">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,${color},${color}88);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0">
          ${esc((p.avatar || p.name?.[0] || '?').toUpperCase())}
        </div>
        <div>
          <div class="td-name">${esc(p.name)}${isSelf ? ` <span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px;background:rgba(45,157,143,.12);color:var(--teal)">você</span>` : ''}</div>
          <div class="td-email">${esc(p.email || '—')}</div>
        </div>
      </div>
    </td>
    <td>
      <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px;background:${color}18;color:${color};white-space:nowrap">
        ${icon} ${label}
      </span>
    </td>
    <td><span style="font-family:var(--mono);font-size:11px;color:var(--text3)">${created}</span></td>
    <td style="text-align:right;padding-right:14px">
      ${isSelf
        ? `<span style="font-size:11px;color:var(--text3)">Seu perfil</span>`
        : `<div style="display:flex;gap:6px;justify-content:flex-end;align-items:center">
            <button class="btn btn-sm btn-ghost" onclick="updateUserName('${p.id}','${esc(p.name)}')" title="Editar nome">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Nome
            </button>
            <select onchange="confirmRoleChange('${p.id}',this,'${p.role}')"
              style="padding:4px 8px;background:${color}12;border:1px solid ${color}30;border-radius:var(--r-sm);font-family:var(--font);font-size:11px;font-weight:700;color:${color};cursor:pointer;outline:none">
              <option value="admin"      ${p.role==='admin'?'selected':''}>👑 Admin</option>
              <option value="dev"        ${p.role==='dev'?'selected':''}>💻 Dev</option>
              <option value="estagiario" ${p.role==='estagiario'?'selected':''}>📋 Estagiário</option>
              <option value="marketing"  ${p.role==='marketing'?'selected':''}>📣 Marketing</option>
            </select>
           </div>`}
    </td>
  </tr>`;
}

function _renderPermissionsMatrix(){
  const cols = [
    { label:'👑 Admin / Dev', c:'#d4af37' },
    { label:'📋 Estagiário',  c:'#a855f7' },
    { label:'📣 Marketing',   c:'#f97316' },
  ];
  const rows = [
    ['Dashboard',             true,  true,  true ],
    ['Kanban',                true,  true,  false],
    ['Leads — ver',           true,  true,  true ],
    ['Leads — criar/editar',  true,  true,  false],
    ['Leads — excluir',       true,  true,  false],
    ['Relatórios',            true,  true,  true ],
    ['Tarefas',               true,  true,  false],
    ['Abordagem WPP',         true,  true,  false],
    ['Funis de Venda',        true,  true,  false],
    ['Configurações',         true,  true,  true ],
    ['Gerenciar Usuários',    true,  false, false],
    ['Mentorias',             true,  false, false],
  ];

  const cell = ok => ok
    ? `<td style="text-align:center"><span style="color:#22c55e;font-size:14px;font-weight:700">✓</span></td>`
    : `<td style="text-align:center"><span style="color:var(--text3);font-size:13px">—</span></td>`;

  return `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">🔒 Matriz de Permissões</span>
        <span class="card-sub">por perfil de acesso</span>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>Funcionalidade</th>
            ${cols.map(c => `<th style="text-align:center;color:${c.c};font-size:11px;white-space:nowrap">${c.label}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${rows.map(([feat, ...checks]) => `<tr>
              <td style="font-size:12px;color:var(--text2)">${feat}</td>
              ${checks.map(ok => cell(ok)).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function filterUsuarios(){
  _usuariosSearch     = (document.getElementById('u-search')?.value || '').toLowerCase();
  _usuariosRoleFilter =  document.getElementById('u-role-filter')?.value || 'all';

  let filtered = _usuariosCache;
  if(_usuariosSearch)
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(_usuariosSearch) ||
      (p.email || '').toLowerCase().includes(_usuariosSearch)
    );
  if(_usuariosRoleFilter !== 'all')
    filtered = filtered.filter(p => p.role === _usuariosRoleFilter);

  const wrap    = document.getElementById('u-table-wrap');
  const countEl = document.getElementById('u-count');
  if(wrap)    wrap.innerHTML = _buildUserTable(filtered);
  if(countEl) countEl.textContent = `${filtered.length} usuário${filtered.length !== 1 ? 's' : ''}`;
}

function confirmRoleChange(userId, selectEl, oldRole){
  const newRole = selectEl.value;
  if(newRole === oldRole) return;
  selectEl.value = oldRole; // reset imediatamente; re-render corrige se confirmado
  const oldLabel = ROLE_LABELS[oldRole] || oldRole;
  const newLabel = ROLE_LABELS[newRole] || newRole;
  showConfirm({
    title: '🔄 Alterar Perfil de Acesso',
    msg: `Alterar perfil de <strong>${oldLabel}</strong> para <strong>${newLabel}</strong>?<br><span style="font-size:11px;color:var(--text3);margin-top:4px;display:block">As permissões mudam imediatamente após confirmar.</span>`,
    confirmText: 'Confirmar',
    onConfirm: async () => { await updateUserRole(userId, newRole); }
  });
}

async function updateUserRole(userId, newRole){
  const { error } = await dbUpdateProfileRole(userId, newRole);
  if(error){ showError(error.message); return; }
  const p = _usuariosCache.find(x => x.id === userId);
  if(p) p.role = newRole;
  toast(`✅ Perfil atualizado para ${ROLE_LABELS[newRole]}`);
  renderUsuarios();
}

async function updateUserName(userId, currentName){
  showInputModal({
    title: 'Editar Nome',
    label: 'Novo nome',
    placeholder: 'Nome completo',
    value: currentName,
    onConfirm: async newName => {
      if(newName === currentName) return;
      const { error } = await dbUpdateProfileName(userId, newName);
      if(error){ showError(error.message); return; }
      const p = _usuariosCache.find(x => x.id === userId);
      if(p){ p.name = newName; p.avatar = newName[0].toUpperCase(); }
      toast('✅ Nome atualizado!');
      renderUsuarios();
    }
  });
}

function openMyProfile(){
  if(!currentUser) return;
  showInputModal({
    title: 'Meu Perfil',
    label: 'Nome de exibição',
    placeholder: 'Seu nome completo',
    value: currentUser.name,
    onConfirm: async newName => {
      if(newName === currentUser.name) return;
      const { error } = await dbUpdateProfileName(currentUser.id, newName);
      if(error){ showError(error.message); return; }
      currentUser.name = newName;
      currentUser.avatar = newName[0].toUpperCase();
      updateUIForUser();
      renderSidebar();
      renderConfiguracoes();
      toast('✅ Nome atualizado!');
    }
  });
}

function showLoginScreen(){
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('sidebar').style.display = 'none';
  document.getElementById('main').style.display = 'none';
  const topbar = document.querySelector('.topbar');
  if(topbar) topbar.style.display = 'none';
  const bottomNav = document.getElementById('bottom-nav');
  if(bottomNav) bottomNav.style.display = 'none';
}

function hideLoginScreen(){
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('sidebar').style.display = '';
  document.getElementById('main').style.display = '';
  const topbar = document.querySelector('.topbar');
  if(topbar) topbar.style.display = '';
  const bottomNav = document.getElementById('bottom-nav');
  if(bottomNav) bottomNav.style.display = '';
  updateUIForUser();
}
