let reportsTab = 'performance';

function renderReports(){
  const el = document.getElementById('reports-content');
  if(!el) return;
  el.innerHTML = `
    <div class="rp-tabs">
      <button class="rp-tab ${reportsTab==='performance'?'active':''}" onclick="switchReportsTab('performance')">Performance</button>
      <button class="rp-tab ${reportsTab==='captacao'?'active':''}" onclick="switchReportsTab('captacao')">Captação</button>
      <button class="rp-tab ${reportsTab==='operacao'?'active':''}" onclick="switchReportsTab('operacao')">Operacao</button>
    </div>
    <div id="rp-tab-content"></div>
  `;
  renderReportsTabContent();
}

function switchReportsTab(tab){
  reportsTab = tab;
  document.querySelectorAll('.rp-tab').forEach((t,i) => t.classList.toggle('active', (tab==='performance'&&i===0)||(tab==='captacao'&&i===1)||(tab==='operacao'&&i===2)));
  renderReportsTabContent();
}

function renderReportsTabContent(){
  const el = document.getElementById('rp-tab-content');
  if(!el) return;
  if(reportsTab === 'performance') el.innerHTML = renderPerformanceTab();
  else if(reportsTab === 'captacao') el.innerHTML = renderCaptacaoTab();
  else el.innerHTML = renderOperacaoTab();
}

/* ── ABA PERFORMANCE ── */
function renderPerformanceTab(){
  const totalVal = leads.reduce((s,l)=>s+(l.value||0),0);
  const byOrigin = Object.entries(ORIGIN_MAP).map(([k,o])=>{
    const n = leads.filter(l=>l.origin===k).length;
    const val = leads.filter(l=>l.origin===k).reduce((s,l)=>s+(l.value||0),0);
    return {k,o,n,val};
  }).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);

  const byFunnel = funnels.map(f=>{
    const fLeads = leads.filter(l=>l.funnelId===f.id);
    const closed = fLeads.filter(l=>l.stageId===f.stages[f.stages.length-1]?.id);
    return {f, fLeads, closed};
  });

  return `
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="card" style="padding:18px 20px"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Total Leads</div><div style="font-size:32px;font-weight:900;letter-spacing:-.05em">${leads.length}</div></div>
      <div class="card" style="padding:18px 20px"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Pipeline Total</div><div style="font-size:24px;font-weight:900;letter-spacing:-.04em;color:var(--gold)">${fmtMoney(totalVal)}</div></div>
      <div class="card" style="padding:18px 20px"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Funis Ativos</div><div style="font-size:32px;font-weight:900;letter-spacing:-.05em">${funnels.length}</div></div>
      <div class="card" style="padding:18px 20px"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Origens Ativas</div><div style="font-size:32px;font-weight:900;letter-spacing:-.05em">${byOrigin.length}</div></div>
    </div>
    <div class="dash-grid">
      <div class="card">
        <div class="card-hd"><span class="card-title">Performance por Funil</span></div>
        <div class="card-body">
          ${byFunnel.length === 0
            ? `<div class="empty"><div class="empty-icon">📊</div><p>Nenhum funil criado ainda</p><button class="btn btn-sm btn-gold" onclick="showPage('funnels-cfg')" style="margin-top:10px">Criar primeiro funil</button></div>`
            : byFunnel.map(({f,fLeads,closed})=>{
                const conv = fLeads.length?Math.round(closed.length/fLeads.length*100):0;
                const val = fLeads.reduce((s,l)=>s+(l.value||0),0);
                return `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                    <span style="font-size:13px;font-weight:700">${f.icon} ${f.name}</span>
                    <span style="font-size:12px;font-weight:700;color:var(--gold)">${fmtMoney(val)}</span>
                  </div>
                  <div style="display:flex;gap:12px;font-size:11px;color:var(--text3);margin-bottom:6px">
                    <span>${fLeads.length} leads</span>
                    <span>${closed.length} fechados</span>
                    <span style="color:var(--green)">${conv}% conversão</span>
                  </div>
                  <div class="progress-bar"><div class="progress-fill" style="width:${conv}%"></div></div>
                </div>`;
              }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-hd"><span class="card-title">Leads por Origem</span></div>
        <div class="card-body">
          ${byOrigin.length === 0
            ? `<div class="empty"><div class="empty-icon">🔍</div><p>Nenhum lead cadastrado ainda</p><button class="btn btn-sm btn-gold" onclick="openLeadModal()" style="margin-top:10px">Adicionar primeiro lead</button></div>`
            : byOrigin.map(({k,o,n,val})=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
                <span class="origin-badge" style="background:${o.bg};color:${o.c};flex-shrink:0">${o.l}</span>
                <div class="funnel-track" style="flex:1;height:16px"><div class="funnel-fill" style="width:${Math.round(n/leads.length*100)}%;background:${o.c}"><span>${n}</span></div></div>
                <span style="font-size:11px;font-family:var(--mono);color:var(--gold);flex-shrink:0">${fmtMoney(val)}</span>
              </div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ── ABA CAPTAÇÃO (absorve Marketing) ── */
function renderCaptacaoTab(){
  const opLeads = leads.filter(l=>!(l.tags||[]).includes('planilha'));
  const igLeads      = opLeads.filter(l=>l.origin==='ig_comentario'||l.origin==='ig_seguidor');
  const igComentario = opLeads.filter(l=>l.origin==='ig_comentario');
  const igSeguidor   = opLeads.filter(l=>l.origin==='ig_seguidor');
  const abordados    = leads.filter(l=>(l.tags||[]).includes('abordado'));
  const convertidos  = opLeads.filter(l=>l.converted);
  const convRate     = igLeads.length ? Math.round(convertidos.length/igLeads.length*100) : 0;

  const months = [];
  const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  for(let i=5;i>=0;i--){
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const count = opLeads.filter(l=>l.date&&l.date.startsWith(key)).length;
    months.push({ label: MONTHS_PT[d.getMonth()], count });
  }
  const maxMonth = Math.max(...months.map(m=>m.count), 1);

  return `
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="card" style="padding:18px 20px"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Leads via Instagram</div><div style="font-size:32px;font-weight:900;color:#e1306c">${igLeads.length}</div></div>
      <div class="card" style="padding:18px 20px"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Abordados (WPP)</div><div style="font-size:32px;font-weight:900;color:#25d366">${abordados.length}</div></div>
      <div class="card" style="padding:18px 20px"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Convertidos</div><div style="font-size:32px;font-weight:900;color:var(--green)">${convertidos.length}</div></div>
      <div class="card" style="padding:18px 20px"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Taxa Conversão</div><div style="font-size:32px;font-weight:900;color:${convRate>=10?'var(--green)':'var(--gold)'}">${convRate}%</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="card">
        <div class="card-hd"><span class="card-title">📸 Origem Instagram</span></div>
        <div style="padding:14px 18px;display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(225,48,108,.07);border-radius:var(--r-sm)">
            <span style="font-size:12px;font-weight:600">💬 Comentários</span>
            <span style="font-size:20px;font-weight:900;color:#e1306c;font-family:var(--mono)">${igComentario.length}</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(168,85,247,.07);border-radius:var(--r-sm)">
            <span style="font-size:12px;font-weight:600">📢 Seguidores/Anúncio</span>
            <span style="font-size:20px;font-weight:900;color:#a855f7;font-family:var(--mono)">${igSeguidor.length}</span>
          </div>
          ${igLeads.length>0?`
          <div style="height:5px;border-radius:99px;overflow:hidden;display:flex;gap:2px">
            <div style="flex:${igComentario.length||1};background:#e1306c;border-radius:99px 0 0 99px"></div>
            <div style="flex:${igSeguidor.length||1};background:#a855f7;border-radius:0 99px 99px 0"></div>
          </div>`:''}
        </div>
      </div>
      <div class="card">
        <div class="card-hd"><span class="card-title">🎯 Funil de Conversão</span></div>
        <div style="padding:14px 18px;display:flex;flex-direction:column;gap:8px">
          ${[['Captados (IG)',igLeads.length,'#e1306c'],['Abordados (WPP)',abordados.length,'#25d366'],['Convertidos',convertidos.length,'#22c55e']].map(([lbl,val,color])=>`
            <div>
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
                <span style="color:var(--text2)">${lbl}</span>
                <span style="font-weight:700;color:${color}">${val}</span>
              </div>
              <div style="height:5px;background:var(--surface3);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${igLeads.length?Math.round(val/igLeads.length*100):0}%;background:${color};border-radius:99px;transition:width .6s"></div>
              </div>
            </div>`).join('')}
          <div style="text-align:center;font-size:11px;color:var(--text3);margin-top:4px">
            Conversão: <strong style="color:${convRate>=10?'#22c55e':'var(--gold)'}">${convRate}%</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-hd"><span class="card-title">📈 Captação por Mês</span><span class="card-sub">Últimos 6 meses</span></div>
      <div style="padding:16px 18px">
        <div style="display:flex;align-items:flex-end;gap:8px;height:100px">
          ${months.map(m=>{
            const h = Math.round((m.count/maxMonth)*90);
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="font-size:10px;font-weight:700;color:var(--gold);font-family:var(--mono)">${m.count||''}</div>
              <div style="width:100%;height:${Math.max(h,3)}px;border-radius:4px 4px 0 0;background:${m.count?'var(--gold)':'var(--surface3)'}"></div>
              <div style="font-size:9px;color:var(--text3);font-family:var(--mono)">${m.label}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

  `;
}

function reportKpi(label, value, color, sub=''){
  return `<div class="card" style="padding:18px 20px">
    <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">${label}</div>
    <div style="font-size:30px;font-weight:900;letter-spacing:-.04em;color:${color}">${value}</div>
    ${sub?`<div style="font-size:11px;color:var(--text3);margin-top:4px">${sub}</div>`:''}
  </div>`;
}

function renderOperacaoTab(){
  const todayStr = today();
  const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);
  const sevenAgoStr = sevenAgo.toISOString().slice(0, 10);
  const opLeads = leads.filter(l=>!(l.tags||[]).includes('planilha'));
  const overdueFollowUps = opLeads.filter(l=>l.followUp && l.followUp < todayStr && !l.converted);
  const todayFollowUps = opLeads.filter(l=>l.followUp === todayStr && !l.converted);
  const stuckLeads = opLeads.filter(l=>{
    if(l.converted) return false;
    const acts = l.activities || [];
    const last = acts.length && acts[acts.length-1].time ? acts[acts.length-1].time.slice(0,10) : l.date;
    return last < sevenAgoStr && !l.followUp;
  });

  const pendingTasks = tasks.filter(t=>t.status!=='concluida');
  const overdueTasks = pendingTasks.filter(t=>t.deadline && t.deadline < todayStr);
  const doneTasks = tasks.filter(t=>t.status==='concluida');
  const taskDoneRate = tasks.length ? Math.round(doneTasks.length / tasks.length * 100) : 0;

  const activeMentorships = mentorships.filter(m=>m.active);
  const hourBanks = activeMentorships.map(m => {
    if(typeof mentorshipHourBank === 'function') return {m, bank: mentorshipHourBank(m)};
    const contracted = (parseFloat(m.hoursPerSession)||0) * (parseInt(m.sessionsPerWeek)||0) * (parseInt(m.totalWeeks)||0);
    return {m, bank:{contracted, used:0, remaining:contracted, pct:0, alert:false}};
  });
  const usedHours = hourBanks.reduce((s,x)=>s+x.bank.used,0);
  const remainingHours = hourBanks.reduce((s,x)=>s+x.bank.remaining,0);
  const lowBalance = hourBanks.filter(x=>x.bank.alert);

  const attentionRows = [
    ...overdueFollowUps.slice(0,6).map(l=>({type:'Follow-up vencido', title:l.name, sub:fmtDate(l.followUp), color:'var(--red)', action:`openDetail('${l.id}')`})),
    ...overdueTasks.slice(0,6).map(t=>({type:'Tarefa vencida', title:t.title, sub:fmtDate(t.deadline), color:'#f97316', action:`showPage('tarefas')`})),
    ...stuckLeads.slice(0,6).map(l=>({type:'Lead parado', title:l.name, sub:'7+ dias sem atividade', color:'#64748b', action:`openDetail('${l.id}')`})),
    ...lowBalance.slice(0,6).map(x=>({type:'Horas acabando', title:x.m.client, sub:`${x.bank.remaining.toFixed(1)}h restantes`, color:'var(--red)', action:`showPage('thiago')`}))
  ].slice(0,12);

  return `
    <div class="stats-grid" style="margin-bottom:20px">
      ${reportKpi('Follow-ups vencidos', overdueFollowUps.length, overdueFollowUps.length?'var(--red)':'#22c55e', `${todayFollowUps.length} para hoje`)}
      ${reportKpi('Tarefas vencidas', overdueTasks.length, overdueTasks.length?'var(--red)':'#22c55e', `${pendingTasks.length} pendentes`)}
      ${reportKpi('Conclusao de tarefas', taskDoneRate + '%', taskDoneRate>=70?'#22c55e':'var(--gold)', `${doneTasks.length}/${tasks.length || 0} concluidas`)}
      ${reportKpi('Saldo de horas', remainingHours.toFixed(1) + 'h', lowBalance.length?'var(--red)':'#22c55e', `${usedHours.toFixed(1)}h consumidas`)}
    </div>

    <div class="dash-grid">
      <div class="card">
        <div class="card-hd">
          <span class="card-title">Gargalos de Operacao</span>
          <span class="card-sub">${attentionRows.length} itens</span>
        </div>
        <div>
          ${attentionRows.length ? attentionRows.map(r=>`
            <div onclick="${r.action}" style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;cursor:pointer">
              <div style="width:9px;height:9px;border-radius:50%;background:${r.color};flex-shrink:0"></div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:800;color:${r.color}">${esc(r.type)}</div>
                <div style="font-size:12px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.title)}</div>
              </div>
              <div style="font-size:11px;color:var(--text3);font-family:var(--mono);flex-shrink:0">${esc(r.sub)}</div>
            </div>`).join('') : `<div class="empty"><div class="empty-icon">OK</div><p>Nenhum gargalo critico agora</p></div>`}
        </div>
      </div>

      <div class="card">
        <div class="card-hd">
          <span class="card-title">Banco de Horas por Mentoria</span>
          <span class="card-sub">${activeMentorships.length} ativas</span>
        </div>
        <div class="card-body">
          ${hourBanks.length ? hourBanks.map(({m,bank})=>`
            <div style="padding:9px 0;border-bottom:1px solid var(--border)">
              <div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:5px">
                <span style="font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.client)}</span>
                <span style="font-size:11px;font-weight:800;color:${bank.alert?'var(--red)':'#22c55e'}">${bank.remaining.toFixed(1)}h</span>
              </div>
              <div style="height:7px;border-radius:99px;background:var(--surface3);overflow:hidden">
                <div style="height:100%;width:${bank.pct}%;background:${bank.alert?'var(--red)':'#22c55e'}"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:10px;color:var(--text3)">
                <span>${bank.used.toFixed(1)}h usadas</span>
                <span>${bank.contracted.toFixed(1)}h contratadas</span>
              </div>
            </div>`).join('') : `<div class="empty"><div class="empty-icon">--</div><p>Nenhuma mentoria ativa</p></div>`}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-hd"><span class="card-title">Produtividade de Tarefas</span></div>
      <div class="card-body">
        ${['pendente','em_andamento','concluida'].map(status=>{
          const count = tasks.filter(t=>t.status===status).length;
          const meta = STATUS_MAP?.[status] || {l:status,c:'var(--text3)'};
          const pct = tasks.length ? Math.round(count / tasks.length * 100) : 0;
          return `<div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
              <span style="color:var(--text2)">${meta.l}</span>
              <span style="font-weight:800;color:${meta.c}">${count} · ${pct}%</span>
            </div>
            <div style="height:6px;background:var(--surface3);border-radius:99px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${meta.c};border-radius:99px"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}
