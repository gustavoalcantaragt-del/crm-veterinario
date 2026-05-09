/* ── Leads Table ── */
const LEADS_PAGE_SIZE = 50;
let leadsTablePage = 1;
const _debouncedLeadsBody = debounce(() => renderLeadsTableBody(), 280);

function renderLeadsTable(){
  const toolbar = document.getElementById('leads-toolbar');
  const hasAdvFilter = leadsFilters.origin||leadsFilters.status||leadsFilters.followup||leadsFilters.vet;
  const todayStr = today();
  toolbar.innerHTML = `
    <button class="filter-btn ${tableFilter==='all'?'active':''}" onclick="setTableFilter('all')">Todos (${leads.length})</button>
    ${funnels.map(f=>`<button class="filter-btn ${tableFilter===f.id?'active':''}" onclick="setTableFilter('${f.id}')">${f.icon} ${f.name}</button>`).join('')}
    <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
      <div style="position:relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:12px;height:12px;stroke:var(--text3);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Buscar…" style="padding-left:28px;width:160px;font-size:12px" value="${tableSearch}" oninput="tableSearch=this.value;leadsTablePage=1;_debouncedLeadsBody()">
      </div>
      <div style="position:relative">
        <button class="btn btn-sm ${hasAdvFilter?'btn-gold':'btn-ghost'}" onclick="toggleLeadsFilterPanel()" id="leads-filter-btn" style="gap:5px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filtros${hasAdvFilter?' ✓':''}
        </button>
        <div id="leads-filter-panel" style="display:none;position:absolute;right:0;top:calc(100% + 6px);z-index:200;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px;min-width:240px;box-shadow:var(--shadow-md)">
          <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">Filtros avançados</div>
          <div class="field" style="margin-bottom:10px">
            <label style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--text2);margin-bottom:4px;display:block">Origem</label>
            <select onchange="leadsFilters.origin=this.value;leadsTablePage=1;renderLeadsTableBody()" style="font-size:12px;padding:6px 10px">
              <option value="">Todas</option>
              ${Object.entries(ORIGIN_MAP).map(([k,o])=>`<option value="${k}" ${leadsFilters.origin===k?'selected':''}>${o.icon} ${o.l}</option>`).join('')}
            </select>
          </div>
          <div class="field" style="margin-bottom:10px">
            <label style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--text2);margin-bottom:4px;display:block">Status</label>
            <select onchange="leadsFilters.status=this.value;leadsTablePage=1;renderLeadsTableBody()" style="font-size:12px;padding:6px 10px">
              <option value="">Todos</option>
              <option value="converted" ${leadsFilters.status==='converted'?'selected':''}>✅ Convertidos</option>
              <option value="not_converted" ${leadsFilters.status==='not_converted'?'selected':''}>🔄 Em progresso</option>
            </select>
          </div>
          <div class="field" style="margin-bottom:10px">
            <label style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--text2);margin-bottom:4px;display:block">Follow-up</label>
            <select onchange="leadsFilters.followup=this.value;leadsTablePage=1;renderLeadsTableBody()" style="font-size:12px;padding:6px 10px">
              <option value="">Todos</option>
              <option value="overdue" ${leadsFilters.followup==='overdue'?'selected':''}>🚨 Atrasados</option>
              <option value="today" ${leadsFilters.followup==='today'?'selected':''}>⏰ Hoje</option>
              <option value="has" ${leadsFilters.followup==='has'?'selected':''}>📅 Com follow-up</option>
              <option value="none" ${leadsFilters.followup==='none'?'selected':''}>— Sem follow-up</option>
            </select>
          </div>
          <div class="field" style="margin-bottom:12px">
            <label style="font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--text2);margin-bottom:4px;display:block">Perfil</label>
            <select onchange="leadsFilters.vet=this.value;leadsTablePage=1;renderLeadsTableBody()" style="font-size:12px;padding:6px 10px">
              <option value="">Todos</option>
              <option value="vet" ${leadsFilters.vet==='vet'?'selected':''}>🩺 Veterinários</option>
              <option value="nvet" ${leadsFilters.vet==='nvet'?'selected':''}>⚠️ Não veterinários</option>
            </select>
          </div>
          <button onclick="leadsFilters={origin:'',status:'',followup:'',vet:''};leadsTablePage=1;renderLeadsTable()" class="btn btn-sm" style="width:100%;justify-content:center">Limpar filtros</button>
        </div>
      </div>
    </div>
  `;
  renderLeadsTableBody();
}

function toggleLeadsFilterPanel(){
  const panel = document.getElementById('leads-filter-panel');
  if(!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if(!isOpen){
    const close = e => { if(!panel.contains(e.target) && e.target.id !== 'leads-filter-btn') { panel.style.display='none'; document.removeEventListener('click', close); } };
    setTimeout(()=>document.addEventListener('click', close), 0);
  }
}

function setTableFilter(f){
  tableFilter = f;
  leadsTablePage = 1;
  renderLeadsTable();
}

function setLeadsPage(p){ leadsTablePage = p; renderLeadsTableBody(); }

function renderLeadsTableBody(){
  const todayStr = today();
  let filtered = tableFilter==='all'?leads:leads.filter(l=>l.funnelId===tableFilter);
  if(tableSearch){
    const q=tableSearch.toLowerCase();
    filtered=filtered.filter(l=>
      l.name.toLowerCase().includes(q)||
      (l.email||'').toLowerCase().includes(q)||
      (l.company||'').toLowerCase().includes(q)||
      (l.instagram||'').toLowerCase().includes(q)||
      (l.phone||'').toLowerCase().includes(q)
    );
  }
  // Filtros avançados
  if(leadsFilters.origin)  filtered = filtered.filter(l=>l.origin===leadsFilters.origin);
  if(leadsFilters.status==='converted')     filtered = filtered.filter(l=>l.converted);
  if(leadsFilters.status==='not_converted') filtered = filtered.filter(l=>!l.converted);
  if(leadsFilters.followup==='overdue') filtered = filtered.filter(l=>l.followUp && !l.converted && l.followUp<todayStr);
  if(leadsFilters.followup==='today')   filtered = filtered.filter(l=>l.followUp && !l.converted && l.followUp===todayStr);
  if(leadsFilters.followup==='has')     filtered = filtered.filter(l=>l.followUp);
  if(leadsFilters.followup==='none')    filtered = filtered.filter(l=>!l.followUp);
  if(leadsFilters.vet==='vet')  filtered = filtered.filter(l=>l.isVet);
  if(leadsFilters.vet==='nvet') filtered = filtered.filter(l=>!l.isVet);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));
  if(leadsTablePage > totalPages) leadsTablePage = totalPages;
  const start = (leadsTablePage - 1) * LEADS_PAGE_SIZE;
  const page  = filtered.slice(start, start + LEADS_PAGE_SIZE);

  document.getElementById('leads-count-lbl').textContent = `${total} lead${total!==1?'s':''} encontrado${total!==1?'s':''}`;
  const wrap = document.getElementById('leads-table-wrap');
  if(!total){wrap.innerHTML=`<div class="empty"><div class="empty-icon">🔍</div><p>Nenhum lead encontrado</p></div>`;return;}

  const paginationHtml = totalPages > 1 ? `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-top:1px solid var(--border);background:var(--surface2)">
      <span style="font-size:11px;color:var(--text3)">Página ${leadsTablePage} de ${totalPages} · ${start+1}–${Math.min(start+LEADS_PAGE_SIZE,total)} de ${total}</span>
      <div style="display:flex;gap:4px">
        <button class="btn btn-sm btn-ghost" onclick="setLeadsPage(${leadsTablePage-1})" ${leadsTablePage===1?'disabled':''} style="${leadsTablePage===1?'opacity:.4;cursor:not-allowed':''}">← Anterior</button>
        ${Array.from({length:Math.min(totalPages,7)},(_,i)=>{
          const pg = totalPages<=7 ? i+1 : leadsTablePage<=4 ? i+1 : leadsTablePage>=totalPages-3 ? totalPages-6+i : leadsTablePage-3+i;
          return `<button class="btn btn-sm ${pg===leadsTablePage?'btn-gold':'btn-ghost'}" onclick="setLeadsPage(${pg})">${pg}</button>`;
        }).join('')}
        <button class="btn btn-sm btn-ghost" onclick="setLeadsPage(${leadsTablePage+1})" ${leadsTablePage===totalPages?'disabled':''} style="${leadsTablePage===totalPages?'opacity:.4;cursor:not-allowed':''}">Próxima →</button>
      </div>
    </div>` : '';

  wrap.innerHTML = `<table>
    <thead><tr><th>Lead</th><th>Funil / Etapa</th><th>Origem</th><th>Valor</th><th>Follow-up</th><th>Perfil</th><th>Ações</th></tr></thead>
    <tbody>
    ${page.map(l=>{
      const f=getFunnel(l.funnelId),s=f?.stages.find(st=>st.id===l.stageId);
      const o=ORIGIN_MAP[l.origin]||{l:l.origin,c:'#888',bg:'rgba(128,128,128,.1)',icon:''};
      const fuExpired = l.followUp && !l.converted && l.followUp < todayStr;
      const fuToday   = l.followUp && !l.converted && l.followUp === todayStr;
      const rowClass  = fuExpired ? 'tr-fu-expired' : '';
      const fuLabel   = l.followUp
        ? fuExpired ? `<span style="color:var(--red);font-weight:700;font-size:10px">🚨 ${fmtDate(l.followUp)}</span>`
          : fuToday ? `<span style="color:var(--gold);font-weight:700;font-size:10px">⏰ Hoje</span>`
          : `<span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${fmtDate(l.followUp)}</span>`
        : '—';
      const waPhone = (l.phone||'').replace(/\D/g,'');
      return `<tr class="${rowClass}" onclick="openDetail('${l.id}')" style="cursor:pointer">
        <td><div class="td-lead"><div class="td-av" style="background:${strColor(l.name)}">${initials(l.name)}</div><div><div class="td-name">${esc(l.name)}</div><div class="td-email">${esc(l.email||l.instagram||l.phone||'—')}</div></div></div></td>
        <td>
          ${f ? `<span style="font-size:11px;color:var(--text2)">${esc(f.name)}</span><br>` : ''}
          <span style="font-size:10px;padding:1px 7px;border-radius:4px;font-weight:700;background:${s?.color||'var(--surface3)'}20;color:${s?.color||'var(--text3)'}">${esc(s?.name||'—')}</span>
        </td>
        <td><span class="origin-badge" style="background:${o.bg};color:${o.c}">${o.icon||''} ${o.l}</span></td>
        <td><span style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--gold)">${fmtMoney(l.value)}</span></td>
        <td>${fuLabel}</td>
        <td>
          <div style="display:flex;align-items:center;gap:3px">
            ${l.isVet?`<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(59,130,246,.1);color:#3b82f6;font-weight:700">VET</span>`:`<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(239,68,68,.08);color:var(--red);font-weight:700">NÃO</span>`}
            ${l.converted?`<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:rgba(34,197,94,.1);color:#22c55e;font-weight:700">✅</span>`:''}
          </div>
        </td>
        <td onclick="event.stopPropagation()">
          <div style="display:flex;gap:3px;align-items:center">
            ${waPhone?`<button class="btn btn-sm btn-ghost" onclick="openWAModal('${l.id}')" title="WhatsApp" style="padding:4px 7px;color:#25d366">
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.555 4.135 1.527 5.882L0 24l6.356-1.508A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.002-1.367l-.36-.214-3.722.882.918-3.616-.236-.373A9.792 9.792 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/></svg>
            </button>`:''}
            <button class="btn btn-sm btn-ghost" onclick="quickEditLead('${l.id}')" title="Editar" style="padding:4px 7px">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-sm btn-ghost" onclick="quickDeleteLead('${l.id}',this.dataset.name)" data-name="${esc(l.name)}" title="Excluir" style="padding:4px 7px;color:var(--red)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('')}
    </tbody>
  </table>
  ${paginationHtml}`;
}

/* ── Detail Panel ── */
function openDetail(id){
  activeLeadId = id;
  renderDetailPanel(id);
  document.getElementById('detail-panel').classList.add('open');
}

function closeDetail(){
  activeLeadId = null;
  document.getElementById('detail-panel').classList.remove('open');
}

/* ── Reagendar Follow-up rápido ── */
async function quickReschedule(leadId, newDate){
  const l = getLead(leadId); if(!l) return;
  const old = l.followUp;
  l.followUp = newDate || null;
  const {error} = await dbUpdateLead(leadId, {follow_up: l.followUp});
  if(error){ l.followUp = old; return showError(error.message); }
  l.activities = l.activities||[];
  l.activities.push({text:`Follow-up ${newDate ? 'agendado para '+fmtDate(newDate) : 'removido'}`, time:new Date().toISOString()});
  await dbUpdateLead(leadId, {activities: l.activities});
  renderDetailPanel(leadId);
  renderSidebar();
  invalidateLeadPages();
  toast(`📅 Follow-up ${newDate ? 'reagendado para '+fmtDate(newDate) : 'removido'}`);
}

/* ── WhatsApp Quick Modal ── */
function openWAModal(leadId){
  const l = getLead(leadId); if(!l) return;
  const waPhone = (l.phone||'').replace(/\D/g,'');
  if(!waPhone){ toast('Este lead não tem WhatsApp cadastrado'); return; }

  const script = typeof getScript === 'function' ? getScript(l) : `Olá, ${l.name.split(' ')[0]}!`;
  const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(script)}`;

  const id = 'mo-wa-quick';
  let el = document.getElementById(id);
  if(!el){
    el = document.createElement('div');
    el.id = id;
    el.className = 'modal-backdrop';
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);backdrop-filter:blur(4px)';
    document.body.appendChild(el);
  }

  el.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:0;width:min(480px,95vw);max-height:90vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.5)">
      <div style="padding:18px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:#25d36620;display:flex;align-items:center;justify-content:center;font-size:18px">💬</div>
          <div>
            <div style="font-size:13px;font-weight:700">${esc(l.name)}</div>
            <div style="font-size:11px;color:var(--text3);font-family:var(--mono)">${l.phone}</div>
          </div>
        </div>
        <button onclick="document.getElementById('${id}').style.display='none'" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:18px;line-height:1;padding:4px">×</button>
      </div>
      <div style="padding:16px 20px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);margin-bottom:8px;font-weight:600">Script sugerido</div>
        <textarea id="wa-script-txt" rows="7"
          style="width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px;font-family:var(--font);font-size:12px;color:var(--text);outline:none;resize:vertical;line-height:1.7;transition:.15s"
          onfocus="this.style.borderColor='#25d366'" onblur="this.style.borderColor='var(--border)'"
        >${esc(script)}</textarea>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button onclick="
            const txt=document.getElementById('wa-script-txt').value;
            navigator.clipboard.writeText(txt).then(()=>toast('✅ Mensagem copiada!'));
          " class="btn btn-sm btn-ghost" style="flex:1;justify-content:center;gap:6px;padding:8px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copiar mensagem
          </button>
          <a id="wa-open-link" href="${waLink}" target="_blank" rel="noopener"
            onclick="
              const txt=document.getElementById('wa-script-txt').value;
              const num='${waPhone}';
              this.href='https://wa.me/'+num+'?text='+encodeURIComponent(txt);
              setTimeout(()=>document.getElementById('${id}').style.display='none',300);
            "
            class="btn btn-sm" style="flex:1;justify-content:center;gap:6px;padding:8px;background:#25d366;color:#fff;border-color:#25d366;text-decoration:none;display:flex;align-items:center;border-radius:var(--r-sm);font-weight:600;font-size:12px;font-family:var(--font);cursor:pointer;transition:.15s">
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.555 4.135 1.527 5.882L0 24l6.356-1.508A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.002-1.367l-.36-.214-3.722.882.918-3.616-.236-.373A9.792 9.792 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/></svg>
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </div>`;

  el.style.display = 'flex';
  el.onclick = e => { if(e.target === el) el.style.display = 'none'; };
}

function renderDetailPanel(id){
  const l = getLead(id);
  if(!l){ closeDetail(); return; }
  const f = getFunnel(l.funnelId);
  const s = f?.stages.find(st=>st.id===l.stageId);
  const o = ORIGIN_MAP[l.origin]||{l:l.origin,c:'#888',bg:'rgba(128,128,128,.1)'};

  document.getElementById('dp-av').textContent = initials(l.name);
  document.getElementById('dp-av').style.background = strColor(l.name);
  document.getElementById('dp-name').textContent = l.name;
  document.getElementById('dp-stage').textContent = `${f?.name||'—'} → ${s?.name||'—'}`;

  const scroll = document.getElementById('dp-scroll');
  const todayStr = today();
  const followUpStatus = l.followUp ? (l.followUp < todayStr ? 'overdue' : l.followUp === todayStr ? 'today' : 'upcoming') : null;
  scroll.innerHTML = `
    <div style="padding:10px 0 4px;display:flex;flex-wrap:wrap;gap:5px">
      ${l.converted ? `<span style="background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">✅ Convertido${l.serviceMonths?' · '+l.serviceMonths+' mês'+((l.serviceMonths>1)?'es':''):''}</span>`:''}
      ${l.isVet ? `<span style="background:rgba(59,130,246,.1);color:#3b82f6;border:1px solid rgba(59,130,246,.2);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">🩺 Veterinário(a)</span>` : `<span style="background:rgba(239,68,68,.08);color:var(--red);border:1px solid rgba(239,68,68,.15);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">⚠️ Não Vet</span>`}
      ${followUpStatus==='overdue' ? `<span style="background:rgba(239,68,68,.1);color:var(--red);border:1px solid rgba(239,68,68,.25);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">🚨 Follow-up atrasado — ${fmtDate(l.followUp)}</span>` : ''}
      ${followUpStatus==='today'   ? `<span style="background:rgba(212,175,55,.1);color:var(--gold);border:1px solid rgba(212,175,55,.3);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">⏰ Follow-up HOJE</span>` : ''}
      ${followUpStatus==='upcoming'? `<span style="background:var(--surface2);color:var(--text2);border:1px solid var(--border);padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700">📅 Follow-up: ${fmtDate(l.followUp)}</span>` : ''}
    </div>
    <div class="dp-section">
      <div class="dp-section-title">Informações de Contato</div>
      ${l.email?`<div class="dp-field"><span class="dp-field-k">E-mail</span><span class="dp-field-v">${esc(l.email)}</span></div>`:''}
      ${l.phone?`<div class="dp-field"><span class="dp-field-k">WhatsApp</span><span class="dp-field-v">${esc(l.phone)}</span></div>`:''}
      ${l.instagram?`<div class="dp-field"><span class="dp-field-k">Instagram</span><a href="https://instagram.com/${esc(l.instagram.replace('@',''))}" target="_blank" style="font-size:12px;font-weight:700;color:#e1306c;text-decoration:none;font-family:var(--mono)">${esc(l.instagram)}</a></div>`:''}
      ${l.company?`<div class="dp-field"><span class="dp-field-k">Clínica/Empresa</span><span class="dp-field-v">${esc(l.company)}</span></div>`:''}
      <div class="dp-field"><span class="dp-field-k">Origem</span><span class="origin-badge" style="background:${o.bg};color:${o.c}">${o.icon||''} ${o.l}</span></div>
      <div class="dp-field"><span class="dp-field-k">Perfil</span><span class="dp-field-v" style="color:${l.isVet?'#3b82f6':'var(--red)'}">${l.isVet?'🩺 Veterinário(a)':'⚠️ Não Veterinário'}</span></div>
    </div>
    <div class="dp-section">
      <div class="dp-section-title">Pipeline</div>
      <div class="dp-field"><span class="dp-field-k">Funil</span><span class="dp-field-v">${f?.name||'—'}</span></div>
      <div class="dp-field"><span class="dp-field-k">Etapa</span><span class="dp-field-v" style="color:${s?.color||'var(--text)'}">${s?.name||'—'}</span></div>
      <div class="dp-field"><span class="dp-field-k">Valor Est.</span><span class="dp-field-v" style="color:var(--gold)">${fmtMoney(l.value)}</span></div>
      <div class="dp-field"><span class="dp-field-k">Entrada</span><span class="dp-field-v">${fmtDate(l.date)}</span></div>
      <div class="dp-field" style="align-items:center">
        <span class="dp-field-k">Follow-up</span>
        <div style="display:flex;align-items:center;gap:6px;flex:1">
          ${l.followUp
            ? `<span class="dp-field-v" style="color:${followUpStatus==='overdue'?'var(--red)':followUpStatus==='today'?'var(--gold)':'var(--text)'}">${fmtDate(l.followUp)}</span>`
            : `<span class="dp-field-v" style="color:var(--text3)">Não definido</span>`}
          <input type="date" id="dp-followup-picker" value="${l.followUp||''}"
            onchange="quickReschedule('${l.id}',this.value)"
            style="width:32px;height:24px;opacity:0;position:absolute;cursor:pointer">
          <button onclick="document.getElementById('dp-followup-picker').showPicker?document.getElementById('dp-followup-picker').showPicker():document.getElementById('dp-followup-picker').click()"
            style="background:none;border:1px solid var(--border);border-radius:5px;cursor:pointer;padding:3px 7px;font-size:10px;color:var(--text3);font-family:var(--font);white-space:nowrap;transition:.15s"
            onmouseover="this.style.borderColor='var(--gold)';this.style.color='var(--gold)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text3)'">
            📅 ${l.followUp ? 'Reagendar' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
    ${l.converted?`<div class="dp-section">
      <div class="dp-section-title">Conversão</div>
      <div class="dp-field"><span class="dp-field-k">Data de conversão</span><span class="dp-field-v" style="color:#22c55e">${fmtDate(l.convertedDate)||'—'}</span></div>
      <div class="dp-field"><span class="dp-field-k">Tempo juntos</span><span class="dp-field-v" style="color:#22c55e">${l.serviceMonths||0} mês${((l.serviceMonths||0)>1)?'es':''}</span></div>
    </div>`:''}
    ${(l.tags||[]).length?`<div class="dp-section">
      <div class="dp-section-title">Tags</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">${l.tags.map(t=>`<span class="kb-tag" style="background:rgba(212,175,55,.1);color:var(--gold);padding:3px 10px;border-radius:99px;font-size:11px">${esc(t)}</span>`).join('')}</div>
    </div>`:''}
    ${l.notes?`<div class="dp-section">
      <div class="dp-section-title">Notas</div>
      <div class="dp-notes">${esc(l.notes)}</div>
    </div>`:''}
    <div class="dp-section">
      <div class="dp-section-title" style="margin-bottom:12px">Atividades (${(l.activities||[]).length})</div>
      ${(l.activities||[]).length===0?`<div style="font-size:12px;color:var(--text3);text-align:center;padding:14px">Nenhuma atividade registrada</div>`:''}
      <div class="dp-timeline">
        ${[...(l.activities||[])].reverse().map(a=>`<div class="dp-tl-item">
          <div class="dp-tl-dot" style="background:var(--gold)"></div>
          <div class="dp-tl-text">${esc(a.text)}<span class="dp-tl-time">${new Date(a.time).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span></div>
        </div>`).join('')}
      </div>
    </div>
  `;
}

/* ── Move modal ── */
function openMoveModal(){
  const l=getLead(activeLeadId); if(!l) return;
  movingLeadId=activeLeadId;
  document.getElementById('mm-sub').textContent=l.name;
  const fsel=document.getElementById('mm-funnel');
  fsel.innerHTML=funnels.map(f=>`<option value="${f.id}">${f.icon} ${f.name}</option>`).join('');
  fsel.value=l.funnelId;
  populateMoveStage();
  document.getElementById('mm-stage').value=l.stageId;
  openMo('mo-move');
}

function populateMoveStage(){
  const f=getFunnel(document.getElementById('mm-funnel').value);
  document.getElementById('mm-stage').innerHTML=f?f.stages.map(s=>`<option value="${s.id}">${s.name}</option>`).join(''):'';
}

async function moveLead(){
  const l = getLead(movingLeadId); if(!l) return;
  const nf = document.getElementById('mm-funnel').value;
  const ns = document.getElementById('mm-stage').value;
  const f = getFunnel(nf), s = f?.stages.find(st=>st.id===ns);
  l.funnelId = nf; l.stageId = ns;
  l.activities = l.activities||[];
  l.activities.push({text:`Movido para "${f?.name} → ${s?.name}"`, time:new Date().toISOString()});
  const {error} = await dbUpdateLead(movingLeadId, {funnel_id:nf, stage_id:ns, activities:l.activities});
  if(error) return showError(error.message);
  closeMo('mo-move');
  renderSidebar();
  if(currentPage==='kanban') renderKanban();
  else if(currentPage==='leads-list') renderLeadsTable();
  if(activeLeadId===movingLeadId) renderDetailPanel(movingLeadId);
  toast(`Movido para "${s?.name||ns}"`);
}

/* ── Lead CRUD ── */
function openLeadModal(){
  editingLeadId = null;
  document.getElementById('ml-title').textContent = 'Novo Lead';
  ['ml-name','ml-company','ml-email','ml-phone','ml-instagram','ml-followup','ml-value','ml-notes','ml-tags'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('ml-origin').value='ig_comentario';
  document.getElementById('ml-isvet').value='true';
  document.getElementById('ml-converted').value='false';
  document.getElementById('ml-converted-date').value='';
  document.getElementById('ml-service-months').value='';
  document.getElementById('ml-converted-extra').style.display='none';
  populateLeadFunnelSelect();
  openMo('mo-lead');
  setTimeout(()=>document.getElementById('ml-name').focus(),150);
}

function openLeadModalForStage(funnelId, stageId){
  openLeadModal();
  document.getElementById('ml-funnel').value = funnelId;
  populateLeadStage();
  document.getElementById('ml-stage').value = stageId;
}

function openEditLead(){
  const l = getLead(activeLeadId); if(!l) return;
  editingLeadId = l.id;
  document.getElementById('ml-title').textContent = 'Editar Lead';
  document.getElementById('ml-name').value = l.name;
  document.getElementById('ml-company').value = l.company||'';
  document.getElementById('ml-email').value = l.email;
  document.getElementById('ml-phone').value = l.phone||'';
  document.getElementById('ml-instagram').value = l.instagram||'';
  document.getElementById('ml-followup').value = l.followUp||'';
  document.getElementById('ml-value').value = l.value||'';
  document.getElementById('ml-notes').value = l.notes||'';
  document.getElementById('ml-tags').value = (l.tags||[]).join(', ');
  document.getElementById('ml-origin').value = l.origin;
  document.getElementById('ml-isvet').value = l.isVet ? 'true' : 'false';
  document.getElementById('ml-converted').value = l.converted ? 'true' : 'false';
  document.getElementById('ml-converted-date').value = l.convertedDate||'';
  document.getElementById('ml-service-months').value = l.serviceMonths||'';
  document.getElementById('ml-converted-extra').style.display = l.converted ? '' : 'none';
  populateLeadFunnelSelect();
  document.getElementById('ml-funnel').value = l.funnelId;
  populateLeadStage();
  document.getElementById('ml-stage').value = l.stageId;
  openMo('mo-lead');
}

function populateLeadFunnelSelect(){
  const sel = document.getElementById('ml-funnel');
  sel.innerHTML = funnels.map(f=>`<option value="${f.id}">${f.icon} ${f.name}</option>`).join('');
  if(activeFunnelId) sel.value = activeFunnelId;
  populateLeadStage();
}

function populateLeadStage(){
  const fid = document.getElementById('ml-funnel').value;
  const f = getFunnel(fid);
  document.getElementById('ml-stage').innerHTML = f ? f.stages.map(s=>`<option value="${s.id}">${s.name}</option>`).join('') : '';
}

function toggleConvertedFields(){
  const show = document.getElementById('ml-converted').value === 'true';
  document.getElementById('ml-converted-extra').style.display = show ? '' : 'none';
  if(show && !document.getElementById('ml-converted-date').value) document.getElementById('ml-converted-date').value = today();
}

async function saveLead(){
  const name = stripTags(document.getElementById('ml-name').value.trim());
  if(!validateForm([[name, 'Informe o nome do lead']])) return;
  const email = document.getElementById('ml-email').value.trim();
  if(!validEmail(email)) return toast('E-mail inválido');
  const btn = document.querySelector('#mo-lead .btn-gold');
  const isConverted = document.getElementById('ml-converted').value === 'true';
  const leadData = {
    name, email,
    company:stripTags(document.getElementById('ml-company').value.trim()),
    phone:document.getElementById('ml-phone').value.trim(),
    instagram:document.getElementById('ml-instagram').value.trim(),
    followUp:document.getElementById('ml-followup').value,
    funnelId:document.getElementById('ml-funnel').value,
    stageId:document.getElementById('ml-stage').value,
    origin:document.getElementById('ml-origin').value,
    value:parseFloat(document.getElementById('ml-value').value)||0,
    notes:stripTags(document.getElementById('ml-notes').value.trim()),
    tags:document.getElementById('ml-tags').value.split(',').map(t=>stripTags(t.trim())).filter(Boolean),
    isVet:document.getElementById('ml-isvet').value === 'true',
    converted:isConverted,
    convertedDate:isConverted ? document.getElementById('ml-converted-date').value : '',
    serviceMonths:isConverted ? (parseInt(document.getElementById('ml-service-months').value)||0) : 0,
  };
  const wasEditing = editingLeadId;
  await withLoading(btn, async () => {
    if(wasEditing){
      const existing = getLead(wasEditing);
      leadData.activities = [...(existing.activities||[]), {text:'Lead atualizado', time:new Date().toISOString()}];
      leadData.date = existing.date;
      const {error} = await dbUpdateLead(wasEditing, leadToDb(leadData));
      if(error){ showError(error.message); return; }
      Object.assign(existing, leadData);
    } else {
      leadData.activities = [{text:'Lead criado', time:new Date().toISOString()}];
      leadData.date = today();
      const {data, error} = await dbInsertLead(leadToDb(leadData));
      if(error){ showError(error.message); return; }
      leads.push(mapLead(data));
    }
    closeMo('mo-lead');
    renderSidebar();
    if(currentPage==='kanban') renderKanban();
    else if(currentPage==='leads-list') renderLeadsTable();
    else if(currentPage==='dashboard') renderDashboard();
    if(wasEditing && activeLeadId===wasEditing) renderDetailPanel(wasEditing);
    invalidateLeadPages();
    toast(wasEditing ? 'Lead atualizado!' : 'Lead criado!');
  });
}

async function deleteCurrentLead(){
  if(!activeLeadId) return;
  const l = getLead(activeLeadId);
  showDeleteConfirm(l?.name||'este lead', async ()=>{
    const {error} = await dbDeleteLead(activeLeadId);
    if(error) return showError(error.message);
    leads = leads.filter(x=>x.id!==activeLeadId);
    closeDetail();
    renderSidebar();
    if(currentPage==='kanban') renderKanban();
    else if(currentPage==='leads-list') renderLeadsTable();
    else if(currentPage==='dashboard') renderDashboard();
    invalidateLeadPages();
    toast('Lead excluído!');
  });
}

function quickEditLead(id){
  activeLeadId = id;
  openEditLead();
}

function quickDeleteLead(id, name){
  showDeleteConfirm(name, async ()=>{
    const {error} = await dbDeleteLead(id);
    if(error) return showError(error.message);
    leads = leads.filter(l=>l.id!==id);
    if(activeLeadId===id) closeDetail();
    renderSidebar();
    if(currentPage==='kanban') renderKanban();
    else if(currentPage==='leads-list') renderLeadsTable();
    else if(currentPage==='dashboard') renderDashboard();
    invalidateLeadPages();
    toast('Lead excluído!');
  });
}

function showDeleteConfirm(name, onConfirm){
  showConfirm({
    title: '🗑️ Excluir Lead',
    msg: `Excluir "${name}"? O lead e todo o histórico serão removidos permanentemente.`,
    confirmText: 'Sim, excluir',
    danger: true,
    onConfirm,
  });
}

/* ── Auto Follow-Up System ── */
const FOLLOWUP_RULES = [
  { match: ['primeiro contato','first contact'],            days: 2, label: '1º Contato',    color: '#a855f7' },
  { match: ['qualificação','qualificacao','qualification'], days: 3, label: 'Qualificação',   color: '#f97316' },
  { match: ['proposta','proposal','proposta enviada'],      days: 2, label: 'Proposta',       color: '#d97706' },
  { match: ['negociação','negociacao','negotiation'],       days: 1, label: 'Negociação',     color: '#ef4444' },
  { match: ['lead novo','new lead','novo'],                 days: 5, label: 'Lead Novo',      color: '#3b82f6' },
];

function getFollowUpRule(stageName){
  if(!stageName) return null;
  const lower = stageName.toLowerCase();
  return FOLLOWUP_RULES.find(r => r.match.some(m => lower.includes(m))) || null;
}

function getAutoFollowUpAlerts(){
  const todayDate = new Date(today()+'T00:00:00');
  const alerts = [];
  leads.forEach(l=>{
    if(l.converted) return;
    if((l.tags||[]).includes('planilha')) return;
    const f = getFunnel(l.funnelId);
    if(!f) return;
    const s = f.stages.find(st=>st.id===l.stageId);
    if(!s) return;
    const rule = getFollowUpRule(s.name);
    if(!rule) return;
    let lastActivity = l.date;
    if(l.activities && l.activities.length>0){
      const lastAct = l.activities[l.activities.length-1];
      if(lastAct?.time) lastActivity = lastAct.time.slice(0,10);
    }
    if(l.followUp && l.followUp >= today()) return;
    const lastDate = new Date(lastActivity+'T00:00:00');
    const diffDays = Math.floor((todayDate - lastDate) / 86400000);
    if(diffDays >= rule.days){
      alerts.push({ lead: l, stage: s, rule, diffDays, overdue: diffDays > rule.days * 2 });
    }
  });
  return alerts.sort((a,b)=> b.overdue - a.overdue || b.diffDays - a.diffDays);
}

async function snoozeFollowUp(leadId, days){
  const l = getLead(leadId); if(!l) return;
  const d = new Date(); d.setDate(d.getDate()+days);
  l.followUp = d.toISOString().slice(0,10);
  l.activities = l.activities||[];
  l.activities.push({text:`Follow-up adiado por ${days} dia${days>1?'s':''}`, time:new Date().toISOString()});
  const {error} = await dbUpdateLead(leadId, { follow_up: l.followUp, activities: l.activities });
  if(error) return showError(error.message);
  renderDashboard();
  toast(`Follow-up agendado para ${fmtDate(l.followUp)}`);
}

async function markFollowUpDone(leadId){
  const l = getLead(leadId); if(!l) return;
  l.activities = l.activities||[];
  l.activities.push({text:'✅ Follow-up realizado', time:new Date().toISOString()});
  l.followUp = '';
  const {error} = await dbUpdateLead(leadId, { activities: l.activities, follow_up: null });
  if(error) return showError(error.message);
  renderDashboard();
  if(activeLeadId===leadId) renderDetailPanel(leadId);
  toast('Follow-up marcado como feito!');
}

function renderFollowUpAlerts(){
  const alerts = getAutoFollowUpAlerts();
  if(!alerts.length) return '';

  const todayStr = today();
  const manualOverdue = leads.filter(l=>l.followUp && l.followUp<todayStr && !l.converted && !(l.tags||[]).includes('planilha'));
  const manualToday   = leads.filter(l=>l.followUp && l.followUp===todayStr && !l.converted && !(l.tags||[]).includes('planilha'));

  return `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:10px;display:flex;align-items:center;gap:8px">
        🔔 Central de Follow-ups
        <span style="background:var(--red);color:#fff;font-size:9px;padding:1px 7px;border-radius:99px">${alerts.length + manualOverdue.length + manualToday.length}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${manualOverdue.map(l=>`
          <div style="background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:var(--r-sm);padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--red);flex-shrink:0"></div>
            <div style="flex:1;min-width:0;cursor:pointer" onclick="openDetail('${l.id}')">
              <div style="font-size:12.5px;font-weight:700;color:var(--red)">${l.name}</div>
              <div style="font-size:10px;color:var(--text3)">Follow-up atrasado desde ${fmtDate(l.followUp)}</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button class="btn btn-sm" onclick="snoozeFollowUp('${l.id}',2)" style="font-size:10px;padding:3px 8px">+2d</button>
              <button class="btn btn-sm" onclick="markFollowUpDone('${l.id}')" style="font-size:10px;padding:3px 8px;background:rgba(34,197,94,.1);color:#22c55e;border-color:rgba(34,197,94,.2)">✓ Feito</button>
            </div>
          </div>`).join('')}
        ${manualToday.map(l=>`
          <div style="background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.25);border-radius:var(--r-sm);padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0"></div>
            <div style="flex:1;min-width:0;cursor:pointer" onclick="openDetail('${l.id}')">
              <div style="font-size:12.5px;font-weight:700;color:var(--gold)">${l.name}</div>
              <div style="font-size:10px;color:var(--text3)">⏰ Follow-up manual hoje</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button class="btn btn-sm" onclick="snoozeFollowUp('${l.id}',1)" style="font-size:10px;padding:3px 8px">+1d</button>
              <button class="btn btn-sm" onclick="markFollowUpDone('${l.id}')" style="font-size:10px;padding:3px 8px;background:rgba(34,197,94,.1);color:#22c55e;border-color:rgba(34,197,94,.2)">✓ Feito</button>
            </div>
          </div>`).join('')}
        ${alerts.map(a=>`
          <div style="background:${a.overdue?'rgba(239,68,68,.05)':'rgba(255,255,255,.02)'};border:1px solid ${a.overdue?'rgba(239,68,68,.2)':'var(--border)'};border-left:3px solid ${a.rule.color};border-radius:var(--r-sm);padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div style="flex:1;min-width:0;cursor:pointer" onclick="openDetail('${a.lead.id}')">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span style="font-size:12.5px;font-weight:700">${a.lead.name}</span>
                <span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px;background:${a.rule.color}18;color:${a.rule.color}">${a.rule.label}</span>
                ${a.lead.instagram?`<span style="font-size:10px;color:#e1306c">${a.lead.instagram}</span>`:''}
              </div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px">
                ${a.overdue?'🚨':'⏰'} ${a.diffDays} dia${a.diffDays>1?'s':''} sem contato · regra: contatar a cada ${a.rule.days}d na etapa "${a.stage.name}"
              </div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button class="btn btn-sm" onclick="snoozeFollowUp('${a.lead.id}',${a.rule.days})" style="font-size:10px;padding:3px 8px">+${a.rule.days}d</button>
              <button class="btn btn-sm" onclick="markFollowUpDone('${a.lead.id}')" style="font-size:10px;padding:3px 8px;background:rgba(34,197,94,.1);color:#22c55e;border-color:rgba(34,197,94,.2)">✓ Feito</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

async function addNote(){
  const inp = document.getElementById('dp-note-input');
  const txt = inp.value.trim();
  if(!txt||!activeLeadId) return;
  const l = getLead(activeLeadId); if(!l) return;
  l.activities = l.activities||[];
  l.activities.push({text:txt, time:new Date().toISOString()});
  const {error} = await dbUpdateLead(activeLeadId, {activities:l.activities});
  if(error) return showError(error.message);
  inp.value='';
  renderDetailPanel(activeLeadId);
  toast('Nota salva!');
}

/* ── Export & Search ── */
function exportCSV(){
  const rows=[['Nome','E-mail','Telefone','Instagram','Empresa','Funil','Etapa','Origem','É Veterinário','Convertido','Data Conversão','Meses Serviço','Valor','Tags','Follow-up','Data Entrada']];
  leads.forEach(l=>{
    const f=getFunnel(l.funnelId),s=f?.stages.find(st=>st.id===l.stageId);
    rows.push([l.name,l.email,l.phone||'',l.instagram||'',l.company||'',f?.name||'',s?.name||'',l.origin,l.isVet?'Sim':'Não',l.converted?'Sim':'Não',l.convertedDate||'',l.serviceMonths||0,l.value||0,(l.tags||[]).join(';'),l.followUp||'',l.date]);
  });
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,﻿'+encodeURIComponent(csv);
  a.download='nexus-crm-leads.csv';
  a.click();
  toast('CSV exportado!');
}

function onGlobalSearch(q){
  if(!q.trim()) return;
  tableSearch = q;
  showPage('leads-list');
}
