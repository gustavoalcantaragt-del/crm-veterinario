function renderFunnels(){
  const el = document.getElementById('funnels-content');
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">
    ${funnels.map(f=>{
      const fLeads=leads.filter(l=>l.funnelId===f.id);
      const closed=fLeads.filter(l=>l.stageId===f.stages[f.stages.length-1]?.id);
      const val=fLeads.reduce((s,l)=>s+(l.value||0),0);
      const conv=fLeads.length?Math.round(closed.length/fLeads.length*100):0;
      return `<div class="card" style="overflow:visible">
        <div style="padding:16px 18px;border-bottom:1px solid var(--border);position:relative;overflow:hidden">
          <div style="position:absolute;top:0;left:0;bottom:0;width:3px;background:${f.color}"></div>
          <div style="display:flex;align-items:center;gap:10px;padding-left:10px">
            <div style="width:38px;height:38px;border-radius:10px;background:${f.color}18;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${f.icon}</div>
            <div style="flex:1">
              <div style="font-size:15px;font-weight:800">${f.name}</div>
              <div style="font-size:10px;color:var(--text3);font-family:var(--mono)">${f.stages.length} etapas · ${fLeads.length} leads</div>
            </div>
            <div style="display:flex;gap:5px">
              <button class="btn btn-sm btn-ghost" onclick="editFunnelModal('${f.id}')">✏️</button>
              <button class="btn btn-sm btn-ghost" onclick="deleteFunnel('${f.id}')" style="color:var(--red)">🗑️</button>
            </div>
          </div>
        </div>
        <div style="padding:14px 18px">
          <div style="display:flex;gap:16px;margin-bottom:12px">
            <div><div style="font-size:18px;font-weight:800;letter-spacing:-.04em">${fLeads.length}</div><div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Leads</div></div>
            <div><div style="font-size:18px;font-weight:800;letter-spacing:-.04em;color:var(--green)">${conv}%</div><div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Conversão</div></div>
            <div><div style="font-size:16px;font-weight:800;letter-spacing:-.04em;color:var(--gold)">${fmtMoney(val)}</div><div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Pipeline</div></div>
          </div>
          <div style="display:flex;gap:3px;margin-bottom:10px">
            ${f.stages.map(s=>`<div title="${s.name}" style="flex:1;height:6px;border-radius:3px;background:${s.color};opacity:.7"></div>`).join('')}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${f.stages.map(s=>{
              const n=leads.filter(l=>l.funnelId===f.id&&l.stageId===s.id).length;
              return `<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:${s.color}18;color:${s.color};font-weight:700">${s.name} (${n})</span>`;
            }).join('')}
          </div>
        </div>
        <div style="padding:10px 18px;background:var(--surface2);border-top:1px solid var(--border);display:flex;gap:7px">
          <button class="btn btn-sm" style="flex:1" onclick="switchFunnel('${f.id}');showPage('kanban')">Ver Kanban</button>
          <button class="btn btn-sm btn-ghost" onclick="editFunnelModal('${f.id}')">Editar</button>
        </div>
      </div>`;
    }).join('')}
    <button onclick="openFunnelModal()" style="background:none;border:1.5px dashed var(--border);border-radius:var(--r);padding:2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;transition:.2s;font-family:var(--font);min-height:200px" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="font-size:32px;margin-bottom:8px;opacity:.4">+</div>
      <p style="font-size:13px;font-weight:600;color:var(--text3)">Criar Novo Funil</p>
      <small style="font-size:11px;color:var(--text3);opacity:.6;margin-top:3px">Configure etapas personalizadas</small>
    </button>
  </div>`;
}

/* ── Funnel CRUD ── */
function openFunnelModal(){
  editingFunnelId = null;
  document.getElementById('mf-title').textContent = 'Novo Funil';
  document.getElementById('mf-name').value = '';
  document.getElementById('mf-icon').value = '📋';
  mfColor = PALETTE[0];
  buildSwatches('mf-swatches', mfColor, c=>{ mfColor=c; });
  renderStageEditor('mf-stages', [{id:uid(),name:'Novo Lead',color:'#3b82f6'},{id:uid(),name:'Em Contato',color:'#7c3aed'},{id:uid(),name:'Fechado',color:'#22c55e'}]);
  openMo('mo-funnel');
}

function editFunnelModal(id){
  const f = getFunnel(id); if(!f) return;
  editingFunnelId = id;
  document.getElementById('mf-title').textContent = 'Editar Funil';
  document.getElementById('mf-name').value = f.name;
  document.getElementById('mf-icon').value = f.icon;
  mfColor = f.color;
  buildSwatches('mf-swatches', mfColor, c=>{ mfColor=c; });
  renderStageEditor('mf-stages', f.stages);
  openMo('mo-funnel');
}

async function saveFunnel(){
  const name = document.getElementById('mf-name').value.trim();
  if(!validateForm([[name, 'Informe o nome do funil']])) return;
  const btn = document.querySelector('#mo-funnel .btn-gold');
  const stages = collectStages('mf-stages');
  const data = { name, icon:document.getElementById('mf-icon').value.trim()||'📋', color:mfColor, stages };
  const wasEditing = editingFunnelId;
  await withLoading(btn, async () => {
    if(wasEditing){
      const {error} = await dbUpdateFunnel(wasEditing, data);
      if(error){ showError(error.message); return; }
      Object.assign(getFunnel(wasEditing), mapFunnel({id:wasEditing,...data}));
    } else {
      const {data:row, error} = await dbInsertFunnel(data);
      if(error){ showError(error.message); return; }
      funnels.push(mapFunnel(row));
      activeFunnelId = row.id;
    }
    closeMo('mo-funnel');
    renderSidebar();
    if(currentPage==='funnels') renderFunnels();
    else if(currentPage==='kanban') renderKanban();
    invalidateFunnelPages();
    toast(wasEditing ? 'Funil atualizado!' : 'Funil criado!');
  });
}

async function deleteFunnel(id){
  const f = getFunnel(id);
  showConfirm({
    title: '🗑️ Excluir Funil',
    msg: `Excluir "${f?.name||'este funil'}" e todos os seus leads? Esta ação não pode ser desfeita.`,
    confirmText: 'Sim, excluir tudo',
    danger: true,
    onConfirm: async () => {
      const {error: leadsErr} = await dbDeleteLeadsByFunnel(id);
      if(leadsErr){ showError(leadsErr.message); return; }
      const {error} = await dbDeleteFunnel(id);
      if(error){ showError(error.message); return; }
      funnels = funnels.filter(f=>f.id!==id);
      leads   = leads.filter(l=>l.funnelId!==id);
      if(activeFunnelId===id) activeFunnelId = funnels[0]?.id||null;
      renderSidebar();
      renderFunnels();
      invalidateFunnelPages();
      invalidateLeadPages();
      toast('Funil excluído');
    }
  });
}

function openFunnelStagesModal(){
  const f = getFunnel(activeFunnelId); if(!f) return;
  document.getElementById('ms-title').textContent = `Etapas: ${f.name}`;
  renderStageEditor('ms-stages', f.stages);
  openMo('mo-stages');
}

async function saveStages(){
  const f = getFunnel(activeFunnelId); if(!f) return;
  const btn = document.querySelector('#mo-stages .btn-gold');
  const stages = collectStages('ms-stages');
  await withLoading(btn, async () => {
    f.stages = stages;
    const {error} = await dbUpdateFunnel(activeFunnelId, {stages});
    if(error){ showError(error.message); return; }
    closeMo('mo-stages');
    renderKanban();
    invalidateFunnelPages();
    toast('Etapas salvas!');
  });
}

/* ── Stage Editor ── */
function renderStageEditor(cid, stages){
  document.getElementById(cid).innerHTML = stages.map((s,i)=>`
    <div class="stage-item" data-id="${s.id}" draggable="true">
      <span class="stage-drag">⠿</span>
      <input type="color" value="${s.color}">
      <input type="text" value="${s.name}" placeholder="Nome da etapa">
      <button onclick="removeStageRow(this,'${cid}')" class="btn btn-sm btn-ghost" style="color:var(--red);flex-shrink:0;padding:4px 7px">✕</button>
    </div>
  `).join('');
  initStageDnd(cid);
}

function addStageRow(cid){
  const n = document.getElementById(cid).querySelectorAll('.stage-item').length;
  const r = document.createElement('div');
  r.className='stage-item'; r.dataset.id=uid(); r.draggable=true;
  r.innerHTML=`<span class="stage-drag">⠿</span><input type="color" value="${STAGE_COLORS[n%STAGE_COLORS.length]}"><input type="text" value="" placeholder="Nome da etapa"><button onclick="removeStageRow(this,'${cid}')" class="btn btn-sm btn-ghost" style="color:var(--red);flex-shrink:0;padding:4px 7px">✕</button>`;
  document.getElementById(cid).appendChild(r);
  r.querySelector('input[type=text]').focus();
  initStageDnd(cid);
}

function removeStageRow(btn,cid){
  if(document.getElementById(cid).querySelectorAll('.stage-item').length<=1) return toast('Mínimo 1 etapa');
  btn.closest('.stage-item').remove();
}

function collectStages(cid){
  return [...document.getElementById(cid).querySelectorAll('.stage-item')].map((el,i)=>({
    id: el.dataset.id||uid(),
    color: el.querySelector('input[type=color]').value,
    name: el.querySelector('input[type=text]').value.trim()||`Etapa ${i+1}`
  }));
}

function initStageDnd(cid){
  const list = document.getElementById(cid);
  let dragging = null;
  list.querySelectorAll('.stage-drag').forEach(h=>{
    const it = h.closest('.stage-item');
    it.addEventListener('dragstart',e=>{dragging=it;setTimeout(()=>it.style.opacity='.4',0)});
    it.addEventListener('dragend',()=>{dragging=null;it.style.opacity=''});
    it.addEventListener('dragover',e=>{
      e.preventDefault();
      const af = getStageDragAfter(list, e.clientY);
      if(af) list.insertBefore(dragging,af); else list.appendChild(dragging);
    });
  });
}

function getStageDragAfter(c,y){
  return [...c.querySelectorAll('.stage-item:not([style*="opacity"])')].reduce((cl,el)=>{
    const b=el.getBoundingClientRect(),o=y-b.top-b.height/2;
    return o<0&&o>cl.offset?{offset:o,el}:cl;
  },{offset:Number.NEGATIVE_INFINITY}).el;
}

/* ── Color Swatches ── */
function buildSwatches(cid, sel, cb){
  const w = document.getElementById(cid);
  w.innerHTML = PALETTE.map(c=>`<div class="swatch ${c===sel?'sel':''}" style="background:${c}" data-c="${c}" onclick="pickSwatch(this,'${cid}')"></div>`).join('');
  w._cb = cb;
}

function pickSwatch(el,cid){
  const w = document.getElementById(cid);
  w.querySelectorAll('.swatch').forEach(s=>s.classList.remove('sel'));
  el.classList.add('sel');
  if(w._cb) w._cb(el.dataset.c);
}
