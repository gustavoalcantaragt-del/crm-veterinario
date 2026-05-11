const AUTO_TAGS = {
  followupOverdue: 'precisa de follow-up',
  noResponse7d: 'sem resposta',
  highValue: 'alto potencial',
  overdueLinkedTask: 'em risco',
};

function getLeadLastTouchDate(l){
  const acts = l.activities || [];
  return acts.length && acts[acts.length-1].time ? acts[acts.length-1].time.slice(0,10) : l.date;
}

function addAutoTag(l, tag, reason, changes){
  l.tags = normalizeLeadTags([...(l.tags||[]), tag].join(','));
  l.activities = l.activities || [];
  const marker = `Automação: ${reason}`;
  const alreadyLogged = l.activities.some(a => a.text === marker);
  if(!alreadyLogged) l.activities.push({text:marker, time:new Date().toISOString()});
  changes.push({lead:l, tag, reason, action:'add'});
}

function removeAutoTag(l, tag, reason, changes){
  if(!(l.tags||[]).includes(tag)) return;
  l.tags = (l.tags||[]).filter(t=>t!==tag);
  changes.push({lead:l, tag, reason, action:'remove'});
}

function evaluateLeadAutomations(l){
  const todayStr = today();
  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);
  const sevenAgoStr = sevenAgo.toISOString().slice(0,10);
  const changes = [];

  if(automationSettings.followupOverdue && l.followUp && l.followUp < todayStr && !l.converted){
    if(!(l.tags||[]).includes(AUTO_TAGS.followupOverdue)) addAutoTag(l, AUTO_TAGS.followupOverdue, 'follow-up vencido', changes);
  } else if(automationSettings.cleanResolved){
    removeAutoTag(l, AUTO_TAGS.followupOverdue, 'follow-up resolvido', changes);
  }

  const lastTouch = getLeadLastTouchDate(l);
  if(automationSettings.noResponse7d && !l.converted && lastTouch < sevenAgoStr && !l.followUp){
    if(!(l.tags||[]).includes(AUTO_TAGS.noResponse7d)) addAutoTag(l, AUTO_TAGS.noResponse7d, 'lead sem resposta há 7 dias', changes);
  } else if(automationSettings.cleanResolved){
    removeAutoTag(l, AUTO_TAGS.noResponse7d, 'lead voltou a ter atividade', changes);
  }

  if(automationSettings.highValue && (l.value||0) >= (Number(automationSettings.highValueMin)||5000)){
    if(!(l.tags||[]).includes(AUTO_TAGS.highValue)) addAutoTag(l, AUTO_TAGS.highValue, 'lead de alto potencial', changes);
  } else if(automationSettings.cleanResolved){
    removeAutoTag(l, AUTO_TAGS.highValue, 'valor abaixo da regra', changes);
  }

  const hasOverdueTask = tasks.some(t =>
    t.entityType === 'lead' &&
    t.entityId === l.id &&
    t.status !== 'concluida' &&
    t.deadline &&
    t.deadline < todayStr
  );
  if(automationSettings.overdueLinkedTask && hasOverdueTask && !l.converted){
    if(!(l.tags||[]).includes(AUTO_TAGS.overdueLinkedTask)) addAutoTag(l, AUTO_TAGS.overdueLinkedTask, 'tarefa vinculada vencida', changes);
  } else if(automationSettings.cleanResolved){
    removeAutoTag(l, AUTO_TAGS.overdueLinkedTask, 'sem tarefas vinculadas vencidas', changes);
  }

  return changes;
}

async function runAutomations({silent=false}={}){
  const allChanges = [];
  const touched = [];
  for(const l of leads){
    if((l.tags||[]).includes('planilha')) continue;
    const before = JSON.stringify({tags:l.tags||[], activities:l.activities||[]});
    const changes = evaluateLeadAutomations(l);
    const after = JSON.stringify({tags:l.tags||[], activities:l.activities||[]});
    if(changes.length && before !== after){
      const {error} = await dbUpdateLead(l.id, {tags:l.tags, activities:l.activities});
      if(error){
        showError(error.message);
        continue;
      }
      allChanges.push(...changes);
      touched.push(l.id);
    }
  }
  automationSettings.lastRunAt = new Date().toISOString();
  automationLastRun = {at:automationSettings.lastRunAt, changes:allChanges, touched:[...new Set(touched)]};
  await dbUpsertSetting('automation_settings', automationSettings);
  invalidateAutomationPages();
  invalidateLeadPages();
  invalidateTagPages();
  if(currentPage==='automacoes') renderAutomations();
  if(currentPage==='leads-list') renderLeadsTable();
  if(currentPage==='kanban') renderKanban();
  if(!silent) toast(allChanges.length ? `${allChanges.length} automação${allChanges.length!==1?'ões':''} aplicada${allChanges.length!==1?'s':''}` : 'Nenhuma automação pendente');
  return automationLastRun;
}

async function saveAutomationSettings(){
  automationSettings.followupOverdue = document.getElementById('auto-followup').checked;
  automationSettings.noResponse7d = document.getElementById('auto-noresponse').checked;
  automationSettings.highValue = document.getElementById('auto-highvalue').checked;
  automationSettings.highValueMin = Number(document.getElementById('auto-highvalue-min').value)||5000;
  automationSettings.overdueLinkedTask = document.getElementById('auto-risk').checked;
  automationSettings.cleanResolved = document.getElementById('auto-clean').checked;
  const {error} = await dbUpsertSetting('automation_settings', automationSettings);
  if(error) return showError(error.message);
  renderAutomations();
  toast('Automações salvas');
}

function renderAutomationRule({id, title, desc, checked, extra=''}){
  return `<label style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--border)">
    <input id="${id}" type="checkbox" ${checked?'checked':''} style="margin-top:3px">
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:800">${title}</div>
      <div style="font-size:11.5px;color:var(--text3);margin-top:3px;line-height:1.45">${desc}</div>
      ${extra}
    </div>
  </label>`;
}

function renderAutomationPreview(){
  const preview = leads
    .filter(l=>!(l.tags||[]).includes('planilha'))
    .map(l=>({lead:l, changes:evaluateLeadAutomations({...l, tags:[...(l.tags||[])], activities:[...(l.activities||[])]})}))
    .filter(x=>x.changes.length)
    .slice(0,12);
  if(!preview.length) return `<div class="empty"><div class="empty-icon">OK</div><p>Nenhuma regra pendente agora</p></div>`;
  return preview.map(({lead,changes})=>`
    <div onclick="openDetail('${lead.id}')" style="padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer">
      <div style="font-size:13px;font-weight:800">${esc(lead.name)}</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:5px">
        ${changes.map(c=>`<span class="kb-tag" style="background:${c.action==='remove'?'rgba(138,134,128,.12)':'rgba(212,175,55,.12)'};color:${c.action==='remove'?'var(--text3)':'var(--gold)'}">${c.action==='remove'?'remover':'aplicar'}: ${esc(c.tag)}</span>`).join('')}
      </div>
    </div>`).join('');
}

function renderAutomations(){
  const el = document.getElementById('automations-content');
  if(!el) return;
  const enabled = Object.entries(automationSettings).filter(([k,v])=>typeof v==='boolean' && v).length;
  const last = automationSettings.lastRunAt ? new Date(automationSettings.lastRunAt).toLocaleString('pt-BR') : 'Nunca executado';
  const lastChanges = automationLastRun?.changes?.length || 0;
  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:16px">
      ${miniKpi('Regras Ativas', enabled, '#a855f7','rgba(168,85,247,.1)')}
      ${miniKpi('Última Execução', lastChanges, '#d4af37','rgba(212,175,55,.1)')}
      ${miniKpi('Leads com Follow-up', leads.filter(l=>l.followUp && !l.converted).length, '#3b82f6','rgba(59,130,246,.1)')}
      ${miniKpi('Tags Automáticas', Object.values(AUTO_TAGS).filter(t=>leads.some(l=>(l.tags||[]).includes(t))).length, '#22c55e','rgba(34,197,94,.1)')}
    </div>

    <div class="dash-grid">
      <div class="card">
        <div class="card-hd">
          <div>
            <span class="card-title">Regras</span>
            <div class="card-sub">Última execução: ${esc(last)}</div>
          </div>
          <button class="btn btn-sm btn-gold" onclick="runAutomations()">Executar agora</button>
        </div>
        <div class="card-body">
          ${renderAutomationRule({
            id:'auto-followup',
            title:'Follow-up vencido → precisa de follow-up',
            desc:'Aplica a etiqueta quando a data de follow-up passou e o lead ainda não converteu.',
            checked:automationSettings.followupOverdue
          })}
          ${renderAutomationRule({
            id:'auto-noresponse',
            title:'Lead parado há 7 dias → sem resposta',
            desc:'Aplica etiqueta quando não há atividade recente e não existe follow-up agendado.',
            checked:automationSettings.noResponse7d
          })}
          ${renderAutomationRule({
            id:'auto-highvalue',
            title:'Valor alto → alto potencial',
            desc:'Marca oportunidades com valor estimado acima do limite configurado.',
            checked:automationSettings.highValue,
            extra:`<input id="auto-highvalue-min" type="number" min="0" step="500" value="${automationSettings.highValueMin||5000}" style="margin-top:8px;width:140px;font-size:12px" placeholder="Valor mínimo">`
          })}
          ${renderAutomationRule({
            id:'auto-risk',
            title:'Tarefa vinculada vencida → em risco',
            desc:'Marca leads com tarefas vinculadas vencidas para priorização operacional.',
            checked:automationSettings.overdueLinkedTask
          })}
          ${renderAutomationRule({
            id:'auto-clean',
            title:'Remover etiquetas quando a condição deixar de existir',
            desc:'Mantém as etiquetas automáticas limpas quando o lead volta ao fluxo normal.',
            checked:automationSettings.cleanResolved
          })}
          <button class="btn btn-sm" onclick="saveAutomationSettings()" style="margin-top:12px">Salvar regras</button>
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <span class="card-title">Prévia de Aplicação</span>
          <span class="card-sub">próxima execução</span>
        </div>
        <div class="card-body">
          ${renderAutomationPreview()}
        </div>
      </div>
    </div>
  `;
}
