let _dirtyPages = new Set(['dashboard','kanban','leads-list','funnels-cfg','etiquetas','automacoes','reports','tarefas','thiago','abordagem','configuracoes','usuarios']);

/* ── Busca Global ── */
function onGlobalSearch(val){
  const q = val.trim();
  const badge = document.getElementById('gs-clear');
  if(badge) badge.style.display = q ? 'flex' : 'none';
}

function clearGlobalSearch(){
  const inp = document.getElementById('global-search');
  if(inp){ inp.value = ''; onGlobalSearch(''); inp.focus(); }
}

function execGlobalSearch(){
  const inp = document.getElementById('global-search');
  const q = (inp?.value||'').trim();
  if(q.length < 2){ inp?.focus(); return; }
  tableSearch = q;
  leadsTablePage = 1;
  showPage('leads-list');
  // reset campo após navegar
  setTimeout(()=>{ if(inp){ inp.value=''; onGlobalSearch(''); } }, 150);
}

function markPagesDirty(...pages){
  pages.forEach(p => { if(p !== currentPage) _dirtyPages.add(p); });
}

function invalidateLeadPages()      { markPagesDirty('dashboard','kanban','leads-list','reports','tarefas'); }
function invalidateTaskPages()      { markPagesDirty('dashboard','tarefas'); }
function invalidateMentorshipPages(){ markPagesDirty('dashboard','thiago'); }
function invalidateFunnelPages()    { markPagesDirty('dashboard','kanban','funnels-cfg','leads-list'); }
function invalidateTagPages()       { markPagesDirty('etiquetas','leads-list','kanban','reports'); }
function invalidateAutomationPages(){ markPagesDirty('automacoes','dashboard','kanban','leads-list','reports'); }

/* ── Abas da página Leads ── */
let leadsTab = 'lista';
function switchLeadsTab(tab){
  leadsTab = tab;
  document.getElementById('ltab-lista')?.classList.toggle('active', tab==='lista');
  document.getElementById('ltab-abordagem')?.classList.toggle('active', tab==='abordagem');
  document.getElementById('leads-view-lista').style.display  = tab==='lista'  ? '' : 'none';
  document.getElementById('leads-view-abordagem').style.display = tab==='abordagem' ? '' : 'none';
  const phRight = document.getElementById('leads-ph-right');
  if(phRight) phRight.style.display = tab==='lista' ? '' : 'none';
  const title = document.getElementById('leads-ph-title');
  const countLbl = document.getElementById('leads-count-lbl');
  if(tab==='abordagem'){
    if(title) title.textContent = 'Abordagem';
    if(countLbl) countLbl.textContent = 'Scripts e contatos WhatsApp';
    renderAbordagem();
  } else {
    if(title) title.textContent = 'Leads';
    renderLeadsTable();
  }
}

function showPage(p) {
  // Redireciona aliases
  if(p === 'funnels') p = 'funnels-cfg';
  if(p === 'abordagem'){ showPage('leads-list'); setTimeout(()=>switchLeadsTab('abordagem'),50); return; }

  if(!canAccess(p)){
    toast('⛔ Sem permissão para acessar esta área'); return;
  }
  currentPage = p;
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  const pg = document.getElementById('page-'+p);
  if(pg) pg.classList.add('active');

  // Ao entrar em leads-list, sempre mostrar aba lista
  if(p==='leads-list' && leadsTab==='abordagem') switchLeadsTab('lista');

  // Mapeia página → item de nav ativo
  const navMap = {
    'dashboard':'nav-dashboard','kanban':'nav-kanban','leads-list':'nav-leads',
    'funnels-cfg':'nav-configuracoes','etiquetas':'nav-configuracoes','automacoes':'nav-configuracoes','reports':'nav-reports','tarefas':'nav-tarefas',
    'thiago':'nav-mentorias','configuracoes':'nav-configuracoes','usuarios':'nav-configuracoes'
  };
  const nv = document.getElementById(navMap[p]||'');
  if(nv) nv.classList.add('active');

  closeDetail();
  if(_dirtyPages.has(p)){
    _dirtyPages.delete(p);
    if(p==='dashboard')       renderDashboard();
    else if(p==='kanban')     renderKanban();
    else if(p==='leads-list') renderLeadsTable();
    else if(p==='funnels-cfg'){ _dirtyPages.add(p); renderFunnels(); }
    else if(p==='etiquetas')  { _dirtyPages.add(p); renderTags(); }
    else if(p==='automacoes') { _dirtyPages.add(p); renderAutomations(); }
    else if(p==='reports')    renderReports();
    else if(p==='tarefas')    renderEstagiario();
    else if(p==='thiago')     renderThiago();
    else if(p==='abordagem')  renderAbordagem();
    else if(p==='configuracoes') renderConfiguracoes();
    else if(p==='usuarios')   { _dirtyPages.add(p); renderUsuarios(); }
  }
  document.querySelectorAll('.bn-item').forEach(el=>el.classList.remove('active'));
  const bnMap = {dashboard:'bn-dashboard',kanban:'bn-kanban','leads-list':'bn-leads',tarefas:'bn-tarefas'};
  const bnEl = document.getElementById(bnMap[p]||'');
  if(bnEl) bnEl.classList.add('active');
  closeSidebar();
}

function renderSidebar() {
  // Badges de contagem
  const overdueLeads = leads.filter(l => l.followUp && !l.converted && l.followUp < today()).length;
  const pendingTasks = tasks.filter(t => t.status !== 'concluida').length;
  const overdueTasks = tasks.filter(t => t.status !== 'concluida' && t.deadline && t.deadline < today()).length;

  const leadsN = document.getElementById('nav-leads-n');
  const kanbanN = document.getElementById('nav-kanban-n');
  if(leadsN){
    leadsN.textContent = overdueLeads > 0 ? `⚠ ${overdueLeads}` : leads.length;
    leadsN.style.background = overdueLeads > 0 ? 'rgba(239,68,68,.15)' : '';
    leadsN.style.color = overdueLeads > 0 ? 'var(--red)' : '';
  }
  if(kanbanN) kanbanN.textContent = leads.length;

  const tarefasN = document.getElementById('nav-tarefas-n');
  if(tarefasN){
    tarefasN.textContent = pendingTasks;
    tarefasN.style.display = pendingTasks ? '' : 'none';
    tarefasN.style.background = overdueTasks > 0 ? 'rgba(239,68,68,.15)' : 'rgba(168,85,247,.15)';
    tarefasN.style.color = overdueTasks > 0 ? 'var(--red)' : '#a855f7';
  }

  // Badge de notificações (sino)
  updateNotifBadge(overdueLeads, overdueTasks);

  // Visibilidade por role
  const navPages = {
    'nav-dashboard':'dashboard','nav-kanban':'kanban','nav-leads':'leads-list',
    'nav-reports':'reports','nav-tarefas':'tarefas',
    'nav-configuracoes':'configuracoes'
  };
  Object.entries(navPages).forEach(([navId, page]) => {
    const el = document.getElementById(navId);
    if(el) el.style.display = canAccess(page) ? '' : 'none';
  });

  // Mentorias: visível apenas para admin/dev
  const hasMentorias = canAccess('thiago');
  const sbMentorias  = document.getElementById('sb-section-mentorias');
  if(sbMentorias) sbMentorias.style.display = hasMentorias ? '' : 'none';

  // Dados do usuário no rodapé da sidebar
  if(currentUser){
    const nmEl = document.getElementById('sb-nm');
    const rlEl = document.getElementById('sb-rl');
    const avEl = document.getElementById('sb-av');
    if(nmEl) nmEl.textContent = currentUser.name;
    if(rlEl){ rlEl.textContent = ROLE_LABELS[currentUser.role]||currentUser.role.toUpperCase(); rlEl.style.color = ROLE_COLORS[currentUser.role]||'var(--text3)'; }
    if(avEl){ avEl.textContent = currentUser.avatar; avEl.style.background = `linear-gradient(135deg,${ROLE_COLORS[currentUser.role]||'#2d9d8f'},${ROLE_COLORS[currentUser.role]||'#35b8a8'}88)`; }
  }
}

/* ── Configurações: página de aterrizagem ── */
function renderConfiguracoes() {
  const el = document.getElementById('configuracoes-content');
  if(!el) return;
  const hasAdmin = canAccess('usuarios');
  const hasFunnels = canAccess('funnels-cfg');
  const hasTags = canAccess('etiquetas');
  const hasAutomations = canAccess('automacoes');

  el.innerHTML = `
    <div class="config-grid">
      ${hasFunnels ? `<div class="config-card" onclick="showPage('funnels-cfg')">
        <div class="config-card-icon" style="background:rgba(45,157,143,.1)">🎯</div>
        <div>
          <div class="config-card-title">Funis de Venda</div>
          <div class="config-card-desc">Crie e gerencie seus pipelines de vendas, etapas e funis personalizados.</div>
        </div>
        <div style="font-size:11px;color:var(--text3);display:flex;align-items:center;gap:4px">
          ${funnels.length} funil${funnels.length!==1?'s':''} cadastrado${funnels.length!==1?'s':''}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" style="margin-left:auto"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>` : ''}
      ${hasTags ? `
      <div class="config-card" onclick="showPage('etiquetas')">
        <div class="config-card-icon" style="background:rgba(212,175,55,.1)">🏷️</div>
        <div>
          <div class="config-card-title">Etiquetas</div>
          <div class="config-card-desc">Padronize tags para leads, mentorias, projetos, tarefas e produtos.</div>
        </div>
        <div style="font-size:11px;color:var(--text3);display:flex;align-items:center;gap:4px">
          ${tagsDbReady ? `${tags.length} etiqueta${tags.length!==1?'s':''}` : `${getAllLeadTags().length} tag${getAllLeadTags().length!==1?'s':''} livre${getAllLeadTags().length!==1?'s':''}`}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" style="margin-left:auto"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>` : ''}
      ${hasAutomations ? `
      <div class="config-card" onclick="showPage('automacoes')">
        <div class="config-card-icon" style="background:rgba(168,85,247,.1)">⚡</div>
        <div>
          <div class="config-card-title">Automações</div>
          <div class="config-card-desc">Aplique regras para follow-up, leads parados, alto potencial e risco operacional.</div>
        </div>
        <div style="font-size:11px;color:var(--text3);display:flex;align-items:center;gap:4px">
          ${Object.entries(automationSettings).filter(([k,v])=>typeof v==='boolean' && v).length} regra${Object.entries(automationSettings).filter(([k,v])=>typeof v==='boolean' && v).length!==1?'s':''} ativa${Object.entries(automationSettings).filter(([k,v])=>typeof v==='boolean' && v).length!==1?'s':''}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" style="margin-left:auto"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>` : ''}
      ${hasAdmin ? `
      <div class="config-card" onclick="showPage('usuarios')">
        <div class="config-card-icon" style="background:rgba(59,130,246,.1)">👥</div>
        <div>
          <div class="config-card-title">Usuários</div>
          <div class="config-card-desc">Gerencie os acessos, permissões e roles de cada membro da equipe.</div>
        </div>
        <div style="font-size:11px;color:var(--text3);display:flex;align-items:center;gap:4px">
          Gerenciar acesso
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" style="margin-left:auto"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>` : ''}
      <div class="config-card" onclick="openMyProfile()">
        <div class="config-card-icon" style="background:rgba(168,85,247,.1)">👤</div>
        <div>
          <div class="config-card-title">Meu Perfil</div>
          <div class="config-card-desc">Edite seu nome de exibição na plataforma.</div>
        </div>
        <div style="font-size:11px;color:var(--text3);display:flex;align-items:center;gap:4px">
          ${currentUser ? `<span style="font-size:10px;font-family:var(--mono)">${esc(currentUser.name)}</span>` : ''}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11" style="margin-left:auto"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>
  `;
}

function setActiveFunnel(id) {
  activeFunnelId = id;
  renderSidebar();
  showPage('kanban');
}

function toggleSidebar(){
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  const isOpen = sb.classList.contains('open');
  sb.classList.toggle('open', !isOpen);
  ov.classList.toggle('open', !isOpen);
}

function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

/* ── Notificações ── */
function updateNotifBadge(overdueLeads, overdueTasks){
  const total = overdueLeads + overdueTasks;
  const badge = document.getElementById('tb-notif-badge');
  const btn   = document.getElementById('tb-notif-btn');
  if(!badge || !btn) return;
  if(total > 0){
    badge.textContent = total > 9 ? '9+' : total;
    badge.style.display = 'flex';
    btn.style.color = 'var(--red)';
  } else {
    badge.style.display = 'none';
    btn.style.color = '';
  }
}

function toggleNotifDropdown(e){
  if(e) e.stopPropagation();
  let dd = document.getElementById('notif-dropdown');
  if(!dd){
    dd = document.createElement('div');
    dd.id = 'notif-dropdown';
    dd.className = 'notif-dropdown';
    document.body.appendChild(dd);
    document.addEventListener('click', e2 => {
      if(!dd.contains(e2.target) && e2.target.id !== 'tb-notif-btn') dd.classList.remove('open');
    }, {once:false});
  }

  const todayStr = today();
  const overdueLeads = leads.filter(l=>l.followUp && !l.converted && l.followUp < todayStr);
  const todayLeads   = leads.filter(l=>l.followUp && !l.converted && l.followUp === todayStr);
  const overdueTasks = tasks.filter(t=>t.status!=='concluida' && t.deadline && t.deadline < todayStr);
  const total = overdueLeads.length + todayLeads.length + overdueTasks.length;

  const btn = document.getElementById('tb-notif-btn');
  const rect = btn.getBoundingClientRect();
  dd.style.cssText = `position:fixed;top:${rect.bottom+8}px;right:${window.innerWidth-rect.right}px;z-index:9000`;

  dd.innerHTML = `
    <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:12px;font-weight:700">Notificações</span>
      ${total>0?`<span style="font-size:10px;background:rgba(239,68,68,.1);color:var(--red);padding:2px 8px;border-radius:99px;font-weight:700">${total} pendente${total!==1?'s':''}</span>`:''}
    </div>
    ${total===0?`<div style="padding:24px 16px;text-align:center;font-size:12px;color:var(--text3)">✅ Tudo em dia!</div>`:''}
    ${overdueLeads.length?`
      <div style="padding:8px 16px 4px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--text3)">Follow-ups atrasados</div>
      ${overdueLeads.slice(0,5).map(l=>`
        <div onclick="openDetail('${l.id}');toggleNotifDropdown()" style="padding:8px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:.15s" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
          <div style="width:28px;height:28px;border-radius:50%;background:${strColor(l.name)};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0">${initials(l.name)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l.name)}</div>
            <div style="font-size:10px;color:var(--red)">🚨 ${fmtDate(l.followUp)}</div>
          </div>
        </div>`).join('')}
      ${overdueLeads.length>5?`<div style="padding:4px 16px 8px;font-size:10px;color:var(--text3)">+${overdueLeads.length-5} mais</div>`:''}`:''}
    ${todayLeads.length?`
      <div style="padding:8px 16px 4px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--text3)">Follow-ups de hoje</div>
      ${todayLeads.slice(0,3).map(l=>`
        <div onclick="openDetail('${l.id}');toggleNotifDropdown()" style="padding:8px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:.15s" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
          <div style="width:28px;height:28px;border-radius:50%;background:${strColor(l.name)};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0">${initials(l.name)}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l.name)}</div>
            <div style="font-size:10px;color:var(--gold)">⏰ Hoje</div>
          </div>
        </div>`).join('')}`:''}
    ${overdueTasks.length?`
      <div style="padding:8px 16px 4px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--text3)">Tarefas atrasadas</div>
      ${overdueTasks.slice(0,3).map(t=>`
        <div onclick="showPage('tarefas');toggleNotifDropdown()" style="padding:8px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:.15s" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
          <div style="width:28px;height:28px;border-radius:99px;background:rgba(239,68,68,.1);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">📋</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.title)}</div>
            <div style="font-size:10px;color:var(--red)">🚨 ${fmtDate(t.deadline)}</div>
          </div>
        </div>`).join('')}`:''}
    ${total>0?`<div style="padding:8px 16px;border-top:1px solid var(--border)">
      <button onclick="showPage('leads-list');toggleNotifDropdown()" class="btn btn-sm" style="width:100%;justify-content:center">Ver todos os leads</button>
    </div>`:''}
  `;
  dd.classList.toggle('open');
}
