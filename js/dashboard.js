function renderDashboard() {
  const rawPeriod = document.getElementById('dash-period').value;
  const period = rawPeriod === 'all' ? 99999 : (parseInt(rawPeriod) || 30);
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - period);
  const inPeriod = l => period === 99999 || new Date(l.date) >= cutoff;
  const isOp = l => !(l.tags || []).includes('planilha');

  const opLeads      = leads.filter(isOp);
  const pLeads       = opLeads.filter(inPeriod);
  const totalVal     = opLeads.reduce((s, l) => s + (l.value || 0), 0);
  const convertedLeads = opLeads.filter(l => l.converted);
  const closedLeads  = opLeads.filter(l => {
    const f = getFunnel(l.funnelId); if (!f) return false;
    const last = f.stages[f.stages.length - 1];
    return last && l.stageId === last.id;
  });
  const closedVal    = closedLeads.reduce((s, l) => s + (l.value || 0), 0);
  const convRate     = opLeads.length ? Math.round(closedLeads.length / opLeads.length * 100) : 0;

  // Leads da semana (últimos 7 dias)
  const weekCutoff = new Date(); weekCutoff.setDate(weekCutoff.getDate() - 7);
  const weekLeads = opLeads.filter(l => new Date(l.date) >= weekCutoff);

  // Instagram / canais
  const igComentario = opLeads.filter(l => l.origin === 'ig_comentario');
  const igSeguidor   = opLeads.filter(l => l.origin === 'ig_seguidor');
  const igTotal      = igComentario.length + igSeguidor.length;
  const wppLeads     = opLeads.filter(l => l.origin === 'whatsapp');
  const frioLeads    = opLeads.filter(l => ['indicacao', 'organico', 'evento'].includes(l.origin));
  const vetLeads     = opLeads.filter(l => l.isVet === true);
  const nonVetLeads  = opLeads.filter(l => l.isVet === false);
  const vetPct       = opLeads.length ? Math.round(vetLeads.length / opLeads.length * 100) : 0;
  const nonVetPct    = 100 - vetPct;

  // Precisam de atenção — dados
  const todayStr = today();
  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);
  const sevenAgoStr = sevenAgo.toISOString().slice(0, 10);

  const overdueFollowUps = opLeads.filter(l => l.followUp && l.followUp < todayStr && !l.converted);
  const todayFollowUps   = opLeads.filter(l => l.followUp && l.followUp === todayStr && !l.converted);
  const stuckLeads = opLeads.filter(l => {
    if (l.converted) return false;
    // last touch: last activity time or entry date
    let lastTouch = l.date;
    if (l.activities && l.activities.length) {
      const last = l.activities[l.activities.length - 1];
      if (last.time) lastTouch = last.time.slice(0, 10);
    }
    return lastTouch < sevenAgoStr && !l.followUp;
  });
  const overdueTasksList = tasks.filter(t => t.deadline && t.deadline < todayStr && t.status !== 'concluida');

  const attentionCount = overdueFollowUps.length + todayFollowUps.length + stuckLeads.length + overdueTasksList.length;

  const el = document.getElementById('dash-content');
  el.innerHTML = `
    ${_dashAlertBanner(overdueFollowUps.length, overdueTasksList.length)}

    <div class="stats-grid">
      ${statCard('Leads Totais', opLeads.length, '', '#3b82f6', 'rgba(59,130,246,.1)', iconUsers(), `${weekLeads.length} esta semana`)}
      ${statCard('Pipeline Total', fmtMoney(totalVal), '', '#d4af37', 'rgba(212,175,55,.1)', iconMoney(), `${fmtMoney(closedVal)} fechado`)}
      ${statCard('Taxa de Conversão', convRate + '%', '', '#a855f7', 'rgba(168,85,247,.1)', iconTrend(), `${closedLeads.length} leads fechados`)}
      ${statCard('Leads da Semana', weekLeads.length, '', '#22c55e', 'rgba(34,197,94,.1)', iconCalendar(), `últimos 7 dias`)}
    </div>

    ${attentionCount > 0 ? _renderAttentionSection(overdueFollowUps, todayFollowUps, stuckLeads, overdueTasksList) : ''}

    <div class="dash-grid">
      <div class="card">
        <div class="card-hd"><span class="card-title">Pipeline por Funil</span><span class="card-sub">${funnels.length} funis ativos</span></div>
        <div class="card-body">${renderFunnelBars()}</div>
      </div>
      <div class="card">
        <div class="card-hd"><span class="card-title">Origem dos Leads</span></div>
        <div class="card-body">${renderOriginChart()}</div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-hd">
        <span class="card-title">Leads Recentes</span>
        <button class="btn btn-sm btn-ghost" onclick="showPage('leads-list')">Ver todos →</button>
      </div>
      <div>${renderRecentLeadsRows()}</div>
    </div>

    <div class="dash-grid-3" style="margin-top:16px">
      <div class="card">
        <div class="card-hd">
          <span class="card-title">📸 Instagram DM</span>
          <span class="card-sub">${igTotal} leads via DM</span>
        </div>
        <div class="card-body">
          <div style="display:flex;gap:12px;margin-bottom:14px">
            <div style="flex:1;background:rgba(225,48,108,.08);border:1px solid rgba(225,48,108,.2);border-radius:var(--r-sm);padding:12px;text-align:center">
              <div style="font-size:24px;font-weight:900;color:#e1306c">${igComentario.length}</div>
              <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-top:2px">Comentários</div>
            </div>
            <div style="flex:1;background:rgba(168,85,247,.08);border:1px solid rgba(168,85,247,.2);border-radius:var(--r-sm);padding:12px;text-align:center">
              <div style="font-size:24px;font-weight:900;color:#a855f7">${igSeguidor.length}</div>
              <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-top:2px">Seguidores/Anúncio</div>
            </div>
          </div>
          ${igTotal > 0 ? `
          <div style="font-size:10px;color:var(--text3);margin-bottom:4px">Distribuição</div>
          <div style="height:8px;border-radius:99px;overflow:hidden;display:flex;gap:2px">
            <div style="flex:${igComentario.length};background:#e1306c;border-radius:99px 0 0 99px"></div>
            <div style="flex:${igSeguidor.length};background:#a855f7;border-radius:0 99px 99px 0"></div>
          </div>
          <div style="display:flex;gap:12px;margin-top:6px">
            <span style="font-size:10px;color:#e1306c">💬 ${igTotal > 0 ? Math.round(igComentario.length / igTotal * 100) : 0}% comentários</span>
            <span style="font-size:10px;color:#a855f7">📢 ${igTotal > 0 ? Math.round(igSeguidor.length / igTotal * 100) : 0}% anúncio</span>
          </div>` : '<div style="font-size:12px;color:var(--text3);text-align:center;padding:8px">Sem leads de Instagram ainda</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <span class="card-title">📱 WPP & Indicação</span>
          <span class="card-sub">Canais de entrada</span>
        </div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.15);border-radius:var(--r-sm)">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:18px">📱</span>
                <span style="font-size:12px;font-weight:700;color:#22c55e">WhatsApp</span>
              </div>
              <span style="font-size:20px;font-weight:900;color:#22c55e">${wppLeads.length}</span>
            </div>
            ${frioLeads.length > 0 ? `
            <div style="display:flex;flex-direction:column;gap:4px">
              <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">❄️ Frio / Outros</div>
              ${['indicacao', 'organico', 'evento'].map(k => {
                const n = opLeads.filter(l => l.origin === k).length;
                if (!n) return '';
                const o = ORIGIN_MAP[k];
                return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;background:var(--surface2);border-radius:5px">
                  <span style="font-size:11px;color:var(--text2)">${o.icon} ${o.l}</span>
                  <span style="font-size:12px;font-weight:700;color:${o.c}">${n}</span>
                </div>`;
              }).join('')}
            </div>` : ''}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <span class="card-title">🩺 Qualidade do Lead</span>
          <span class="card-sub">% veterinários vs outros</span>
        </div>
        <div class="card-body">
          <div style="display:flex;gap:10px;margin-bottom:14px">
            <div style="flex:1;background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.2);border-radius:var(--r-sm);padding:12px;text-align:center">
              <div style="font-size:26px;font-weight:900;color:#22c55e">${vetPct}%</div>
              <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-top:2px">Veterinários</div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px">${vetLeads.length} leads</div>
            </div>
            <div style="flex:1;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.15);border-radius:var(--r-sm);padding:12px;text-align:center">
              <div style="font-size:26px;font-weight:900;color:var(--red)">${nonVetPct}%</div>
              <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-top:2px">Tráfego Sujo</div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px">${nonVetLeads.length} leads</div>
            </div>
          </div>
          ${opLeads.length > 0 ? `
          <div style="font-size:10px;color:var(--text3);margin-bottom:4px">Proporção</div>
          <div style="height:8px;border-radius:99px;overflow:hidden;display:flex;gap:2px">
            <div style="flex:${vetLeads.length || 0};background:#22c55e;border-radius:99px 0 0 99px;min-width:${vetLeads.length > 0 ? '4px' : '0'}"></div>
            <div style="flex:${nonVetLeads.length || 0};background:var(--red);border-radius:0 99px 99px 0;min-width:${nonVetLeads.length > 0 ? '4px' : '0'}"></div>
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:6px;text-align:center">${vetPct >= 60 ? '✅ Tráfego saudável' : '⚠️ Alto volume de tráfego sujo'}</div>`
          : '<div style="font-size:12px;color:var(--text3);text-align:center;padding:8px">Sem dados ainda</div>'}
        </div>
      </div>
    </div>
  `;
}

function _dashAlertBanner(overdueCount, overdueTasksCount) {
  const total = overdueCount + overdueTasksCount;
  if (!total) return '';
  const parts = [];
  if (overdueCount) parts.push(`${overdueCount} follow-up${overdueCount > 1 ? 's' : ''} atrasado${overdueCount > 1 ? 's' : ''}`);
  if (overdueTasksCount) parts.push(`${overdueTasksCount} tarefa${overdueTasksCount > 1 ? 's' : ''} vencida${overdueTasksCount > 1 ? 's' : ''}`);
  return `
    <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:var(--r);padding:12px 18px;display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <span style="font-size:18px">🚨</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:700;color:var(--red)">${parts.join(' e ')} pendente${total > 1 ? 's' : ''}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:1px">Veja a seção "Precisam de atenção" abaixo para agir agora</div>
      </div>
    </div>`;
}

function _renderAttentionSection(overdueFollowUps, todayFollowUps, stuckLeads, overdueTasksList) {
  const total = overdueFollowUps.length + todayFollowUps.length + stuckLeads.length + overdueTasksList.length;
  const rows = [];

  overdueFollowUps.slice(0, 5).forEach(l => {
    rows.push(`
      <div class="attn-row attn-red">
        <div class="attn-dot" style="background:var(--red)"></div>
        <div class="attn-body" onclick="openDetail('${l.id}')">
          <div class="attn-name">${esc(l.name)}</div>
          <div class="attn-sub">Follow-up atrasado desde ${fmtDate(l.followUp)}</div>
        </div>
        <div class="attn-actions">
          ${l.phone ? `<button class="btn btn-sm" onclick="event.stopPropagation();openWAModal('${l.id}')" style="padding:3px 8px;font-size:10px">📱 WA</button>` : ''}
          <button class="btn btn-sm" onclick="snoozeFollowUp('${l.id}',2)" style="padding:3px 8px;font-size:10px">+2d</button>
          <button class="btn btn-sm" onclick="markFollowUpDone('${l.id}')" style="padding:3px 8px;font-size:10px;background:rgba(34,197,94,.1);color:#22c55e;border-color:rgba(34,197,94,.2)">✓ Feito</button>
        </div>
      </div>`);
  });

  todayFollowUps.slice(0, 4).forEach(l => {
    rows.push(`
      <div class="attn-row attn-gold">
        <div class="attn-dot" style="background:var(--gold)"></div>
        <div class="attn-body" onclick="openDetail('${l.id}')">
          <div class="attn-name" style="color:var(--gold)">${esc(l.name)}</div>
          <div class="attn-sub">⏰ Follow-up manual hoje</div>
        </div>
        <div class="attn-actions">
          ${l.phone ? `<button class="btn btn-sm" onclick="event.stopPropagation();openWAModal('${l.id}')" style="padding:3px 8px;font-size:10px">📱 WA</button>` : ''}
          <button class="btn btn-sm" onclick="snoozeFollowUp('${l.id}',1)" style="padding:3px 8px;font-size:10px">+1d</button>
          <button class="btn btn-sm" onclick="markFollowUpDone('${l.id}')" style="padding:3px 8px;font-size:10px;background:rgba(34,197,94,.1);color:#22c55e;border-color:rgba(34,197,94,.2)">✓ Feito</button>
        </div>
      </div>`);
  });

  stuckLeads.slice(0, 4).forEach(l => {
    const f = getFunnel(l.funnelId);
    rows.push(`
      <div class="attn-row">
        <div class="attn-dot" style="background:#64748b"></div>
        <div class="attn-body" onclick="openDetail('${l.id}')">
          <div class="attn-name" style="color:var(--text2)">${esc(l.name)}</div>
          <div class="attn-sub">🧊 Parado há 7+ dias · ${f ? esc(f.name) : 'sem funil'}</div>
        </div>
        <div class="attn-actions">
          ${l.phone ? `<button class="btn btn-sm" onclick="event.stopPropagation();openWAModal('${l.id}')" style="padding:3px 8px;font-size:10px">📱 WA</button>` : ''}
          <button class="btn btn-sm" onclick="openDetail('${l.id}')" style="padding:3px 8px;font-size:10px">Ver lead</button>
        </div>
      </div>`);
  });

  overdueTasksList.slice(0, 3).forEach(t => {
    rows.push(`
      <div class="attn-row">
        <div class="attn-dot" style="background:#f97316"></div>
        <div class="attn-body" onclick="showPage('tarefas')">
          <div class="attn-name" style="color:#f97316">${esc(t.title)}</div>
          <div class="attn-sub">📋 Tarefa vencida em ${fmtDate(t.deadline)}</div>
        </div>
        <div class="attn-actions">
          <button class="btn btn-sm" onclick="showPage('tarefas')" style="padding:3px 8px;font-size:10px">Ver tarefas</button>
        </div>
      </div>`);
  });

  if (!rows.length) return '';

  return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-hd" style="cursor:pointer" onclick="this.closest('.card').querySelector('.attn-list').classList.toggle('attn-collapsed')">
        <span class="card-title">⚡ Precisam de atenção</span>
        <span class="card-sub" style="background:rgba(239,68,68,.1);color:var(--red);padding:2px 10px;border-radius:99px;font-weight:700">${total}</span>
      </div>
      <div class="attn-list">
        ${rows.join('')}
        ${total > rows.length ? `<div style="padding:10px 18px;font-size:11px;color:var(--text3);text-align:center">+${total - rows.length} mais — <span style="color:var(--teal);cursor:pointer" onclick="showPage('leads-list')">ver todos os leads</span></div>` : ''}
      </div>
    </div>`;
}

function statCard(lbl, val, delta, color, bg, icon, sub) {
  return `<div class="stat-card">
    <div class="stat-stripe" style="background:${color}"></div>
    <div class="stat-icon" style="background:${bg};color:${color}">${icon}</div>
    <div class="stat-val">${val}</div>
    <div class="stat-lbl">${lbl}</div>
    <div class="stat-sub">${sub}</div>
  </div>`;
}

function iconUsers()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>`; }
function iconMoney()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`; }
function iconCheck()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`; }
function iconTrend()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`; }
function iconCalendar() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`; }

function renderFunnelBars() {
  const opFunnels = funnels.filter(f =>
    !f.name.toLowerCase().includes('planilha') &&
    !f.name.toLowerCase().includes('gestor') &&
    !f.name.toLowerCase().includes('autôn') &&
    !f.name.toLowerCase().includes('auton')
  );
  const opLeadsAll = leads.filter(l => !(l.tags || []).includes('planilha'));
  return opFunnels.map(f => {
    const n = opLeadsAll.filter(l => l.funnelId === f.id).length;
    const max = Math.max(...opFunnels.map(ff => opLeadsAll.filter(l => l.funnelId === ff.id).length), 1);
    const pct = Math.round(n / max * 100);
    return `<div class="funnel-row">
      <span class="funnel-row-lbl">${f.icon} ${f.name}</span>
      <div class="funnel-track"><div class="funnel-fill" style="width:${pct}%;background:${f.color}"><span>${n}</span></div></div>
      <span class="funnel-n">${n}</span>
    </div>`;
  }).join('') || '<div style="font-size:12px;color:var(--text3);padding:8px">Nenhum funil operacional</div>';
}

function renderOriginChart() {
  const opLeadsAll = leads.filter(l => !(l.tags || []).includes('planilha'));
  const counts = {};
  opLeadsAll.forEach(l => { counts[l.origin] = (counts[l.origin] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;
  return sorted.map(([k, n]) => {
    const o = ORIGIN_MAP[k] || { l: k, c: '#888', bg: 'rgba(128,128,128,.1)' };
    return `<div class="funnel-row">
      <span class="funnel-row-lbl">${o.icon || ''} ${o.l}</span>
      <div class="funnel-track"><div class="funnel-fill" style="width:${Math.round(n / max * 100)}%;background:${o.c}"><span>${n}</span></div></div>
      <span class="funnel-n">${n}</span>
    </div>`;
  }).join('') || '<div style="font-size:12px;color:var(--text3);padding:8px">Sem dados</div>';
}

function renderRecentLeadsRows() {
  const todayStr = today();
  const opLeadsAll = leads.filter(l => !(l.tags || []).includes('planilha'));
  const recent = [...opLeadsAll].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  if (!recent.length) return '<div class="empty">Nenhum lead cadastrado ainda</div>';

  return `<div style="overflow-x:auto"><table><thead><tr>
    <th>Lead</th><th>Funil / Etapa</th><th>Origem</th><th>Valor</th><th>Follow-up</th><th></th>
  </tr></thead><tbody>
    ${recent.map(l => {
      const f  = getFunnel(l.funnelId);
      const s  = f?.stages.find(st => st.id === l.stageId);
      const o  = ORIGIN_MAP[l.origin] || { l: l.origin, c: '#888' };
      const fu = l.followUp;
      const fuOverdue = fu && fu < todayStr && !l.converted;
      const fuToday   = fu && fu === todayStr && !l.converted;
      const fuStyle   = fuOverdue
        ? 'color:var(--red);font-weight:700'
        : fuToday
          ? 'color:var(--gold);font-weight:700'
          : 'color:var(--text3)';
      const fuLabel   = fu ? fmtDate(fu) : '—';
      const fuPrefix  = fuOverdue ? '🔴 ' : fuToday ? '🟡 ' : '';
      return `<tr onclick="openDetail('${l.id}')" style="cursor:pointer" class="${fuOverdue ? 'tr-fu-expired' : ''}">
        <td><div class="td-lead">
          <div class="td-av" style="background:${strColor(l.name)}">${initials(l.name)}</div>
          <div><div class="td-name">${esc(l.name)}</div><div class="td-email">${esc(l.email || l.instagram || l.phone || '—')}</div></div>
        </div></td>
        <td>
          <span style="font-size:11px;color:var(--text2)">${esc(f?.name || '—')}</span><br>
          <span style="font-size:10px;color:var(--text3)">${esc(s?.name || '—')}</span>
        </td>
        <td><span class="origin-badge" style="background:${o.c}18;color:${o.c}">${o.icon || ''} ${o.l}</span></td>
        <td><span style="font-family:var(--mono);font-size:12px;font-weight:600;color:var(--gold)">${fmtMoney(l.value)}</span></td>
        <td><span style="font-family:var(--mono);font-size:11px;${fuStyle}">${fuPrefix}${fuLabel}</span></td>
        <td style="text-align:right;padding-right:14px">
          ${l.phone ? `<button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();openWAModal('${l.id}')" title="WhatsApp" style="padding:4px 8px">📱</button>` : ''}
        </td>
      </tr>`;
    }).join('')}
  </tbody></table></div>`;
}
