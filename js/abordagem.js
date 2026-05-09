/* ── Abordagem — Helpers & Scripts ── */

const _debouncedAbordagemTable = debounce(() => renderAbordagemTable(), 280);

function getPerfil(l){
  const f = getFunnel(l.funnelId);
  if(!f) return null;
  const name = f.name.toLowerCase();
  if(name.includes('gestor')) return 'gestor';
  if(name.includes('autôn') || name.includes('auton')) return 'autonomo';
  return null;
}

function getRecencia(dateStr){
  if(!dateStr) return 'frio';
  const d = new Date(dateStr+'T00:00:00');
  const days = Math.floor((new Date() - d) / 86400000);
  if(days <= 90)  return 'quente';
  if(days <= 240) return 'morno';
  return 'frio';
}

function getGenero(tags){
  const t = (tags||[]).join(' ').toLowerCase();
  if(t.includes('feminino') || t.includes('dra') || t.includes('mulher')) return 'feminino';
  if(t.includes('masculino') || t.includes('dr.') || t.includes('homem')) return 'masculino';
  return 'neutro';
}

function detectGeneroByName(name){
  if(!name) return 'neutro';
  const first = name.trim().split(' ')[0].toLowerCase();
  const fem = ['ana','maria','julia','júlia','camila','fernanda','beatriz','larissa','amanda','leticia','letícia','carolina','patricia','patrícia','gabriela','rafaela','bruna','carla','claudia','cláudia','daniela','elaine','fabiana','giovanna','helena','isabela','jessica','jéssica','karen','luana','mariana','natalia','natália','priscila','roberta','sabrina','simone','tatiana','vanessa','viviane','yasmin','aline','alice','andressa','bianca','cristiane','daiane','edna','flavia','flávia','gisele','ingrid','joyce','kathleen','livia','lívia','lorena','luiza','marcela','milena','miriam','nathalia','nathália','pamela','pâmela','raquel','renata','silvia','sílvia','tais','taís','tania','tânia','vera','wanessa'];
  const masc = ['joao','joão','pedro','carlos','paulo','marcos','lucas','rafael','thiago','rodrigo','felipe','eduardo','gustavo','sergio','sérgio','daniel','bruno','fernando','andre','andré','leandro','marcelo','roberto','fabio','fábio','william','diego','mateus','matheus','alan','alex','anderson','antonio','antônio','caio','cesar','césar','christian','claudio','cláudio','davi','denis','emerson','erick','eric','evandro','francisco','gabriel','geraldo','gilberto','igor','ivan','jorge','jose','josé','julio','júlio','leonardo','luiz','luis','manuel','marcio','márcio','mario','mário','nelson','nilton','oscar','pablo','patrick','renan','renato','ricardo','ronaldo','ruan','samuel','tiago','vinicius','vinícius','wagner','wellinton','wellington','wilson','yuri'];
  if(fem.includes(first)) return 'feminino';
  if(masc.includes(first)) return 'masculino';
  return 'neutro';
}

function buildWhatsAppLink(phone, text){
  if(!phone) return null;
  const num = phone.replace(/\D/g,'');
  if(num.length < 11) return null;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function getScript(l){
  const perfil   = getPerfil(l);
  const recencia = getRecencia(l.date);
  const genero   = getGenero(l.tags) !== 'neutro'
                   ? getGenero(l.tags)
                   : detectGeneroByName(l.name);

  const firstName = (l.name||'Lead').split(' ')[0];

  const saudacao = {
    feminino:  `Olá, Dra. ${firstName}!`,
    masculino: `Olá, Dr. ${firstName}!`,
    neutro:    `Olá, ${firstName}!`,
  }[genero] || `Olá, ${firstName}!`;

  const contextoRecencia = {
    quente: `Notei que você adquiriu recentemente o kit de precificação do Thiago Alemão`,
    morno:  `Você adquiriu o kit de precificação do Thiago Alemão há alguns meses`,
    frio:   `Há algum tempo você adquiriu o kit de precificação do Thiago Alemão`,
  }[recencia];

  if(perfil === 'gestor'){
    const scripts = {
      feminino: `${saudacao}

Me chamo Wendell e faço parte da equipe do Thiago Alemão. ${contextoRecencia} e isso nos mostra que a gestão financeira da sua clínica é uma prioridade para você — o que é muito importante.

Gostaríamos de entender melhor como está sendo sua jornada à frente da clínica e apresentar algumas soluções que o Thiago tem desenvolvido especificamente para gestoras que buscam crescimento com mais estratégia e menos sobrecarga.

Teria alguns minutinhos para conversarmos esta semana?`,

      masculino: `${saudacao}

Me chamo Wendell e faço parte da equipe do Thiago Alemão. ${contextoRecencia} e isso nos mostra que a gestão financeira da sua clínica é uma prioridade — o que é essencial para quem lidera um negócio.

Gostaríamos de entender melhor como está sendo sua jornada à frente da clínica e apresentar algumas soluções que o Thiago tem desenvolvido especificamente para gestores que buscam crescimento com mais estratégia e menos sobrecarga.

Teria alguns minutinhos para conversarmos esta semana?`,

      neutro: `${saudacao}

Me chamo Wendell e faço parte da equipe do Thiago Alemão. ${contextoRecencia} e isso nos mostra que a gestão financeira da clínica é uma prioridade — o que é fundamental para quem está à frente de um negócio.

Gostaríamos de entender melhor como está sendo essa jornada e apresentar algumas soluções que o Thiago tem desenvolvido especificamente para gestores veterinários que buscam crescimento com mais estratégia.

Teria alguns minutinhos para conversarmos esta semana?`,
    };
    return scripts[genero] || scripts.neutro;
  }

  if(perfil === 'autonomo'){
    const scripts = {
      feminino: `${saudacao}

Me chamo Wendell e faço parte da equipe do Thiago Alemão. ${contextoRecencia} e isso nos mostra que você já está buscando caminhos para valorizar mais o seu trabalho — o que é muito importante para uma veterinária autônoma.

Gostaríamos de te apresentar algo que pode complementar muito bem o que você já tem em mãos e te ajudar a estruturar ainda mais a sua precificação e gestão financeira na prática.

Teria alguns minutinhos para conversarmos esta semana?`,

      masculino: `${saudacao}

Me chamo Wendell e faço parte da equipe do Thiago Alemão. ${contextoRecencia} e isso nos mostra que você já está buscando caminhos para valorizar mais o seu trabalho — o que é muito importante para um veterinário autônomo.

Gostaríamos de te apresentar algo que pode complementar muito bem o que você já tem em mãos e te ajudar a estruturar ainda mais a sua precificação e gestão financeira na prática.

Teria alguns minutinhos para conversarmos esta semana?`,

      neutro: `${saudacao}

Me chamo Wendell e faço parte da equipe do Thiago Alemão. ${contextoRecencia} e isso nos mostra que você já está buscando caminhos para valorizar mais o seu trabalho como veterinário(a) autônomo(a).

Gostaríamos de te apresentar algo que pode complementar muito bem o que você já tem em mãos e te ajudar a estruturar ainda mais a sua precificação e gestão financeira na prática.

Teria alguns minutinhos para conversarmos esta semana?`,
    };
    return scripts[genero] || scripts.neutro;
  }

  return `${saudacao}

Me chamo Wendell e faço parte da equipe do Thiago Alemão. ${contextoRecencia} e isso nos mostra que a gestão financeira é uma área de interesse para você.

Gostaríamos de entender melhor o seu momento atual e apresentar algumas soluções que podem fazer sentido para a sua realidade profissional.

Teria alguns minutinhos para conversarmos esta semana?`;
}

/* ── Script Global — estado persistente ── */

const SCRIPT_GLOBAL_DEFAULTS = {
  gestor: `Olá, {saudacao}!

Me chamo Wendell e faço parte da equipe do Thiago Alemão. {contexto} e isso nos mostra que a gestão financeira da sua clínica é uma prioridade para você.

Gostaríamos de entender melhor como está sendo sua jornada à frente da clínica e apresentar algumas soluções que o Thiago tem desenvolvido especificamente para gestores que buscam crescimento com mais estratégia e menos sobrecarga.

Teria alguns minutinhos para conversarmos esta semana?`,

  autonomo: `Olá, {saudacao}!

Me chamo Wendell e faço parte da equipe do Thiago Alemão. {contexto} e isso nos mostra que você já está buscando caminhos para valorizar mais o seu trabalho como veterinário(a) autônomo(a).

Gostaríamos de te apresentar algo que pode complementar o que você já tem em mãos e te ajudar a estruturar ainda mais sua precificação e gestão financeira na prática.

Teria alguns minutinhos para conversarmos esta semana?`,
};

let globalScripts = {
  gestor:   SCRIPT_GLOBAL_DEFAULTS.gestor,
  autonomo: SCRIPT_GLOBAL_DEFAULTS.autonomo,
};

function applyGlobalScript(l){
  const perfil = getPerfil(l);
  if(!perfil) return getScript(l);

  const template  = globalScripts[perfil] || SCRIPT_GLOBAL_DEFAULTS[perfil];
  const firstName = (l.name||'Lead').split(' ')[0];
  const genero    = getGenero(l.tags) !== 'neutro' ? getGenero(l.tags) : detectGeneroByName(l.name);
  const recencia  = getRecencia(l.date);

  const saudacao = genero === 'feminino' ? `Dra. ${firstName}`
                 : genero === 'masculino' ? `Dr. ${firstName}`
                 : firstName;

  const contextoMap = {
    quente: 'Notei que você adquiriu recentemente o kit de precificação do Thiago Alemão',
    morno:  'Você adquiriu o kit de precificação do Thiago Alemão há alguns meses',
    frio:   'Há algum tempo você adquiriu o kit de precificação do Thiago Alemão',
  };
  const contexto = contextoMap[recencia] || contextoMap.frio;

  return template
    .replace(/\{nome\}/gi, firstName)
    .replace(/\{saudacao\}/gi, saudacao)
    .replace(/\{contexto\}/gi, contexto)
    .replace(/\{perfil\}/gi, perfil === 'gestor' ? 'Gestor Veterinário' : 'Veterinário Autônomo');
}

/* ── Render ── */

function renderAbordagem(){
  const el = document.getElementById('abordagem-content');
  if(!el) return;

  const planilhaLeads = leads.filter(l=>
    (l.tags||[]).includes('planilha') &&
    l.phone && l.phone.replace(/\D/g,'').length >= 11
  );

  const gestores  = planilhaLeads.filter(l=>getPerfil(l)==='gestor');
  const autonomos = planilhaLeads.filter(l=>getPerfil(l)==='autonomo');
  const semPerfil = planilhaLeads.filter(l=>!getPerfil(l));

  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:16px">
      ${miniKpi('Total com WhatsApp', planilhaLeads.length, '#25d366','rgba(37,211,102,.1)')}
      ${miniKpi('Gestores', gestores.length, '#2563eb','rgba(37,99,235,.1)')}
      ${miniKpi('Autônomos', autonomos.length, '#059669','rgba(5,150,105,.1)')}
      ${miniKpi('Sem perfil', semPerfil.length, '#8a8680','rgba(138,134,128,.1)')}
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-hd" style="cursor:pointer" onclick="toggleScriptGlobal()">
        <div>
          <span class="card-title">✏️ Script Global de Abordagem</span>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">Edite uma vez — aplica em todos os leads automaticamente</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;background:rgba(45,157,143,.1);color:var(--gold);padding:2px 8px;border-radius:99px;font-weight:700">
            Variáveis: {nome} · {saudacao} · {contexto}
          </span>
          <svg id="script-global-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="transition:.2s"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div id="script-global-panel" style="display:none;border-top:1px solid var(--border);padding:16px 18px">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
          ${[
            ['{nome}',      'Primeiro nome do lead', '#3b82f6'],
            ['{saudacao}',  'Dra./Dr. + Nome (conforme gênero)', '#a855f7'],
            ['{contexto}',  'Referência ao kit (quente/morno/frio)', '#d4af37'],
            ['{perfil}',    'Gestor Veterinário ou Veterinário Autônomo', '#059669'],
          ].map(([v,d,c])=>`
            <div style="background:${c}12;border:1px solid ${c}30;border-radius:var(--r-sm);padding:5px 10px;font-size:10px">
              <span style="font-weight:800;color:${c};font-family:var(--mono)">${v}</span>
              <span style="color:var(--text3);margin-left:6px">${d}</span>
            </div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <label style="font-size:11px;font-weight:700;color:#2563eb;display:flex;align-items:center;gap:5px">
                <span>📊</span> Script — Gestores
              </label>
              <button onclick="resetScriptGlobal('gestor')" class="btn btn-sm btn-ghost" style="font-size:10px;padding:3px 8px">↺ Original</button>
            </div>
            <textarea id="global-script-gestor" rows="12"
              oninput="onGlobalScriptChange('gestor')"
              style="width:100%;background:var(--bg);border:1px solid rgba(37,99,235,.3);border-radius:var(--r-sm);padding:10px 12px;font-family:var(--font);font-size:12px;color:var(--text);outline:none;resize:vertical;line-height:1.7"
              onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='rgba(37,99,235,.3)'"
            >${globalScripts.gestor}</textarea>
            <div style="font-size:10px;color:var(--text3);margin-top:4px;font-family:var(--mono)" id="gs-count-gestor">${globalScripts.gestor.length} chars</div>
          </div>
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <label style="font-size:11px;font-weight:700;color:#059669;display:flex;align-items:center;gap:5px">
                <span>🩺</span> Script — Autônomos
              </label>
              <button onclick="resetScriptGlobal('autonomo')" class="btn btn-sm btn-ghost" style="font-size:10px;padding:3px 8px">↺ Original</button>
            </div>
            <textarea id="global-script-autonomo" rows="12"
              oninput="onGlobalScriptChange('autonomo')"
              style="width:100%;background:var(--bg);border:1px solid rgba(5,150,105,.3);border-radius:var(--r-sm);padding:10px 12px;font-family:var(--font);font-size:12px;color:var(--text);outline:none;resize:vertical;line-height:1.7"
              onfocus="this.style.borderColor='#059669'" onblur="this.style.borderColor='rgba(5,150,105,.3)'"
            >${globalScripts.autonomo}</textarea>
            <div style="font-size:10px;color:var(--text3);margin-top:4px;font-family:var(--mono)" id="gs-count-autonomo">${globalScripts.autonomo.length} chars</div>
          </div>
        </div>
        <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div style="font-size:11px;color:var(--text3)">
            💡 As edições atualizam automaticamente os links de WhatsApp de cada lead abaixo
          </div>
          <button onclick="aplicarScriptGlobal()" class="btn btn-sm btn-gold" style="font-weight:700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
            Aplicar em todos os leads visíveis
          </button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="padding:14px 18px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px">Filtrar:</span>
        <select id="ab-perfil" onchange="renderAbordagemTable()" style="width:auto;padding:5px 10px;font-size:12px">
          <option value="todos">👥 Todos os perfis</option>
          <option value="gestor">📊 Gestores</option>
          <option value="autonomo">🩺 Autônomos</option>
        </select>
        <select id="ab-recencia" onchange="renderAbordagemTable()" style="width:auto;padding:5px 10px;font-size:12px">
          <option value="todos">📅 Qualquer data</option>
          <option value="quente">🔥 Quentes (até 3 meses)</option>
          <option value="morno">🌡️ Mornos (3-8 meses)</option>
          <option value="frio">❄️ Frios (mais de 8 meses)</option>
        </select>
        <select id="ab-genero" onchange="renderAbordagemTable()" style="width:auto;padding:5px 10px;font-size:12px">
          <option value="todos">👤 Qualquer gênero</option>
          <option value="feminino">👩 Feminino</option>
          <option value="masculino">👨 Masculino</option>
          <option value="neutro">🧑 Não identificado</option>
        </select>
        <div style="margin-left:auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:var(--text3)">
            <input type="checkbox" id="ab-mostrar-abordados" onchange="renderAbordagemTable()" style="accent-color:var(--gold);cursor:pointer">
            Mostrar abordados
          </label>
          <div style="position:relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);width:12px;height:12px;stroke:var(--text3);pointer-events:none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="ab-search" placeholder="Buscar nome…" oninput="_debouncedAbordagemTable()"
              style="padding:5px 10px 5px 26px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);font-size:12px;font-family:var(--font);color:var(--text);outline:none;width:160px">
          </div>
        </div>
      </div>
    </div>

    <div id="ab-table-wrap"></div>
  `;

  renderAbordagemTable();
}

function renderAbordagemTable(){
  const wrap = document.getElementById('ab-table-wrap');
  if(!wrap) return;

  const perfil  = document.getElementById('ab-perfil')?.value  || 'todos';
  const recencia= document.getElementById('ab-recencia')?.value|| 'todos';
  const genero  = document.getElementById('ab-genero')?.value  || 'todos';
  const q       = (document.getElementById('ab-search')?.value || '').toLowerCase().trim();
  const mostrarAbordados = document.getElementById('ab-mostrar-abordados')?.checked || false;

  let filtered = leads.filter(l=>
    (l.tags||[]).includes('planilha') &&
    l.phone && l.phone.replace(/\D/g,'').length >= 11
  );

  if(!mostrarAbordados){
    filtered = filtered.filter(l=>!(l.tags||[]).includes('abordado'));
  }

  if(perfil   !== 'todos') filtered = filtered.filter(l=>getPerfil(l)===perfil);
  if(recencia !== 'todos') filtered = filtered.filter(l=>getRecencia(l.date)===recencia);
  if(genero   !== 'todos') filtered = filtered.filter(l=>{
    const g = getGenero(l.tags) !== 'neutro' ? getGenero(l.tags) : detectGeneroByName(l.name);
    return g === genero;
  });
  if(q) filtered = filtered.filter(l=>(l.name||'').toLowerCase().includes(q)||(l.phone||'').includes(q));

  if(!filtered.length){
    wrap.innerHTML=`<div class="empty"><div class="empty-icon">💬</div><p>Nenhum lead encontrado com esses filtros</p></div>`;
    return;
  }

  wrap.innerHTML = `
    <div style="font-size:11px;color:var(--text3);margin-bottom:8px;padding:0 2px">${filtered.length} lead${filtered.length!==1?'s':''} encontrado${filtered.length!==1?'s':''}</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${filtered.map(l=>{
        const script     = applyGlobalScript(l) || getScript(l);
        const rec        = getRecencia(l.date);
        const gen        = getGenero(l.tags) !== 'neutro' ? getGenero(l.tags) : detectGeneroByName(l.name);
        const perf       = getPerfil(l);
        const wlink      = script ? buildWhatsAppLink(l.phone, script) : null;
        const jaAbordado = (l.tags||[]).includes('abordado');

        return `<div class="card" style="overflow:visible;${jaAbordado?'opacity:.6':''}" id="card-${l.id}" data-lead-id="${l.id}">
          <div style="padding:14px 18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <div style="width:40px;height:40px;border-radius:50%;background:${strColor(l.name)};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0;position:relative">
              ${initials(l.name)}
              ${jaAbordado?`<div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px">✓</div>`:''}
            </div>
            <div style="flex:1;min-width:180px">
              <div style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px">
                ${l.name}
                ${jaAbordado?`<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:99px;background:rgba(34,197,94,.1);color:#22c55e">✅ Abordado</span>`:''}
              </div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px;font-family:var(--mono)">${l.phone||'—'}</div>
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">
              ${perf?`<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:${perf==='gestor'?'rgba(37,99,235,.1)':'rgba(5,150,105,.1)'};color:${perf==='gestor'?'#2563eb':'#059669'}">${({gestor:'📊 Gestor',autonomo:'🩺 Autônomo'})[perf]||perf}</span>`:''}
              <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;background:${{quente:'#ef4444',morno:'#d4af37',frio:'#3b82f6'}[rec]}18;color:${{quente:'#ef4444',morno:'#d4af37',frio:'#3b82f6'}[rec]}">${{quente:'🔥 Quente',morno:'🌡️ Morno',frio:'❄️ Frio'}[rec]||rec}</span>
              <span style="font-size:14px">${{feminino:'👩',masculino:'👨',neutro:'🧑'}[gen]||'🧑'}</span>
              ${l.date?`<span style="font-size:10px;color:var(--text3);font-family:var(--mono)">📅 ${l.date}</span>`:''}
            </div>
            <button onclick="toggleScript('${l.id}')" class="btn btn-sm btn-ghost">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Editar & Enviar
            </button>
          </div>

          <div id="script-${l.id}" style="display:none;border-top:1px solid var(--border);padding:16px 18px;background:var(--surface2)">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">
              <span style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px">✏️ Edite a mensagem — o link atualiza automaticamente</span>
              <button onclick="resetScript('${l.id}','${l.phone}')" class="btn btn-sm btn-ghost" style="font-size:10px">↺ Restaurar original</button>
            </div>
            <textarea
              id="textarea-${l.id}"
              oninput="updateWALink('${l.id}','${l.phone}')"
              rows="10"
              style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px;font-family:var(--font);font-size:13px;color:var(--text);outline:none;resize:vertical;line-height:1.8;transition:.15s"
              onfocus="this.style.borderColor='var(--gold)';this.style.boxShadow='0 0 0 3px rgba(212,175,55,.08)'"
              onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'"
            >${(script||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px">
              <span id="charcount-${l.id}" style="font-size:10px;color:var(--text3);font-family:var(--mono)">${(script||'').length} caracteres</span>
              <span style="font-size:10px;color:var(--text3)">WhatsApp recomenda até 1.000 caracteres para primeira mensagem</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
              <a id="walink-${l.id}" href="${wlink||'#'}" target="_blank"
                class="btn btn-sm"
                style="background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;border-color:transparent;font-weight:700;text-decoration:none;${wlink?'':'opacity:.4;pointer-events:none'}">
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Abrir WhatsApp
              </a>
              <button onclick="copyScript('${l.id}')" class="btn btn-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copiar
              </button>
              <button onclick="markAbordado('${l.id}')" class="btn btn-sm" style="margin-left:auto;background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.3);color:#22c55e;font-weight:700">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="20 6 9 17 4 12"/></svg>
                ✅ Marcar como Abordado
              </button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
}

/* ── Script Global — controles ── */

function toggleScriptGlobal(){
  const panel = document.getElementById('script-global-panel');
  const arrow = document.getElementById('script-global-arrow');
  if(!panel) return;
  const open = panel.style.display === 'none';
  panel.style.display = open ? '' : 'none';
  if(arrow) arrow.style.transform = open ? 'rotate(180deg)' : '';
}

function onGlobalScriptChange(perfil){
  const ta = document.getElementById('global-script-'+perfil);
  const cc = document.getElementById('gs-count-'+perfil);
  if(!ta) return;
  globalScripts[perfil] = ta.value;
  if(cc) cc.textContent = ta.value.length + ' chars';
  document.querySelectorAll('[data-lead-id]').forEach(card => {
    const id = card.dataset.leadId;
    const l  = getLead(id);
    if(!l || getPerfil(l) !== perfil) return;
    const ta2  = document.getElementById('textarea-'+id);
    const link = document.getElementById('walink-'+id);
    if(!ta2 || !link) return;
    const newText = applyGlobalScript(l);
    ta2.value = newText;
    const num = (l.phone||'').replace(/\D/g,'');
    if(num.length >= 11) link.href = `https://wa.me/${num}?text=${encodeURIComponent(newText)}`;
  });
}

function resetScriptGlobal(perfil){
  globalScripts[perfil] = SCRIPT_GLOBAL_DEFAULTS[perfil];
  const ta = document.getElementById('global-script-'+perfil);
  const cc = document.getElementById('gs-count-'+perfil);
  if(ta){ ta.value = globalScripts[perfil]; }
  if(cc){ cc.textContent = globalScripts[perfil].length + ' chars'; }
  onGlobalScriptChange(perfil);
  toast(`↺ Script de ${perfil === 'gestor' ? 'Gestores' : 'Autônomos'} restaurado!`);
}

function aplicarScriptGlobal(){
  ['gestor','autonomo'].forEach(p => {
    const ta = document.getElementById('global-script-'+p);
    if(ta) globalScripts[p] = ta.value;
  });
  renderAbordagemTable();
  toast('✅ Script global aplicado em todos os leads!');
}

function toggleScript(id){
  const el = document.getElementById('script-'+id);
  if(!el) return;
  const isHidden = el.style.display === 'none';
  el.style.display = isHidden ? '' : 'none';
  if(isHidden){
    const ta = document.getElementById('textarea-'+id);
    const cc = document.getElementById('charcount-'+id);
    if(ta && cc) cc.textContent = ta.value.length + ' caracteres';
  }
}

function updateWALink(id, phone){
  const ta   = document.getElementById('textarea-'+id);
  const link = document.getElementById('walink-'+id);
  const cc   = document.getElementById('charcount-'+id);
  if(!ta || !link) return;

  const text = ta.value;
  const num  = (phone||'').replace(/\D/g,'');

  if(cc){
    cc.textContent = text.length + ' caracteres';
    cc.style.color = text.length > 1000 ? 'var(--red)' : text.length > 800 ? '#d4af37' : 'var(--text3)';
  }

  if(num.length >= 11){
    link.href = `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
    link.style.opacity = '1';
    link.style.pointerEvents = 'auto';
  }
}

function resetScript(id, phone){
  const l  = getLead(id); if(!l) return;
  const ta = document.getElementById('textarea-'+id);
  if(!ta) return;
  ta.value = getScript(l) || '';
  updateWALink(id, phone);
  toast('Script restaurado!');
}

function copyScript(id){
  const ta = document.getElementById('textarea-'+id);
  const text = ta ? ta.value : (getScript(getLead(id))||'');
  if(!text) return;
  navigator.clipboard.writeText(text)
    .then(()=>toast('Mensagem copiada!'))
    .catch(()=>{
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast('Mensagem copiada!');
    });
}

/* ── Marcar como abordado ── */

async function markAbordado(leadId){
  const lead = getLead(leadId);
  if(!lead) return;

  const perfil = getPerfil(lead);
  const targetFunnel = funnels.find(f => {
    const n = f.name.toLowerCase();
    if(perfil === 'gestor')   return n.includes('gestor');
    if(perfil === 'autonomo') return n.includes('autôn') || n.includes('auton');
    return false;
  });

  let newStageId = lead.stageId;
  if(targetFunnel){
    const emContato = targetFunnel.stages.find(s =>
      s.name.toLowerCase().includes('contato') || s.name.toLowerCase().includes('em contato')
    ) || targetFunnel.stages[1];
    if(emContato) newStageId = emContato.id;
  }

  const newTags = [...new Set([...(lead.tags||[]), 'abordado'])];
  const newActivities = [...(lead.activities||[]), {
    text: `✅ Abordagem enviada via WhatsApp por ${currentUser?.name||'Wendell'}`,
    time: new Date().toISOString()
  }];

  const { error } = await dbUpdateLead(leadId, {
    tags: newTags,
    stage_id: newStageId,
    funnel_id: targetFunnel ? targetFunnel.id : lead.funnelId,
    activities: newActivities,
  });

  if(error){ showError(error.message); return; }

  lead.tags = newTags;
  lead.stageId = newStageId;
  if(targetFunnel) lead.funnelId = targetFunnel.id;
  lead.activities = newActivities;

  toast(`✅ ${lead.name} marcado como abordado — movido para "Em Contato"`);
  renderAbordagemTable();
  renderSidebar();
  invalidateLeadPages();
}
