function renderMarketing(){
  const el = document.getElementById('marketing-content');
  if(!el) return;

  const opLeads = leads.filter(l=>!(l.tags||[]).includes('planilha'));
  const igLeads = opLeads.filter(l=>l.origin==='ig_comentario'||l.origin==='ig_seguidor');
  const igComentario = opLeads.filter(l=>l.origin==='ig_comentario');
  const igSeguidor   = opLeads.filter(l=>l.origin==='ig_seguidor');
  const abordados    = leads.filter(l=>(l.tags||[]).includes('abordado'));
  const convertidos  = opLeads.filter(l=>l.converted);
  const convRate     = igLeads.length ? Math.round(convertidos.length/igLeads.length*100) : 0;

  const months = [];
  for(let i=5;i>=0;i--){
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const count = opLeads.filter(l=>l.date&&l.date.startsWith(key)).length;
    months.push({ label: MONTHS_PT[d.getMonth()], count });
  }
  const maxMonth = Math.max(...months.map(m=>m.count), 1);

  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:20px">
      ${miniKpi('Leads via Instagram', igLeads.length, '#e1306c', 'rgba(225,48,108,.1)')}
      ${miniKpi('Abordados (WPP)', abordados.length, '#25d366', 'rgba(37,211,102,.1)')}
      ${miniKpi('Convertidos', convertidos.length, '#22c55e', 'rgba(34,197,94,.1)')}
      ${miniKpi('Taxa de Conversão', convRate+'%', convRate>=10?'#22c55e':'#d4af37', convRate>=10?'rgba(34,197,94,.1)':'rgba(212,175,55,.1)')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <div class="card">
        <div class="card-hd"><span class="card-title">📊 Origem dos Leads</span></div>
        <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(225,48,108,.07);border-radius:var(--r-sm)">
            <div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">💬</span><span style="font-size:12px;font-weight:600">Comentários IG</span></div>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:80px;height:6px;background:var(--surface3);border-radius:99px;overflow:hidden"><div style="height:100%;width:${igComentario.length?Math.round(igComentario.length/(igComentario.length+igSeguidor.length)*100):0}%;background:#e1306c;border-radius:99px"></div></div>
              <span style="font-size:14px;font-weight:900;color:#e1306c;font-family:var(--mono)">${igComentario.length}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(168,85,247,.07);border-radius:var(--r-sm)">
            <div style="display:flex;align-items:center;gap:8px"><span style="font-size:16px">📢</span><span style="font-size:12px;font-weight:600">Seguidores IG</span></div>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:80px;height:6px;background:var(--surface3);border-radius:99px;overflow:hidden"><div style="height:100%;width:${igSeguidor.length?Math.round(igSeguidor.length/(igComentario.length+igSeguidor.length)*100):0}%;background:#a855f7;border-radius:99px"></div></div>
              <span style="font-size:14px;font-weight:900;color:#a855f7;font-family:var(--mono)">${igSeguidor.length}</span>
            </div>
          </div>
          <div style="text-align:center;padding:8px 0;font-size:10px;color:var(--text3)">Total Instagram: <strong style="color:var(--text)">${igLeads.length}</strong> leads</div>
        </div>
      </div>

      <div class="card">
        <div class="card-hd"><span class="card-title">🎯 Funil de Conversão</span></div>
        <div style="padding:12px 16px;display:flex;flex-direction:column;gap:6px">
          ${[
            ['Captados (IG)', igLeads.length, '#e1306c', igLeads.length],
            ['Abordados (WPP)', abordados.length, '#25d366', igLeads.length],
            ['Convertidos', convertidos.length, '#22c55e', igLeads.length],
          ].map(([lbl,val,color,total])=>`
            <div>
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
                <span style="color:var(--text2)">${lbl}</span>
                <span style="font-weight:700;color:${color}">${val}</span>
              </div>
              <div style="height:6px;background:var(--surface3);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${total?Math.round(val/total*100):0}%;background:${color};border-radius:99px;transition:width .6s"></div>
              </div>
            </div>`).join('')}
          <div style="margin-top:8px;text-align:center;font-size:11px;color:var(--text3)">
            Conversão geral: <strong style="color:${convRate>=10?'#22c55e':'#d4af37'}">${convRate}%</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-hd">
        <span class="card-title">📈 Captação por Mês</span>
        <span class="card-sub">Últimos 6 meses</span>
      </div>
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

    <div class="card" style="margin-bottom:16px">
      <div class="card-hd"><span class="card-title">🛠️ Ferramentas Rápidas</span></div>
      <div style="padding:12px 16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
        ${[
          {icon:'📅', title:'Calendário Editorial', desc:'Planeje posts e stories com antecedência', color:'#3b82f6', link:'https://calendar.google.com'},
          {icon:'🎨', title:'Canva', desc:'Criação de artes para feed e stories', color:'#a855f7', link:'https://canva.com'},
          {icon:'📊', title:'Meta Business Suite', desc:'Métricas e agendamento do Instagram', color:'#1877f2', link:'https://business.facebook.com'},
          {icon:'📝', title:'Notion — Pautas', desc:'Organizar pautas e briefings de conteúdo', color:'#f97316', link:'https://notion.so'},
          {icon:'🔍', title:'Google Trends', desc:'Descobrir tendências para pauta', color:'#22c55e', link:'https://trends.google.com'},
          {icon:'📱', title:'Creator Studio', desc:'Agendar posts no Instagram/Facebook', color:'#e1306c', link:'https://business.facebook.com/creatorstudio'},
        ].map(t=>`
          <a href="${t.link}" target="_blank" style="text-decoration:none;display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);transition:.15s;cursor:pointer"
            onmouseover="this.style.borderColor='${t.color}50';this.style.background='${t.color}08'"
            onmouseout="this.style.borderColor='var(--border)';this.style.background='var(--surface2)'">
            <div style="width:36px;height:36px;border-radius:8px;background:${t.color}15;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${t.icon}</div>
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text)">${t.title}</div>
              <div style="font-size:10px;color:var(--text3);margin-top:2px">${t.desc}</div>
            </div>
          </a>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-hd"><span class="card-title">✅ Checklist Semanal de Conteúdo</span></div>
      <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px">
        ${[
          {icon:'📸', task:'2 posts no feed (terça e quinta)', type:'Feed'},
          {icon:'🎬', task:'3 Reels por semana (segunda, quarta, sexta)', type:'Reels'},
          {icon:'📖', task:'Stories diários com CTA para DM', type:'Stories'},
          {icon:'💬', task:'Responder todos os comentários em até 2h', type:'Engajamento'},
          {icon:'📊', task:'Verificar métricas da semana anterior', type:'Análise'},
          {icon:'🎯', task:'Checar novos leads captados pelo ManyChat', type:'Leads'},
          {icon:'🤝', task:'Interagir com 10 perfis do público-alvo', type:'Prospecção'},
        ].map((item,i)=>`
          <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--r-sm);cursor:pointer;transition:.1s"
            onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='transparent'">
            <input type="checkbox" style="accent-color:var(--gold);width:15px;height:15px;cursor:pointer">
            <span style="font-size:16px">${item.icon}</span>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:600;color:var(--text)">${item.task}</div>
            </div>
            <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:99px;background:var(--surface3);color:var(--text3)">${item.type}</span>
          </label>`).join('')}
      </div>
    </div>
  `;
}
