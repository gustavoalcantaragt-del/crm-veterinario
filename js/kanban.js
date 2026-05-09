let kanbanSearch = '';

const _debouncedKanbanBoard = debounce(() => renderKanbanBoard(), 280);

function renderKanban() {
  renderKanbanTabs();
  renderKanbanBoard();
}

function renderKanbanTabs(){
  const el = document.getElementById('kb-toolbar');
  // Atualiza header da página com funil ativo
  const activeFunnel = funnels.find(f=>f.id===activeFunnelId);
  const phTitle = document.getElementById('kanban-ph-title');
  const phSub   = document.getElementById('kanban-ph-sub');
  if(phTitle) phTitle.textContent = activeFunnel ? `${activeFunnel.icon} ${activeFunnel.name}` : 'Kanban';
  if(phSub)   phSub.textContent   = activeFunnel
    ? `${leads.filter(l=>l.funnelId===activeFunnel.id).length} leads · Arraste entre etapas`
    : 'Selecione um funil abaixo';

  el.innerHTML = `
    <span style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;flex-shrink:0">Funil:</span>
    <div class="kb-funnel-tabs">
      ${funnels.map(f=>{
        const n=leads.filter(l=>l.funnelId===f.id).length;
        return `<button class="kb-tab ${f.id===activeFunnelId?'active':''}" onclick="switchFunnel('${f.id}')">
          <span class="kb-tab-dot" style="background:${f.color}"></span>
          ${f.icon} ${f.name} <span class="kb-tab-n">(${n})</span>
        </button>`;
      }).join('')}
    </div>
    <div style="position:relative;flex-shrink:0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:12px;height:12px;stroke:var(--text3);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="kb-search-input" placeholder="Buscar lead…" value="${kanbanSearch}"
        oninput="setKanbanSearch(this.value)"
        style="padding:5px 10px 5px 26px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);font-size:12px;font-family:var(--font);color:var(--text);outline:none;width:160px;transition:.15s"
        onfocus="this.style.borderColor='var(--gold)';this.style.boxShadow='0 0 0 3px rgba(212,175,55,.08)'"
        onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"
      >
      ${kanbanSearch?`<button onclick="setKanbanSearch('')" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;line-height:1;padding:0" title="Limpar">×</button>`:''}
    </div>
    <button class="btn btn-sm btn-ghost" onclick="openFunnelStagesModal()" title="Editar etapas">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0"/></svg>
    </button>
  `;
}

function setKanbanSearch(val){
  kanbanSearch = val;
  renderKanbanTabs();
  _debouncedKanbanBoard();
  const inp = document.getElementById('kb-search-input');
  if(inp){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}

function switchFunnel(id){
  activeFunnelId = id;
  kanbanSearch = '';
  renderSidebar();
  renderKanbanTabs();
  renderKanbanBoard();
}

function renderKanbanBoard(){
  const board = document.getElementById('kb-board');
  const f = getFunnel(activeFunnelId);
  if(!f){ board.innerHTML='<div class="empty"><div class="empty-icon">📋</div><p>Selecione ou crie um funil</p></div>'; return; }

  const q = kanbanSearch.trim().toLowerCase();

  board.innerHTML = f.stages.map(s=>{
    let sLeads = leads.filter(l=>l.funnelId===f.id && l.stageId===s.id);
    if(q){
      sLeads = sLeads.filter(l=>
        l.name.toLowerCase().includes(q) ||
        (l.email||'').toLowerCase().includes(q) ||
        (l.instagram||'').toLowerCase().includes(q) ||
        (l.phone||'').includes(q) ||
        (l.company||'').toLowerCase().includes(q)
      );
    }
    const isEmpty = sLeads.length === 0;
    const emptyMsg = q
      ? `<div style="font-size:11px;color:var(--text3);text-align:center;padding:20px 0;opacity:.6">Nenhum resultado para<br><strong style="color:var(--gold)">"${kanbanSearch}"</strong></div>`
      : `<div style="font-size:11px;color:var(--text3);text-align:center;padding:20px 0;opacity:.5">Sem leads</div>`;

    return `<div class="kb-col" id="col-${s.id}" data-stage="${s.id}" ondragover="onDragOver(event,this)" ondrop="onDrop(event,this)" ondragleave="onDragLeave(this)">
      <div class="kb-col-hd">
        <div class="kb-col-info">
          <div class="kb-col-dot" style="background:${s.color}"></div>
          <span class="kb-col-name">${s.name}</span>
        </div>
        <span class="kb-col-badge" style="${q&&sLeads.length>0?'background:rgba(212,175,55,.15);color:var(--gold)':''}">${sLeads.length}${q?'/'+leads.filter(l=>l.funnelId===f.id&&l.stageId===s.id).length:''}</span>
      </div>
      <div class="kb-col-stripe" style="background:${s.color}"></div>
      <div class="kb-cards" id="cards-${s.id}" data-stage="${s.id}">
        ${isEmpty ? emptyMsg : sLeads.map(l=>renderKbCard(l, s, q)).join('')}
      </div>
      <button class="kb-add-card" onclick="openLeadModalForStage('${f.id}','${s.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Adicionar lead
      </button>
    </div>`;
  }).join('');
  initDragDrop();
  setTimeout(initTouchDrag, 50);
}

function renderKbCard(l, s, q=''){
  const o = ORIGIN_MAP[l.origin]||{l:l.origin,c:'#888',bg:'rgba(128,128,128,.1)',icon:''};
  const tags = (l.tags||[]).slice(0,2).map(t=>`<span class="kb-tag" style="background:rgba(212,175,55,.1);color:var(--gold)">${t}</span>`).join('');
  const todayStr = today();
  const fuAlert = l.followUp && !l.converted ? (l.followUp<todayStr?'🚨':l.followUp===todayStr?'⏰':'') : '';
  const displayName = highlightText(l.name, q);
  const displayIg   = l.instagram ? highlightText(l.instagram, q) : '';
  const displayComp = l.company   ? highlightText(l.company, q)   : '';

  return `<div class="kb-card" id="kcard-${l.id}" data-lead="${l.id}" draggable="true"
    ondragstart="onDragStart(event,this)" ondragend="onDragEnd(event,this)"
    onclick="openDetail('${l.id}')">
    <div class="kb-card-top">
      <div class="kb-card-drag-handle" title="Arrastar" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>
      </div>
      <div class="kb-card-avatar" style="background:${strColor(l.name)}">${initials(l.name)}</div>
      <div style="flex:1;min-width:0">
        <div class="kb-card-name">${fuAlert?`<span style="font-size:12px">${fuAlert}</span> `:''}${displayName}</div>
        ${l.instagram?`<div style="font-size:9px;color:#e1306c;margin-top:1px;font-family:var(--mono)">${displayIg}</div>`:l.company?`<div style="font-size:10px;color:var(--text3);margin-top:1px">${displayComp}</div>`:''}
      </div>
      <div class="kb-card-menu" onclick="event.stopPropagation();openDetail('${l.id}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </div>
    </div>
    ${tags?`<div class="kb-card-meta">${tags}</div>`:''}
    <div class="kb-card-footer">
      <div style="display:flex;align-items:center;gap:4px">
        <span class="origin-badge" style="background:${o.bg};color:${o.c};padding:2px 7px;border-radius:4px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${o.icon||''} ${o.l}</span>
        ${l.isVet?`<span style="background:rgba(59,130,246,.1);color:#3b82f6;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700">🩺</span>`:
          `<span style="background:rgba(239,68,68,.08);color:var(--red);padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700">✗vet</span>`}
        ${l.converted?`<span style="background:rgba(34,197,94,.1);color:#22c55e;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700">✅</span>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        ${l.value?`<span class="kb-card-value">${fmtMoney(l.value)}</span>`:'<span></span>'}
        ${l.phone?`<button onclick="event.stopPropagation();openWAModal('${l.id}')" title="WhatsApp" style="background:none;border:none;cursor:pointer;color:#25d366;padding:2px;line-height:0;flex-shrink:0">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.555 4.135 1.527 5.882L0 24l6.356-1.508A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.002-1.367l-.36-.214-3.722.882.918-3.616-.236-.373A9.792 9.792 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/></svg>
        </button>`:''}
      </div>
    </div>
    <div style="margin-top:6px">
      <div class="kb-card-date">${fmtDate(l.date)}</div>
    </div>
  </div>`;
}

/* ── Drag & Drop ── */
let dragLeadId = null;
let dragSourceStageId = null;
let placeholder = null;

function initDragDrop(){} // binding done inline via ondragstart

function onDragStart(e, el){
  dragLeadId = el.dataset.lead;
  dragSourceStageId = el.closest('.kb-col').dataset.stage;
  el.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragLeadId);
  setTimeout(()=>{
    placeholder = document.createElement('div');
    placeholder.className = 'kb-card drag-placeholder';
    el.parentNode.insertBefore(placeholder, el.nextSibling);
  },0);
}

function onDragEnd(e, el){
  el.classList.remove('dragging');
  if(placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
  placeholder = null;
  document.querySelectorAll('.kb-col').forEach(c=>c.classList.remove('drag-over'));
}

function onDragOver(e, col){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  col.classList.add('drag-over');
  const cards = col.querySelector('.kb-cards');
  const afterEl = getDragAfterEl(cards, e.clientY);
  if(placeholder){
    if(afterEl) cards.insertBefore(placeholder, afterEl);
    else cards.appendChild(placeholder);
  }
}

function onDragLeave(col){
  col.classList.remove('drag-over');
}

function getDragAfterEl(container, y){
  const draggableEls = [...container.querySelectorAll('.kb-card:not(.dragging):not(.drag-placeholder)')];
  return draggableEls.reduce((closest,child)=>{
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height/2;
    if(offset < 0 && offset > closest.offset) return {offset, element:child};
    return closest;
  },{offset:Number.NEGATIVE_INFINITY}).element;
}

async function onDrop(e, col){
  e.preventDefault();
  col.classList.remove('drag-over');
  const stageId = col.dataset.stage;
  if(!dragLeadId || !stageId) return;
  const lead = getLead(dragLeadId); if(!lead) return;
  lead.stageId = stageId;
  const f = getFunnel(lead.funnelId);
  const s = f?.stages.find(st=>st.id===stageId);
  lead.activities = lead.activities||[];
  lead.activities.push({text:`Movido para "${s?.name||stageId}"`, time:new Date().toISOString()});
  const {error} = await dbUpdateLead(dragLeadId, {stage_id:stageId, activities:lead.activities});
  if(error) showError(error.message);
  renderKanbanBoard();
  renderSidebar();
  if(activeLeadId===dragLeadId) renderDetailPanel(dragLeadId);
  toast(`Lead movido para "${s?.name||stageId}"`);
  dragLeadId = null;
}

/* ── Touch Drag & Drop (mobile) ── */
let touchDragEl    = null;
let touchClone     = null;
let touchLeadId    = null;
let touchStartY    = 0;
let touchStartX    = 0;
let touchLastCol   = null;

function initTouchDrag(){
  document.querySelectorAll('.kb-card').forEach(card=>{
    card.addEventListener('touchstart', onTouchStart, {passive:false});
  });
}

function onTouchStart(e){
  const isMobile = window.innerWidth <= 768;
  const handle = e.target.closest('.kb-card-drag-handle');
  if(isMobile && !handle) return;

  e.preventDefault();
  const touch = e.touches[0];
  touchDragEl  = e.currentTarget;
  touchLeadId  = touchDragEl.dataset.lead;
  touchStartY  = touch.clientY;
  touchStartX  = touch.clientX;

  const rect = touchDragEl.getBoundingClientRect();
  touchClone = touchDragEl.cloneNode(true);
  touchClone.style.cssText = `
    position:fixed;top:${rect.top}px;left:${rect.left}px;
    width:${rect.width}px;opacity:.85;z-index:9999;
    pointer-events:none;transform:scale(1.03);
    box-shadow:0 12px 40px rgba(0,0,0,.5);
    border:1px solid var(--gold);border-radius:var(--r-sm);
    transition:none;
  `;
  document.body.appendChild(touchClone);
  touchDragEl.style.opacity = '0.3';

  document.addEventListener('touchmove',  onTouchMove,  {passive:false});
  document.addEventListener('touchend',   onTouchEnd,   {passive:false});
  document.addEventListener('touchcancel',onTouchCancel,{passive:false});
}

function onTouchMove(e){
  if(!touchClone) return;
  e.preventDefault();
  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  touchClone.style.transform = `translate(${dx}px,${dy}px) scale(1.03)`;

  touchClone.style.display = 'none';
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  touchClone.style.display = '';

  const col = el?.closest('.kb-col');
  if(col){
    document.querySelectorAll('.kb-col').forEach(c=>c.classList.remove('drag-over'));
    col.classList.add('drag-over');
    touchLastCol = col;
    const cards = col.querySelector('.kb-cards');
    const afterEl = getDragAfterEl(cards, touch.clientY);
    const existing = cards.querySelector('.drag-placeholder');
    if(existing) existing.remove();
    const ph = document.createElement('div');
    ph.className = 'kb-card drag-placeholder';
    if(afterEl) cards.insertBefore(ph, afterEl);
    else cards.appendChild(ph);
  }
}

async function onTouchEnd(e){
  if(!touchClone) return;
  const touch = e.changedTouches[0];

  touchClone.remove(); touchClone = null;
  if(touchDragEl) touchDragEl.style.opacity = '';
  document.querySelectorAll('.kb-col').forEach(c=>c.classList.remove('drag-over'));
  document.querySelectorAll('.drag-placeholder').forEach(p=>p.remove());

  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const col = el?.closest('.kb-col') || touchLastCol;

  if(col && touchLeadId){
    const stageId = col.dataset.stage;
    const lead = getLead(touchLeadId);
    if(lead && stageId && stageId !== lead.stageId){
      lead.stageId = stageId;
      const f = getFunnel(lead.funnelId);
      const s = f?.stages.find(st=>st.id===stageId);
      lead.activities = lead.activities||[];
      lead.activities.push({text:`Movido para "${s?.name||stageId}"`,time:new Date().toISOString()});
      const {error} = await dbUpdateLead(touchLeadId, {stage_id:stageId,activities:lead.activities});
      if(error) showError(error.message);
      else toast(`Movido para "${s?.name||stageId}"`);
      renderKanbanBoard();
      renderSidebar();
      if(activeLeadId===touchLeadId) renderDetailPanel(touchLeadId);
    }
  }

  touchDragEl = null; touchLeadId = null; touchLastCol = null;
  document.removeEventListener('touchmove',  onTouchMove);
  document.removeEventListener('touchend',   onTouchEnd);
  document.removeEventListener('touchcancel',onTouchCancel);
}

function onTouchCancel(){
  if(touchClone){ touchClone.remove(); touchClone=null; }
  if(touchDragEl){ touchDragEl.style.opacity=''; touchDragEl=null; }
  document.querySelectorAll('.kb-col').forEach(c=>c.classList.remove('drag-over'));
  document.querySelectorAll('.drag-placeholder').forEach(p=>p.remove());
  touchLeadId=null; touchLastCol=null;
  document.removeEventListener('touchmove',  onTouchMove);
  document.removeEventListener('touchend',   onTouchEnd);
  document.removeEventListener('touchcancel',onTouchCancel);
}
