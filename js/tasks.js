const PRIORITY_MAP = {
  urgente:{l:'Urgente', c:'#ef4444', bg:'rgba(239,68,68,.12)',  dot:'🔴'},
  alta:   {l:'Alta',    c:'#f97316', bg:'rgba(249,115,22,.12)', dot:'🟠'},
  media:  {l:'Média',   c:'#d4af37', bg:'rgba(212,175,55,.12)', dot:'🟡'},
  baixa:  {l:'Baixa',   c:'#22c55e', bg:'rgba(34,197,94,.12)',  dot:'🟢'},
};
const STATUS_MAP = {
  pendente:    {l:'Pendente',     c:'#8a8680', icon:'⏳'},
  em_andamento:{l:'Em andamento', c:'#3b82f6', icon:'🔄'},
  concluida:   {l:'Concluída',    c:'#22c55e', icon:'✅'},
};

function miniKpi(lbl, val, color, bg){
  return `<div class="stat-card">
    <div class="stat-stripe" style="background:${color}"></div>
    <div style="font-size:26px;font-weight:900;letter-spacing:-.05em;color:${color}">${val}</div>
    <div style="font-size:11px;color:var(--text2);margin-top:4px;font-weight:500">${lbl}</div>
  </div>`;
}

let tarefasTab = 'tarefas';

function taskEntityLabel(t){
  if(!t?.entityType || !t?.entityId) return '';
  if(t.entityType === 'lead'){
    const l = getLead(t.entityId);
    return l ? `Lead: ${l.name}` : 'Lead vinculado';
  }
  if(t.entityType === 'mentorship'){
    const m = mentorships.find(x=>x.id===t.entityId);
    return m ? `Mentoria: ${m.client}` : 'Mentoria vinculada';
  }
  return 'Vinculada';
}

function openTaskEntity(t){
  if(t.entityType === 'lead' && t.entityId) openDetail(t.entityId);
  if(t.entityType === 'mentorship' && t.entityId){ showPage('thiago'); mentoriasTab = 'mentorados'; }
}

function taskSchemaError(error){
  const msg = (error?.message||'').toLowerCase();
  return msg.includes('entity_type') || msg.includes('entity_id') || msg.includes('assignee_id') || msg.includes('checklist') || msg.includes('comments');
}

async function persistTaskInsert(data){
  const full = await dbInsertTask(taskToDb(data));
  if(!full.error) return full;
  if(!taskSchemaError(full.error)) return full;
  const legacy = await dbInsertTask(taskToDbLegacy(data));
  if(!legacy.error) toast('Tarefa salva sem vínculo. Aplique a migração da Fase 1 para persistir vínculos.');
  return legacy;
}

async function persistTaskUpdate(id, data){
  const full = await dbUpdateTask(id, taskToDb(data));
  if(!full.error) return full;
  if(!taskSchemaError(full.error)) return full;
  const legacy = await dbUpdateTask(id, taskToDbLegacy(data));
  if(!legacy.error) toast('Tarefa atualizada sem vínculo persistido. Aplique a migração da Fase 1.');
  return legacy;
}

function renderEstagiario(){
  const el = document.getElementById('estagiario-content');
  if(!el) return;
  const todayStr = today();

  // Subtítulo dinâmico
  const sub = document.getElementById('tarefas-sub');
  if(sub){
    const pending = tasks.filter(t=>t.status!=='concluida').length;
    const overdue = tasks.filter(t=>t.status!=='concluida' && t.deadline && t.deadline<todayStr).length;
    sub.innerHTML = overdue > 0
      ? `<span style="color:var(--red);font-weight:700">${overdue} vencida${overdue!==1?'s':''}</span> · ${pending} pendente${pending!==1?'s':''}`
      : `${pending} pendente${pending!==1?'s':''}`;
  }

  const tasksByStatus = s => tasks.filter(t=>t.status===s);
  const overdueTasks  = tasks.filter(t=>t.deadline && t.deadline<todayStr && t.status!=='concluida');
  const opLeads       = leads.filter(l=>!(l.tags||[]).includes('planilha'));
  const meetingLeads  = opLeads.filter(l=>l.followUp && l.followUp>=todayStr && !l.converted).sort((a,b)=>a.followUp.localeCompare(b.followUp));

  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:16px">
      ${miniKpi('Tarefas Totais',    tasks.length,                        '#3b82f6','rgba(59,130,246,.1)')}
      ${miniKpi('Pendentes',         tasksByStatus('pendente').length,     '#d4af37','rgba(212,175,55,.1)')}
      ${miniKpi('Em Andamento',      tasksByStatus('em_andamento').length, '#a855f7','rgba(168,85,247,.1)')}
      ${miniKpi('Concluídas',        tasksByStatus('concluida').length,    '#22c55e','rgba(34,197,94,.1)')}
    </div>

    ${renderFollowUpAlerts()}

    <!-- Abas Tarefas / Reuniões -->
    <div class="rp-tabs" style="margin-bottom:16px">
      <button class="rp-tab ${tarefasTab==='tarefas'?'active':''}" onclick="switchTarefasTab('tarefas')">📋 Tarefas</button>
      <button class="rp-tab ${tarefasTab==='reunioes'?'active':''}" onclick="switchTarefasTab('reunioes')">
        📅 Reuniões
        ${meetingLeads.length?`<span style="background:rgba(212,175,55,.12);color:var(--gold);padding:1px 6px;border-radius:99px;font-size:9px;font-weight:700;margin-left:4px">${meetingLeads.length}</span>`:''}
      </button>
    </div>

    <!-- ABA TAREFAS -->
    <div id="tarefas-view-tasks" style="${tarefasTab==='tarefas'?'':'display:none'}">
      <div class="card">
        <div class="card-hd">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="card-title">Tarefas</span>
            ${overdueTasks.length?`<span style="background:rgba(239,68,68,.1);color:var(--red);font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px">${overdueTasks.length} atrasada${overdueTasks.length>1?'s':''}</span>`:''}
          </div>
          <button class="btn btn-sm btn-gold" onclick="openTaskModal()">+ Tarefa</button>
        </div>
        <div style="max-height:520px;overflow-y:auto">
          ${tasks.length===0?`<div class="empty"><div class="empty-icon">✅</div><p>Nenhuma tarefa ainda</p><button class="btn btn-sm btn-gold" onclick="openTaskModal()" style="margin-top:10px">Criar primeira tarefa</button></div>`:''}
          ${['urgente','alta','media','baixa'].flatMap(pri=>
            tasks.filter(t=>t.priority===pri).map(t=>{
              const p = PRIORITY_MAP[t.priority];
              const isOverdue = t.deadline && t.deadline<todayStr && t.status!=='concluida';
              const entity = taskEntityLabel(t);
              return `<div style="padding:12px 16px;border-bottom:1px solid var(--border)">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                  <div style="flex:1;min-width:0">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
                      <span style="font-size:13px;font-weight:700;${t.status==='concluida'?'text-decoration:line-through;color:var(--text3)':''}">${esc(t.title)}</span>
                      <span style="font-size:10px;font-weight:700;padding:1px 7px;border-radius:99px;background:${p.bg};color:${p.c}">${p.dot} ${p.l}</span>
                    </div>
                    ${t.desc?`<div style="font-size:11.5px;color:var(--text3);margin-bottom:4px;line-height:1.5">${esc(t.desc)}</div>`:''}
                    ${entity?`<button onclick="openTaskEntity(tasks.find(x=>x.id==='${t.id}'))" style="margin:4px 0;background:${t.entityType==='lead'?'rgba(59,130,246,.1)':'rgba(212,175,55,.1)'};color:${t.entityType==='lead'?'#3b82f6':'var(--gold)'};border:1px solid ${t.entityType==='lead'?'rgba(59,130,246,.2)':'rgba(212,175,55,.22)'};border-radius:99px;padding:2px 8px;font-size:10px;font-weight:700;cursor:pointer;font-family:var(--font)">${esc(entity)}</button>`:''}
                    ${t.deadline?`<div style="font-size:10px;font-family:var(--mono);color:${isOverdue?'var(--red)':'var(--text3)'}">${isOverdue?'🚨 Atrasado — ':'📅 '}${fmtDate(t.deadline)}</div>`:''}
                  </div>
                  <div style="display:flex;gap:4px;flex-shrink:0">
                    <button class="btn btn-sm btn-ghost" onclick="editTask('${t.id}')">✏️</button>
                    <button class="btn btn-sm" style="background:rgba(239,68,68,.08);color:var(--red);border-color:rgba(239,68,68,.18);padding:4px 8px" onclick="deleteTask('${t.id}')">🗑️</button>
                  </div>
                </div>
                <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap">
                  ${['pendente','em_andamento','concluida'].map(s=>`
                    <button onclick="setTaskStatus('${t.id}','${s}')" style="font-size:10px;padding:3px 9px;border-radius:5px;border:1px solid ${t.status===s?STATUS_MAP[s].c:'var(--border)'};background:${t.status===s?STATUS_MAP[s].c+'18':'none'};color:${t.status===s?STATUS_MAP[s].c:'var(--text3)'};cursor:pointer;font-family:var(--font);font-weight:600;transition:.15s">
                      ${STATUS_MAP[s].icon} ${STATUS_MAP[s].l}
                    </button>`).join('')}
                </div>
              </div>`;
            })
          ).join('')}
        </div>
      </div>
    </div>

    <!-- ABA REUNIÕES -->
    <div id="tarefas-view-reunioes" style="${tarefasTab==='reunioes'?'':'display:none'}">
      <div class="card">
        <div class="card-hd">
          <span class="card-title">Follow-ups e Reuniões Agendadas</span>
          <span class="card-sub">${meetingLeads.length} pendente${meetingLeads.length!==1?'s':''}</span>
        </div>
        ${meetingLeads.length===0
          ? `<div class="empty"><div class="empty-icon">📅</div><p>Nenhuma reunião agendada</p><p style="font-size:11px;color:var(--text3);margin-top:4px">Defina um follow-up nos leads para vê-los aqui</p></div>`
          : `<div style="max-height:560px;overflow-y:auto">
            ${meetingLeads.map(l=>`
            <div onclick="openDetail('${l.id}')" style="padding:12px 18px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;align-items:center;gap:12px;transition:.15s" onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background=''">
              <div style="width:36px;height:36px;border-radius:50%;background:${strColor(l.name)};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0">${initials(l.name)}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700">${esc(l.name)}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:2px">${l.instagram||l.company||l.phone||'—'}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:12px;font-weight:700;color:${l.followUp===todayStr?'var(--gold)':'var(--text2)'}">${l.followUp===todayStr?'⏰ Hoje':fmtDate(l.followUp)}</div>
                ${l.phone?`<button onclick="event.stopPropagation();openWAModal('${l.id}')" style="background:none;border:none;cursor:pointer;color:#25d366;font-size:11px;padding:2px 0;margin-top:4px;font-family:var(--font);font-weight:600">💬 WhatsApp</button>`:''}
              </div>
            </div>`).join('')}
          </div>`}
      </div>
    </div>
  `;
}

function switchTarefasTab(tab){
  tarefasTab = tab;
  document.querySelectorAll('#estagiario-content .rp-tab').forEach((btn,i)=>btn.classList.toggle('active',(tab==='tarefas'&&i===0)||(tab==='reunioes'&&i===1)));
  const tv = document.getElementById('tarefas-view-tasks');
  const rv = document.getElementById('tarefas-view-reunioes');
  if(tv) tv.style.display = tab==='tarefas' ? '' : 'none';
  if(rv) rv.style.display = tab==='reunioes' ? '' : 'none';
}

/* ── Task CRUD ── */
function openTaskModal(id, preset={}){
  editingTaskId = id||null;
  const t = id ? tasks.find(x=>x.id===id) : null;
  const presetLead = preset.entityType === 'lead' ? getLead(preset.entityId) : null;
  document.getElementById('mt-title').textContent = t ? 'Editar Tarefa' : 'Nova Tarefa';
  document.getElementById('mt-title-inp').value = t?.title || (presetLead ? `Follow-up com ${presetLead.name}` : '');
  document.getElementById('mt-desc').value = t?.desc||'';
  document.getElementById('mt-priority').value = t?.priority||'media';
  document.getElementById('mt-status').value = t?.status||'pendente';
  document.getElementById('mt-deadline').value = t?.deadline||'';
  document.getElementById('mt-entity-type').value = t?.entityType || preset.entityType || '';
  populateTaskEntityOptions(t?.entityId || preset.entityId || '');
  openMo('mo-task');
  setTimeout(()=>document.getElementById('mt-title-inp').focus(),150);
}

function populateTaskEntityOptions(selectedId=''){
  const type = document.getElementById('mt-entity-type')?.value || '';
  const select = document.getElementById('mt-entity-id');
  if(!select) return;
  if(!type){
    select.innerHTML = '<option value="">Nenhum</option>';
    select.disabled = true;
    return;
  }
  select.disabled = false;
  const rows = type === 'lead'
    ? leads.map(l=>({id:l.id, label:l.name}))
    : mentorships.map(m=>({id:m.id, label:m.client}));
  select.innerHTML = rows.length
    ? rows.map(r=>`<option value="${r.id}">${esc(r.label)}</option>`).join('')
    : '<option value="">Nenhum registro disponível</option>';
  select.value = selectedId && rows.some(r=>r.id===selectedId) ? selectedId : (rows[0]?.id || '');
}

async function saveTask(){
  const title = document.getElementById('mt-title-inp').value.trim();
  if(!validateForm([[title, 'Informe o título da tarefa']])) return;
  const btn = document.querySelector('#mo-task .btn-gold');
  const entityType = document.getElementById('mt-entity-type').value;
  const data = {
    title, desc:document.getElementById('mt-desc').value.trim(), priority:document.getElementById('mt-priority').value,
    status:document.getElementById('mt-status').value, deadline:document.getElementById('mt-deadline').value||null,
    entityType, entityId:entityType ? document.getElementById('mt-entity-id').value : ''
  };
  const wasEditing = editingTaskId;
  await withLoading(btn, async () => {
    if(wasEditing){
      const {error} = await persistTaskUpdate(wasEditing, data);
      if(error){ showError(error.message); return; }
      Object.assign(tasks.find(x=>x.id===wasEditing), data);
    } else {
      const {data:row, error} = await persistTaskInsert(data);
      if(error){ showError(error.message); return; }
      tasks.push({...mapTask(row), entityType:data.entityType, entityId:data.entityId});
    }
    closeMo('mo-task');
    renderSidebar();
    renderEstagiario();
    invalidateTaskPages();
    toast(wasEditing ? 'Tarefa atualizada!' : 'Tarefa criada!');
  });
}

function editTask(id){ openTaskModal(id); }

async function deleteTask(id){
  showConfirm({
    title: '🗑️ Excluir Tarefa',
    msg: 'Esta ação não pode ser desfeita.',
    confirmText: 'Sim, excluir',
    danger: true,
    onConfirm: async () => {
      const {error} = await dbDeleteTask(id);
      if(error){ showError(error.message); return; }
      tasks = tasks.filter(t=>t.id!==id);
      renderSidebar(); renderEstagiario();
      invalidateTaskPages();
      toast('Tarefa removida');
    }
  });
}

async function setTaskStatus(id, status){
  const t = tasks.find(x=>x.id===id); if(!t) return;
  t.status = status;
  const {error} = await dbUpdateTask(id, {status});
  if(error) return showError(error.message);
  renderSidebar(); renderEstagiario();
  invalidateTaskPages();
}

async function saveObs(){
  estagiarioObs = document.getElementById('est-obs').value;
  const {error} = await dbUpsertSetting('estagiario_obs', estagiarioObs);
  if(error) return showError(error.message);
  toast('Observações salvas!');
}
