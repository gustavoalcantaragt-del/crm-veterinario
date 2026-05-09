/* ══════════════════════════════════════════
   MENTORIAS — Área privada (admin / dev)
   ══════════════════════════════════════════ */

/* ── Rendering principal ── */

function renderThiago() {
  const el = document.getElementById('thiago-content');
  if (!el) return;

  const active   = mentorships.filter(m => m.active);
  const inactive = mentorships.filter(m => !m.active);
  const monthlyRevenue = active.reduce((s, m) => s + (parseFloat(m.value) || 0), 0);
  const monthlyHours   = active.reduce((s, m) => (parseFloat(m.hoursPerSession) || 0) * (parseInt(m.sessionsPerWeek) || 0) + s, 0);
  const loadStatus = monthlyHours <= 10
    ? { l: 'Saudável', c: '#22c55e' }
    : monthlyHours <= 20
      ? { l: 'Moderada', c: '#d4af37' }
      : { l: 'Alta', c: 'var(--red)' };

  const todayStr   = today();
  const weekEndStr = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();
  const weekSessions = mentorships.flatMap(m =>
    (m.scheduleSessions || []).filter(d => d >= todayStr && d <= weekEndStr)
  );

  const TAB_LABELS = {
    'visao-geral': 'Visão Geral',
    mentorados:    'Mentorados',
    sessoes:       'Sessões',
    financeiro:    'Financeiro',
    notas:         'Notas',
  };

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
      <div>
        <h2 style="font-size:18px;font-weight:800;margin-bottom:4px">🎓 Mentorias</h2>
        <p style="font-size:12px;color:var(--text3)">Painel privado · mentorados, sessões e honorários</p>
      </div>
      <button class="btn btn-gold" onclick="openMentorshipModal()">+ Novo Mentorado</button>
    </div>

    <div class="stats-grid" style="margin-bottom:16px">
      ${statCard('Ativos', active.length, '', '#d4af37', 'rgba(212,175,55,.1)', _iconStar(), `${inactive.length} encerrado${inactive.length !== 1 ? 's' : ''}`)}
      ${statCard('Sessões (7d)', weekSessions.length, '', '#3b82f6', 'rgba(59,130,246,.1)', iconCalendar(), 'próximos 7 dias')}
      ${statCard('Receita/Mês', fmtMoney(monthlyRevenue), '', '#22c55e', 'rgba(34,197,94,.1)', iconMoney(), `${active.length} mentoria${active.length !== 1 ? 's' : ''}`)}
      ${statCard('Carga/Mês', monthlyHours.toFixed(1) + 'h', '', loadStatus.c, monthlyHours > 20 ? 'rgba(239,68,68,.1)' : monthlyHours > 10 ? 'rgba(212,175,55,.1)' : 'rgba(34,197,94,.1)', _iconClock(), loadStatus.l)}
    </div>

    <div class="leads-tabs" style="margin-bottom:0">
      ${Object.entries(TAB_LABELS).map(([t, l]) =>
        `<button id="mtab-${t}" class="leads-tab${mentoriasTab === t ? ' active' : ''}" onclick="switchMentoriasTab('${t}')">${l}</button>`
      ).join('')}
    </div>

    <div id="mentorias-tab-content" style="margin-top:16px">
      ${_mentoriasTabContent(mentoriasTab)}
    </div>
  `;
}

function switchMentoriasTab(tab) {
  mentoriasTab = tab;
  ['visao-geral', 'mentorados', 'sessoes', 'financeiro', 'notas'].forEach(t => {
    document.getElementById('mtab-' + t)?.classList.toggle('active', t === tab);
  });
  const content = document.getElementById('mentorias-tab-content');
  if (content) content.innerHTML = _mentoriasTabContent(tab);
}

function _mentoriasTabContent(tab) {
  if (tab === 'visao-geral') return _mentoriasVisaoGeral();
  if (tab === 'mentorados')  return _mentoriasLista();
  if (tab === 'sessoes')     return _mentoriasSessoes();
  if (tab === 'financeiro')  return _mentoriasFinanceiro();
  if (tab === 'notas')       return _mentoriasNotas();
  return '';
}

/* ── Aba: Visão Geral ── */

function _mentoriasVisaoGeral() {
  const active   = mentorships.filter(m => m.active);
  const inactive = mentorships.filter(m => !m.active);
  const todayStr = today();

  const monthlyHours  = active.reduce((s, m) => (parseFloat(m.hoursPerSession) || 0) * (parseInt(m.sessionsPerWeek) || 0) + s, 0);
  const contractHours = active.reduce((s, m) => (parseFloat(m.hoursPerSession) || 0) * (parseInt(m.sessionsPerWeek) || 0) * (parseInt(m.totalWeeks) || 0) + s, 0);
  const loadStatus = monthlyHours <= 10
    ? { l: 'Carga Saudável ✅', c: '#22c55e', bg: 'rgba(34,197,94,.07)', bc: 'rgba(34,197,94,.2)' }
    : monthlyHours <= 20
      ? { l: 'Carga Moderada ⚠️', c: '#d4af37', bg: 'rgba(212,175,55,.07)', bc: 'rgba(212,175,55,.2)' }
      : { l: 'Carga Alta 🔴', c: 'var(--red)', bg: 'rgba(239,68,68,.07)', bc: 'rgba(239,68,68,.2)' };

  const allUpcoming = mentorships.flatMap(m =>
    (m.scheduleSessions || []).filter(d => d >= todayStr).slice(0, 5)
      .map(d => ({ date: d, client: m.client, type: m.type }))
  ).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12);

  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return `
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:16px">
      <div style="display:flex;flex-direction:column;gap:16px">

        <div style="padding:14px 18px;border-radius:var(--r);background:${loadStatus.bg};border:1px solid ${loadStatus.bc};display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
          <div>
            <div style="font-size:13px;font-weight:700;color:${loadStatus.c}">${loadStatus.l}</div>
            <div style="font-size:11.5px;color:var(--text3);margin-top:3px">${monthlyHours.toFixed(1)}h/mês · ${contractHours.toFixed(0)}h total em contratos</div>
          </div>
          <div style="font-size:32px;font-weight:900;color:${loadStatus.c}">${monthlyHours.toFixed(1)}<span style="font-size:14px">h/mês</span></div>
        </div>

        <div class="card">
          <div class="card-hd">
            <span class="card-title">🎓 Mentorias Ativas (${active.length})</span>
            <button class="btn btn-sm btn-gold" onclick="openMentorshipModal()">+ Nova</button>
          </div>
          ${active.length === 0 ? `<div class="empty"><div class="empty-icon">🎓</div><p>Nenhuma mentoria ativa</p></div>` : active.map(m => mentorshipRow(m)).join('')}
        </div>

        ${inactive.length > 0 ? `
        <div class="card">
          <div class="card-hd"><span class="card-title">⏸️ Encerradas (${inactive.length})</span></div>
          ${inactive.map(m => mentorshipRow(m)).join('')}
        </div>` : ''}
      </div>

      <div class="card" style="align-self:start">
        <div class="card-hd">
          <span class="card-title">📅 Próximas Sessões</span>
          <span class="card-sub">${allUpcoming.length}</span>
        </div>
        <div style="max-height:500px;overflow-y:auto">
          ${allUpcoming.length === 0
            ? `<div style="padding:28px 16px;text-align:center;font-size:12px;color:var(--text3)">Nenhuma sessão agendada<br><small>Configure a agenda ao editar uma mentoria</small></div>`
            : allUpcoming.map(s => {
                const dt = new Date(s.date + 'T00:00:00');
                const isToday = s.date === todayStr;
                return `<div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
                  <div style="width:38px;text-align:center;flex-shrink:0">
                    <div style="font-size:16px;font-weight:900;color:${isToday ? 'var(--gold)' : 'var(--text)'};line-height:1">${dt.getDate()}</div>
                    <div style="font-size:9px;color:var(--text3);font-family:var(--mono)">${DAYS[dt.getDay()]}</div>
                  </div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(s.client)}</div>
                    <div style="font-size:10px;color:var(--text3)">${esc(s.type)}</div>
                  </div>
                  ${isToday ? `<span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:rgba(212,175,55,.1);color:var(--gold);flex-shrink:0">HOJE</span>` : ''}
                </div>`;
              }).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ── Aba: Mentorados ── */

function _mentoriasLista() {
  const all = [...mentorships].sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return a.client.localeCompare(b.client);
  });

  if (!all.length) return `<div class="empty"><div class="empty-icon">🎓</div><p>Nenhum mentorado cadastrado</p><button class="btn btn-gold" style="margin-top:12px" onclick="openMentorshipModal()">+ Novo Mentorado</button></div>`;

  const todayStr = today();

  return `
    <div class="card">
      <div class="card-hd">
        <span class="card-title">Todos os Mentorados</span>
        <button class="btn btn-sm btn-gold" onclick="openMentorshipModal()">+ Novo</button>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>Mentorado</th>
            <th>Tipo</th>
            <th>Período</th>
            <th>Carga</th>
            <th>Valor/mês</th>
            <th>Status</th>
            <th></th>
          </tr></thead>
          <tbody>
            ${all.map(m => {
              const monthHours  = (parseFloat(m.hoursPerSession) || 0) * (parseInt(m.sessionsPerWeek) || 0);
              const nextSession = (m.scheduleSessions || []).find(d => d >= todayStr);
              const typeIcon    = m.type.includes('Grupo') ? '👥' : m.type.includes('Consul') ? '💼' : m.type.includes('Inten') ? '⚡' : '👤';
              return `<tr>
                <td>
                  <div class="td-lead">
                    <div class="td-av" style="background:${strColor(m.client)}">${initials(m.client)}</div>
                    <div>
                      <div class="td-name">${esc(m.client)}</div>
                      <div class="td-email">${nextSession ? '📅 ' + fmtDate(nextSession) : 'Sem sessão agendada'}</div>
                    </div>
                  </div>
                </td>
                <td><span style="font-size:11px">${typeIcon} ${esc(m.type)}</span></td>
                <td>
                  <span style="font-size:11px;color:var(--text3);font-family:var(--mono)">${m.startDate ? fmtDate(m.startDate) : '—'}</span>
                  ${m.endDate ? `<br><span style="font-size:10px;color:var(--text3)">até ${fmtDate(m.endDate)}</span>` : ''}
                </td>
                <td><span style="font-family:var(--mono);font-size:12px">${monthHours.toFixed(1)}h/mês</span></td>
                <td><span style="font-family:var(--mono);font-size:13px;font-weight:800;color:var(--gold)">${m.value ? fmtMoney(m.value) : '—'}</span></td>
                <td>
                  <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:${m.active ? 'rgba(34,197,94,.1)' : 'rgba(128,128,128,.1)'};color:${m.active ? '#22c55e' : 'var(--text3)'}">
                    ${m.active ? '● Ativa' : '○ Encerrada'}
                  </span>
                </td>
                <td style="text-align:right;padding-right:12px">
                  <div style="display:flex;gap:4px;justify-content:flex-end">
                    <button class="btn btn-sm btn-ghost" onclick="editMentorship('${m.id}')">✏️</button>
                    <button class="btn btn-sm btn-ghost" style="color:var(--red)" onclick="deleteMentorship('${m.id}')">🗑️</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── Aba: Sessões ── */

function _mentoriasSessoes() {
  const todayStr = today();
  const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const allSessions = mentorships.flatMap(m =>
    (m.scheduleSessions || []).map(d => ({ date: d, client: m.client, type: m.type, past: d < todayStr, isToday: d === todayStr }))
  ).sort((a, b) => a.date.localeCompare(b.date));

  if (!allSessions.length) return `<div class="empty"><div class="empty-icon">📅</div><p>Nenhuma sessão agendada</p><p style="font-size:11px;margin-top:4px">Configure a agenda ao editar uma mentoria</p></div>`;

  const upcoming = allSessions.filter(s => !s.past);
  const past = allSessions.filter(s => s.past).reverse().slice(0, 30);

  const renderGroup = (sessions, title, pastStyle) => {
    if (!sessions.length) return '';
    return `
      <div class="card" style="margin-bottom:16px">
        <div class="card-hd">
          <span class="card-title">${title}</span>
          <span class="card-sub">${sessions.length} sessão${sessions.length !== 1 ? 'ões' : ''}</span>
        </div>
        <div>
          ${sessions.map(s => {
            const dt = new Date(s.date + 'T00:00:00');
            const bg    = s.isToday ? 'rgba(212,175,55,.08)' : pastStyle ? 'rgba(34,197,94,.04)' : '';
            const bdl   = s.isToday ? '3px solid var(--gold)' : '';
            const badge = s.isToday ? { l: 'HOJE', c: 'var(--gold)', bg: 'rgba(212,175,55,.1)' }
                         : pastStyle ? { l: 'Realizada', c: '#22c55e', bg: 'rgba(34,197,94,.08)' }
                         : { l: 'Agendada', c: 'var(--text3)', bg: 'var(--surface2)' };
            return `<div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;${bg ? 'background:' + bg + ';' : ''}${bdl ? 'border-left:' + bdl + ';' : ''}${pastStyle ? 'opacity:.75;' : ''}">
              <div style="width:44px;height:44px;border-radius:var(--r-sm);background:${s.isToday ? 'rgba(212,175,55,.1)' : 'var(--surface2)'};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;border:1px solid ${s.isToday ? 'rgba(212,175,55,.3)' : 'var(--border)'}">
                <div style="font-size:15px;font-weight:900;color:${s.isToday ? 'var(--gold)' : 'var(--text)'};line-height:1">${dt.getDate()}</div>
                <div style="font-size:9px;color:var(--text3);font-family:var(--mono)">${DAYS[dt.getDay()]}</div>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700">${esc(s.client)}</div>
                <div style="font-size:11px;color:var(--text3)">${esc(s.type)} · ${fmtDate(s.date)}</div>
              </div>
              <span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:4px;background:${badge.bg};color:${badge.c};white-space:nowrap;flex-shrink:0">${badge.l}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  };

  return renderGroup(upcoming, '📅 Próximas Sessões', false) + renderGroup(past, '✅ Sessões Realizadas', true);
}

/* ── Aba: Financeiro ── */

function _mentoriasFinanceiro() {
  const active = mentorships.filter(m => m.active);
  const monthlyRevenue = active.reduce((s, m) => s + (parseFloat(m.value) || 0), 0);
  const projection     = buildProjection(mentorships, 12);
  const maxProj        = Math.max(...projection.map(p => p.revenue), 1);
  const annualProj     = projection.reduce((s, p) => s + p.revenue, 0);

  return `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
      <div class="card" style="text-align:center;padding:20px">
        <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">Receita Mensal</div>
        <div style="font-size:26px;font-weight:900;color:#22c55e;font-family:var(--mono)">${fmtMoney(monthlyRevenue)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px">${active.length} ativa${active.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="card" style="text-align:center;padding:20px">
        <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">Projeção Anual</div>
        <div style="font-size:26px;font-weight:900;color:var(--gold);font-family:var(--mono)">${fmtMoney(annualProj)}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px">próximos 12 meses</div>
      </div>
      <div class="card" style="text-align:center;padding:20px">
        <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">Ticket Médio</div>
        <div style="font-size:26px;font-weight:900;color:#3b82f6;font-family:var(--mono)">${active.length ? fmtMoney(monthlyRevenue / active.length) : 'R$ 0'}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px">por mentorado/mês</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-hd">
        <div>
          <span class="card-title">📈 Projeção de Receita — 12 Meses</span>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">Baseado nas mentorias ativas e suas datas de término</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:18px;font-weight:900;color:var(--gold)">${fmtMoney(annualProj)}</div>
          <div style="font-size:10px;color:var(--text3)">total projetado</div>
        </div>
      </div>
      <div style="padding:20px 18px 8px">
        <div style="display:flex;align-items:flex-end;gap:6px;height:120px;margin-bottom:8px">
          ${projection.map(p => {
            const h = maxProj > 0 ? Math.round((p.revenue / maxProj) * 110) : 0;
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px" title="${p.label}: ${fmtMoney(p.revenue)}">
              ${p.revenue > 0 ? `<div style="font-size:8px;color:var(--gold);font-weight:700;font-family:var(--mono)">${fmtMoney(p.revenue).replace('R$ ', '')}</div>` : '<div style="font-size:8px;color:var(--text3)">—</div>'}
              <div style="width:100%;height:${Math.max(h, 2)}px;border-radius:4px 4px 0 0;background:${p.isCurrent ? 'var(--gold)' : p.revenue > 0 ? 'rgba(212,175,55,.35)' : 'rgba(255,255,255,.05)'};position:relative">
                ${p.isCurrent ? `<div style="position:absolute;top:-5px;left:50%;transform:translateX(-50%);width:6px;height:6px;background:var(--gold);border-radius:50%"></div>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex;gap:6px">
          ${projection.map(p => `<div style="flex:1;text-align:center;font-size:9px;color:${p.isCurrent ? 'var(--gold)' : 'var(--text3)'};font-weight:${p.isCurrent ? '700' : '400'};font-family:var(--mono)">${p.shortLabel}</div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><span class="card-title">💰 Honorários por Mentorado</span></div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>Mentorado</th>
            <th>Tipo</th>
            <th>Valor/mês</th>
            <th>Duração</th>
            <th>Contrato Total</th>
            <th>Status</th>
          </tr></thead>
          <tbody>
            ${!mentorships.length ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text3)">Nenhum mentorado cadastrado</td></tr>` : ''}
            ${mentorships.map(m => {
              const totalValue = (parseFloat(m.value) || 0) * (parseInt(m.totalWeeks) || 0);
              return `<tr>
                <td>
                  <div class="td-lead">
                    <div class="td-av" style="background:${strColor(m.client)};width:28px;height:28px;font-size:9px">${initials(m.client)}</div>
                    <span class="td-name">${esc(m.client)}</span>
                  </div>
                </td>
                <td><span style="font-size:11px;color:var(--text2)">${esc(m.type)}</span></td>
                <td><span style="font-family:var(--mono);font-size:13px;font-weight:800;color:#22c55e">${m.value ? fmtMoney(m.value) : '—'}</span></td>
                <td><span style="font-size:11px;color:var(--text3)">${m.totalWeeks ? m.totalWeeks + ' meses' : '—'}</span></td>
                <td><span style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--gold)">${totalValue ? fmtMoney(totalValue) : '—'}</span></td>
                <td>
                  <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:${m.active ? 'rgba(34,197,94,.1)' : 'rgba(128,128,128,.1)'};color:${m.active ? '#22c55e' : 'var(--text3)'}">
                    ${m.active ? 'Ativa' : 'Encerrada'}
                  </span>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── Aba: Notas ── */

function _mentoriasNotas() {
  if (!mentorships.length) return `<div class="empty"><div class="empty-icon">📝</div><p>Nenhum mentorado cadastrado</p></div>`;

  const sorted = [...mentorships].sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return a.client.localeCompare(b.client);
  });

  return `
    <div style="display:flex;flex-direction:column;gap:16px">
      ${sorted.map(m => {
        const typeIcon = m.type.includes('Grupo') ? '👥' : m.type.includes('Consul') ? '💼' : m.type.includes('Inten') ? '⚡' : '👤';
        return `
          <div class="card">
            <div class="card-hd">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:34px;height:34px;border-radius:50%;background:${strColor(m.client)};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff;flex-shrink:0">${initials(m.client)}</div>
                <div>
                  <div style="font-size:13px;font-weight:700">${esc(m.client)}</div>
                  <div style="font-size:10px;color:var(--text3)">${typeIcon} ${esc(m.type)} · <span style="color:${m.active ? '#22c55e' : 'var(--text3)'}">${m.active ? 'Ativa' : 'Encerrada'}</span></div>
                </div>
              </div>
              <button class="btn btn-sm btn-ghost" onclick="editMentorship('${m.id}')">✏️ Editar</button>
            </div>
            <div style="padding:14px 18px">
              ${m.notes
                ? `<p style="font-size:13px;color:var(--text2);line-height:1.8;white-space:pre-wrap">${esc(m.notes)}</p>`
                : `<p style="font-size:12px;color:var(--text3);font-style:italic">Nenhuma nota registrada. <span style="color:var(--teal);cursor:pointer" onclick="editMentorship('${m.id}')">Adicionar nota →</span></p>`}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ── Row individual de mentoria ── */

function mentorshipRow(m) {
  const monthHours = (parseFloat(m.hoursPerSession) || 0) * (parseInt(m.sessionsPerWeek) || 0);
  const totalHours = monthHours * (parseInt(m.totalWeeks) || 0);
  const typeIcon   = m.type.includes('Grupo') ? '👥' : m.type.includes('Consul') ? '💼' : m.type.includes('Inten') ? '⚡' : '👤';
  return `<div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:12px">
    <div style="width:38px;height:38px;border-radius:10px;background:${m.active ? 'rgba(212,175,55,.12)' : 'rgba(128,128,128,.1)'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${typeIcon}</div>
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:700;margin-bottom:3px">${esc(m.client)}</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:5px">
        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:${m.active ? 'rgba(212,175,55,.1)' : 'var(--surface3)'};color:${m.active ? 'var(--gold)' : 'var(--text3)'}">${esc(m.type)}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:11px;color:var(--text3)">
        <span>⏱ ${m.hoursPerSession}h/sessão · ${m.sessionsPerWeek}x/mês · ${m.totalWeeks} meses</span>
        <span>🕒 ${monthHours.toFixed(1)}h/mês · ${totalHours.toFixed(0)}h total</span>
        ${m.startDate ? `<span>📅 ${fmtDate(m.startDate)}</span>` : ''}
        ${m.value ? `<span style="color:var(--gold);font-weight:700">${fmtMoney(m.value)}/mês</span>` : ''}
      </div>
      ${m.notes ? `<div style="font-size:11px;color:var(--text3);margin-top:4px;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.notes)}</div>` : ''}
    </div>
    <div style="display:flex;gap:4px;flex-shrink:0">
      <button class="btn btn-sm btn-ghost" onclick="editMentorship('${m.id}')">✏️</button>
      <button class="btn btn-sm btn-ghost" style="color:var(--red)" onclick="deleteMentorship('${m.id}')">🗑️</button>
    </div>
  </div>`;
}

/* ── Ícones exclusivos da área ── */

function _iconStar()  { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`; }
function _iconClock() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`; }

/* ══════════════════════════════════════════
   AGENDA — Cálculo e geração de sessões
   ══════════════════════════════════════════ */

function buildProjection(allMentorships, months) {
  const now = new Date();
  const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const result = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const activeInMonth = allMentorships.filter(m => {
      if (!m.active && !m.endDate) return false;
      const start = m.startDate ? new Date(m.startDate + 'T00:00:00') : null;
      const end   = m.endDate   ? new Date(m.endDate + 'T00:00:00')   : null;
      if (!start && m.active) return true;
      if (start && start > monthEnd) return false;
      if (end   && end < monthStart)  return false;
      return true;
    });
    result.push({
      label:       `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`,
      shortLabel:  MONTHS_PT[d.getMonth()],
      revenue:     activeInMonth.reduce((s, m) => s + (parseFloat(m.value) || 0), 0),
      activeClients: activeInMonth.map(m => m.client),
      isCurrent:   i === 0,
    });
  }
  return result;
}

function generateSessions(m) {
  if (!m.startDate || m.scheduleType === 'nenhuma') return [];
  const start = new Date(m.startDate + 'T00:00:00');
  const end   = m.endDate ? new Date(m.endDate + 'T00:00:00') : (() => { const d = new Date(start); d.setMonth(d.getMonth() + (m.totalWeeks || 3)); return d; })();
  const sessions = [];
  const maxSessions = 200;
  let cur = new Date(start);

  if (m.scheduleType === 'semanal' || m.scheduleType === 'quinzenal') {
    const days = Array.isArray(m.scheduleDayOfWeek) ? m.scheduleDayOfWeek : [m.scheduleDayOfWeek].filter(x => x != null);
    if (!days.length) return [];
    while (cur <= end && sessions.length < maxSessions) {
      if (days.includes(cur.getDay())) {
        sessions.push(cur.toISOString().slice(0, 10));
        if (m.scheduleType === 'quinzenal') cur = new Date(cur.getTime() + 14 * 86400000);
        else cur = new Date(cur.getTime() + 86400000);
      } else {
        cur = new Date(cur.getTime() + 86400000);
      }
    }
  } else if (m.scheduleType === 'mensal_dia') {
    const day = m.scheduleDayOfMonth || 1;
    cur = new Date(start.getFullYear(), start.getMonth(), day);
    if (cur < start) cur.setMonth(cur.getMonth() + 1);
    while (cur <= end && sessions.length < maxSessions) {
      sessions.push(cur.toISOString().slice(0, 10));
      cur.setMonth(cur.getMonth() + 1);
      cur.setDate(day);
    }
  } else if (m.scheduleType === 'intervalo') {
    const interval = m.scheduleIntervalDays || 15;
    while (cur <= end && sessions.length < maxSessions) {
      sessions.push(cur.toISOString().slice(0, 10));
      cur = new Date(cur.getTime() + interval * 86400000);
    }
  }
  return sessions;
}

function previewSessions() {
  const start     = document.getElementById('mm2-start').value;
  const weeks     = parseInt(document.getElementById('mm2-weeks').value) || 0;
  const endVal    = document.getElementById('mm2-end').value;
  const schedType = document.getElementById('mm2-schedule-type').value;
  const mockM = {
    startDate: start,
    endDate: endVal || (start && weeks ? new Date(new Date(start + 'T00:00:00').getTime() + weeks * 7 * 86400000).toISOString().slice(0, 10) : ''),
    totalWeeks: weeks,
    scheduleType: schedType,
    scheduleDayOfWeek: getSelectedWeekdays(),
    scheduleDayOfMonth: parseInt(document.getElementById('mm2-day-of-month').value) || null,
    scheduleIntervalDays: parseInt(document.getElementById('mm2-interval-days').value) || null,
  };
  const sessions = generateSessions(mockM);
  const el = document.getElementById('mm2-preview-list');
  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const DAYS   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  if (!sessions.length) { el.innerHTML = '<span style="color:var(--red)">Nenhuma sessão gerada. Verifique os campos.</span>'; return; }
  el.innerHTML = `<span style="color:var(--gold);font-weight:700">${sessions.length} sessões geradas:</span><br>` + sessions.map(d => {
    const dt = new Date(d + 'T00:00:00');
    return `📅 ${DAYS[dt.getDay()]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
  }).join('<br>');
}

/* ══════════════════════════════════════════
   CRUD — Criar / Editar / Excluir
   ══════════════════════════════════════════ */

function openMentorshipModal(id) {
  editingMentorshipId = id || null;
  const m = id ? mentorships.find(x => x.id === id) : null;
  document.getElementById('mm2-title').textContent = m ? 'Editar Mentoria' : 'Nova Mentoria';
  document.getElementById('mm2-client').value  = m?.client || '';
  document.getElementById('mm2-type').value    = m?.type || 'Mentoria Individual';
  document.getElementById('mm2-hps').value     = m?.hoursPerSession || '';
  document.getElementById('mm2-spw').value     = m?.sessionsPerWeek || '';
  document.getElementById('mm2-weeks').value   = m?.totalWeeks || '';
  document.getElementById('mm2-start').value   = m?.startDate || '';
  document.getElementById('mm2-end').value     = m?.endDate || '';
  document.getElementById('mm2-active').value  = m ? (m.active ? 'true' : 'false') : 'true';
  document.getElementById('mm2-value').value   = m?.value || '';
  document.getElementById('mm2-notes').value   = m?.notes || '';
  const stype = m?.scheduleType || 'nenhuma';
  document.getElementById('mm2-schedule-type').value = stype;
  document.getElementById('mm2-day-of-month').value  = m?.scheduleDayOfMonth || '';
  document.getElementById('mm2-interval-days').value = m?.scheduleIntervalDays || '';
  [0, 1, 2, 3, 4, 5, 6].forEach(i => {
    const btn = document.getElementById('wd-' + i);
    if (!btn) return;
    const days   = m?.scheduleDayOfWeek;
    const active = Array.isArray(days) ? days.includes(i) : days === i;
    btn.style.background  = active ? 'rgba(212,175,55,.15)' : 'none';
    btn.style.color       = active ? 'var(--gold)' : 'var(--text3)';
    btn.style.borderColor = active ? 'rgba(212,175,55,.4)' : 'var(--border)';
    btn.dataset.sel = active ? '1' : '0';
  });
  toggleScheduleOptions();
  openMo('mo-mentorship');
  setTimeout(() => document.getElementById('mm2-client').focus(), 150);
}

function toggleWeekday(i) {
  const btn    = document.getElementById('wd-' + i);
  const active = btn.dataset.sel !== '1';
  btn.dataset.sel       = active ? '1' : '0';
  btn.style.background  = active ? 'rgba(212,175,55,.15)' : 'none';
  btn.style.color       = active ? 'var(--gold)' : 'var(--text3)';
  btn.style.borderColor = active ? 'rgba(212,175,55,.4)' : 'var(--border)';
}

function toggleScheduleOptions() {
  const t = document.getElementById('mm2-schedule-type').value;
  document.getElementById('mm2-schedule-semanal').style.display   = (t === 'semanal' || t === 'quinzenal') ? '' : 'none';
  document.getElementById('mm2-schedule-mensal').style.display    = t === 'mensal_dia' ? '' : 'none';
  document.getElementById('mm2-schedule-intervalo').style.display = t === 'intervalo' ? '' : 'none';
  document.getElementById('mm2-schedule-preview').style.display   = t !== 'nenhuma' ? '' : 'none';
}

function updateMentorshipEndDate() {
  const start  = document.getElementById('mm2-start').value;
  const months = parseInt(document.getElementById('mm2-weeks').value) || 0;
  if (start && months) {
    const d = new Date(start + 'T00:00:00');
    d.setMonth(d.getMonth() + months);
    document.getElementById('mm2-end').value = d.toISOString().slice(0, 10);
  }
}

function getSelectedWeekdays() {
  return [0, 1, 2, 3, 4, 5, 6].filter(i => {
    const btn = document.getElementById('wd-' + i);
    return btn && btn.dataset.sel === '1';
  });
}

async function saveMentorship() {
  const client = document.getElementById('mm2-client').value.trim();
  if (!validateForm([[client, 'Informe o nome do cliente']])) return;

  const btn        = document.querySelector('#mo-mentorship .btn-gold');
  const scheduleType = document.getElementById('mm2-schedule-type').value;
  const startVal   = document.getElementById('mm2-start').value;
  const weeksVal   = parseInt(document.getElementById('mm2-weeks').value) || 0;
  let endVal       = document.getElementById('mm2-end').value;
  if (!endVal && startVal && weeksVal) {
    const d = new Date(startVal + 'T00:00:00');
    d.setDate(d.getDate() + weeksVal * 7);
    endVal = d.toISOString().slice(0, 10);
  }

  const data = {
    client, type: document.getElementById('mm2-type').value,
    hoursPerSession:  parseFloat(document.getElementById('mm2-hps').value) || 0,
    sessionsPerWeek:  parseInt(document.getElementById('mm2-spw').value) || 1,
    totalWeeks: weeksVal, startDate: startVal, endDate: endVal,
    active: document.getElementById('mm2-active').value === 'true',
    value:  parseFloat(document.getElementById('mm2-value').value) || 0,
    notes:  document.getElementById('mm2-notes').value.trim(),
    scheduleType,
    scheduleDayOfWeek:    (scheduleType === 'semanal' || scheduleType === 'quinzenal') ? getSelectedWeekdays() : null,
    scheduleDayOfMonth:   scheduleType === 'mensal_dia' ? (parseInt(document.getElementById('mm2-day-of-month').value) || null) : null,
    scheduleIntervalDays: scheduleType === 'intervalo' ? (parseInt(document.getElementById('mm2-interval-days').value) || null) : null,
    scheduleSessions: [],
  };
  data.scheduleSessions = generateSessions(data);

  const wasEditing = editingMentorshipId;
  await withLoading(btn, async () => {
    if (wasEditing) {
      const { error } = await dbUpdateMentorship(wasEditing, mentorshipToDb(data));
      if (error) { showError(error.message); return; }
      Object.assign(mentorships.find(x => x.id === wasEditing), data);
    } else {
      const { data: row, error } = await dbInsertMentorship(mentorshipToDb(data));
      if (error) { showError(error.message); return; }
      mentorships.push(mapMentorship(row));
    }
    closeMo('mo-mentorship');
    renderThiago();
    invalidateMentorshipPages();
    toast(wasEditing ? '✅ Mentoria atualizada!' : '✅ Mentoria cadastrada!');
  });
}

function editMentorship(id) { openMentorshipModal(id); }

async function deleteMentorship(id) {
  const m = mentorships.find(x => x.id === id);
  showConfirm({
    title:       '🗑️ Excluir Mentoria',
    msg:         `Excluir a mentoria de "${m?.client || 'este cliente'}"? Esta ação não pode ser desfeita.`,
    confirmText: 'Sim, excluir',
    danger:      true,
    onConfirm:   async () => {
      const { error } = await dbDeleteMentorship(id);
      if (error) { showError(error.message); return; }
      mentorships = mentorships.filter(x => x.id !== id);
      renderThiago();
      invalidateMentorshipPages();
      toast('Mentoria removida');
    }
  });
}
