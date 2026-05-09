const TAG_CATEGORIES = {
  comercial: 'Comercial',
  interesse: 'Produto de Interesse',
  cliente: 'Cliente / Mentorado',
  projeto: 'Projeto',
  financeiro: 'Financeiro',
  marketing: 'Marketing',
  geral: 'Geral',
  legado: 'Legado'
};

const TAG_SCOPES = {
  leads: 'Leads',
  mentorships: 'Mentorias',
  projects: 'Projetos',
  tasks: 'Tarefas',
  products: 'Produtos',
  purchases: 'Compras'
};

function slugifyTag(name){
  return stripTags(name||'')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getVisibleTags(){
  if(tagsDbReady) return tags;
  return getAllLeadTags().map(name => ({
    id:`legacy-${name}`, name, slug:slugifyTag(name), color:'#d4af37',
    category:'legado', description:'Etiqueta existente nos leads antes da tabela tags.',
    scope:['leads'], isActive:true, isSystem:false, isSensitive:false, legacy:true
  }));
}

function tagUsageCount(tag){
  const name = (tag.name||'').toLowerCase();
  const slug = (tag.slug||slugifyTag(tag.name)).toLowerCase();
  return leads.filter(l => (l.tags||[]).some(t => {
    const normalized = String(t).toLowerCase();
    return normalized === name || normalized === slug;
  })).length;
}

function canManageTags(){
  return ['admin','dev'].includes(currentUser?.role);
}

function renderTags(){
  const el = document.getElementById('tags-content');
  if(!el) return;
  const all = getVisibleTags();
  const active = all.filter(t=>t.isActive!==false);
  const grouped = all.reduce((acc, tag) => {
    const key = tag.category || 'geral';
    acc[key] = acc[key] || [];
    acc[key].push(tag);
    return acc;
  }, {});
  const manage = canManageTags() && tagsDbReady;

  el.innerHTML = `
    ${!tagsDbReady ? `
      <div style="margin-bottom:16px;background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.25);border-radius:var(--r);padding:14px 16px">
        <div style="font-size:13px;font-weight:800;color:var(--gold)">Migração de etiquetas ainda não aplicada</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px;line-height:1.5">
          Esta tela está mostrando as tags livres já usadas nos leads. Para criar, editar, arquivar e controlar permissões, aplique o arquivo <strong>supabase/phase1_platform_foundation.sql</strong>.
        </div>
      </div>` : ''}

    <div class="stats-grid" style="margin-bottom:16px">
      ${tagKpi('Etiquetas', all.length, '#3b82f6')}
      ${tagKpi('Ativas', active.length, '#22c55e')}
      ${tagKpi('Categorias', Object.keys(grouped).length, '#d4af37')}
      ${tagKpi('Em uso nos leads', all.reduce((s,t)=>s+tagUsageCount(t),0), '#a855f7')}
    </div>

    <div class="card">
      <div class="card-hd">
        <div>
          <span class="card-title">Etiquetas</span>
          <div class="card-sub">Classificação reutilizável para leads, mentorias, projetos, tarefas e produtos</div>
        </div>
        ${manage ? `<button class="btn btn-sm btn-gold" onclick="openTagModal()">+ Etiqueta</button>` : ''}
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:14px">
        ${all.length ? Object.entries(grouped).map(([category, items]) => renderTagGroup(category, items, manage)).join('') : `
          <div class="empty"><div class="empty-icon">🏷️</div><p>Nenhuma etiqueta cadastrada</p></div>
        `}
      </div>
    </div>
  `;
}

function tagKpi(lbl, val, color){
  return `<div class="stat-card">
    <div class="stat-stripe" style="background:${color}"></div>
    <div style="font-size:26px;font-weight:900;color:${color}">${val}</div>
    <div style="font-size:11px;color:var(--text2);margin-top:4px;font-weight:500">${lbl}</div>
  </div>`;
}

function renderTagGroup(category, items, manage){
  return `
    <div>
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.8px;color:var(--text3);margin-bottom:8px">
        ${esc(TAG_CATEGORIES[category]||category)} · ${items.length}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">
        ${items.map(tag => renderTagCard(tag, manage)).join('')}
      </div>
    </div>`;
}

function renderTagCard(tag, manage){
  const usage = tagUsageCount(tag);
  const scopes = (tag.scope||[]).map(s=>TAG_SCOPES[s]||s).join(', ') || 'Leads';
  return `
    <div style="border:1px solid var(--border);border-radius:var(--r-sm);padding:12px;background:${tag.isActive===false?'rgba(255,255,255,.015)':'var(--surface2)'};opacity:${tag.isActive===false?'.65':'1'}">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="width:12px;height:12px;border-radius:50%;background:${tag.color};margin-top:3px;box-shadow:0 0 0 4px ${tag.color}20;flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="kb-tag" style="background:${tag.color}18;color:${tag.color};font-size:11px">${esc(tag.name)}</span>
            ${tag.isActive===false?`<span style="font-size:9px;color:var(--text3);font-weight:800;text-transform:uppercase">Arquivada</span>`:''}
            ${tag.isSensitive?`<span style="font-size:9px;color:var(--red);font-weight:800;text-transform:uppercase">Sensível</span>`:''}
          </div>
          ${tag.description?`<div style="font-size:11px;color:var(--text3);margin-top:7px;line-height:1.45">${esc(tag.description)}</div>`:''}
          <div style="font-size:10px;color:var(--text3);margin-top:8px">Uso: ${esc(scopes)} · ${usage} lead${usage!==1?'s':''}</div>
        </div>
        ${manage && !tag.legacy ? `
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button class="btn btn-sm btn-ghost" onclick="openTagModal('${tag.id}')" title="Editar">✏️</button>
            <button class="btn btn-sm btn-ghost" onclick="archiveTag('${tag.id}')" title="Arquivar" style="color:var(--gold)">⏸</button>
            <button class="btn btn-sm btn-ghost" onclick="deleteTag('${tag.id}')" title="Excluir" style="color:var(--red)">🗑️</button>
          </div>` : ''}
      </div>
    </div>`;
}

function ensureTagModal(){
  let modal = document.getElementById('mo-tag');
  if(modal) return modal;
  modal = document.createElement('div');
  modal.id = 'mo-tag';
  modal.className = 'mo';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-hd">
        <div><h3 id="mtag-title">Nova Etiqueta</h3><p>Configure nome, cor, categoria e onde pode ser usada</p></div>
        <button class="modal-close" onclick="closeMo('mo-tag')"><svg viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>
      <div class="modal-body">
        <div class="field"><label>Nome *</label><input type="text" id="mtag-name" placeholder="Ex: alta intenção"></div>
        <div class="field-row">
          <div class="field"><label>Categoria</label><select id="mtag-category">
            ${Object.entries(TAG_CATEGORIES).filter(([k])=>k!=='legado').map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
          </select></div>
          <div class="field"><label>Cor</label><input type="color" id="mtag-color" value="#d4af37"></div>
        </div>
        <div class="field"><label>Descrição</label><textarea id="mtag-description" rows="2" placeholder="Quando e por que usar esta etiqueta"></textarea></div>
        <div class="field"><label>Onde pode ser usada</label>
          <div id="mtag-scopes" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px">
            ${Object.entries(TAG_SCOPES).map(([k,v])=>`
              <label style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text2);background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:7px 9px">
                <input type="checkbox" value="${k}"> ${v}
              </label>`).join('')}
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text2)">
          <input type="checkbox" id="mtag-sensitive"> Etiqueta sensível
        </label>
      </div>
      <div class="modal-ft">
        <button class="btn" onclick="closeMo('mo-tag')">Cancelar</button>
        <button class="btn btn-gold" onclick="saveTag()">Salvar Etiqueta</button>
      </div>
    </div>`;
  modal.addEventListener('click', e => { if(e.target === modal) closeMo('mo-tag'); });
  document.body.appendChild(modal);
  return modal;
}

function openTagModal(id){
  if(!tagsDbReady) return toast('Aplique a migração de etiquetas antes de criar ou editar');
  editingTagId = id || null;
  const tag = id ? tags.find(t=>t.id===id) : null;
  ensureTagModal();
  document.getElementById('mtag-title').textContent = tag ? 'Editar Etiqueta' : 'Nova Etiqueta';
  document.getElementById('mtag-name').value = tag?.name || '';
  document.getElementById('mtag-category').value = tag?.category || 'comercial';
  document.getElementById('mtag-color').value = tag?.color || '#d4af37';
  document.getElementById('mtag-description').value = tag?.description || '';
  document.getElementById('mtag-sensitive').checked = tag?.isSensitive === true;
  document.querySelectorAll('#mtag-scopes input').forEach(input => {
    input.checked = (tag?.scope || ['leads']).includes(input.value);
  });
  openMo('mo-tag');
  setTimeout(()=>document.getElementById('mtag-name').focus(), 120);
}

async function saveTag(){
  const name = stripTags(document.getElementById('mtag-name').value.trim()).toLowerCase();
  if(!validateForm([[name, 'Informe o nome da etiqueta']])) return;
  const scope = [...document.querySelectorAll('#mtag-scopes input:checked')].map(i=>i.value);
  if(!scope.length){ toast('Selecione pelo menos uma área de uso'); return; }
  const payload = {
    name,
    slug: slugifyTag(name),
    color: document.getElementById('mtag-color').value,
    category: document.getElementById('mtag-category').value,
    description: stripTags(document.getElementById('mtag-description').value.trim()),
    scope,
    isActive: true,
    isSensitive: document.getElementById('mtag-sensitive').checked
  };
  const btn = document.querySelector('#mo-tag .btn-gold');
  await withLoading(btn, async () => {
    if(editingTagId){
      const {error} = await dbUpdateTag(editingTagId, tagToDb(payload));
      if(error) return showError(error.message);
      Object.assign(tags.find(t=>t.id===editingTagId), payload);
    } else {
      const {data, error} = await dbInsertTag(tagToDb(payload));
      if(error) return showError(error.message);
      tags.push(mapTag(data));
    }
    closeMo('mo-tag');
    renderTags();
    invalidateTagPages();
    toast(editingTagId ? 'Etiqueta atualizada' : 'Etiqueta criada');
  });
}

async function archiveTag(id){
  const tag = tags.find(t=>t.id===id); if(!tag) return;
  showConfirm({
    title: 'Arquivar Etiqueta',
    msg: `Arquivar "${tag.name}"? Ela deixa de aparecer para novos usos, mas continua no histórico.`,
    confirmText: 'Arquivar',
    onConfirm: async () => {
      const {error} = await dbUpdateTag(id, {is_active:false});
      if(error) return showError(error.message);
      tag.isActive = false;
      renderTags();
      invalidateTagPages();
      toast('Etiqueta arquivada');
    }
  });
}

async function deleteTag(id){
  const tag = tags.find(t=>t.id===id); if(!tag) return;
  const usage = tagUsageCount(tag);
  if(usage > 0){
    showConfirm({
      title: 'Etiqueta em uso',
      msg: `"${tag.name}" está em ${usage} lead${usage!==1?'s':''}. O mais seguro é arquivar.`,
      confirmText: 'Arquivar',
      onConfirm: async () => {
        const {error} = await dbUpdateTag(id, {is_active:false});
        if(error) return showError(error.message);
        tag.isActive = false;
        renderTags();
        invalidateTagPages();
        toast('Etiqueta arquivada');
      }
    });
    return;
  }
  showConfirm({
    title: 'Excluir Etiqueta',
    msg: `Excluir "${tag.name}" definitivamente?`,
    confirmText: 'Excluir',
    danger: true,
    onConfirm: async () => {
      const {error} = await dbDeleteTag(id);
      if(error) return showError(error.message);
      tags = tags.filter(t=>t.id!==id);
      renderTags();
      invalidateTagPages();
      toast('Etiqueta excluída');
    }
  });
}
