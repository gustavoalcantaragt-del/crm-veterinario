/* ── Geradores ── */
const uid      = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const today    = () => new Date().toISOString().slice(0,10);

/* ── Formatação ── */
const fmtDate  = d => { if(!d) return '—'; const p=d.slice(0,10).split('-'); return `${p[2]}/${p[1]}/${p[0].slice(2)}`; };
const fmtMoney = v => v ? `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:0})}` : '—';
const initials = n => (n||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
const strColor = s => { let h=0; for(let i=0;i<s.length;i++) h=s.charCodeAt(i)+((h<<5)-h); return `hsl(${h%360},55%,50%)`; };

/* ── Segurança ── */
const esc       = s => { const d=document.createElement('div'); d.textContent=s??''; return d.innerHTML; };
const stripTags = s => s.replace(/<[^>]*>/g,'');
const validEmail= s => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/* ── Busca com destaque ── */
function highlightText(text, q){
  const safe = esc(text);
  if(!q || !text) return safe;
  const idx = safe.toLowerCase().indexOf(esc(q).toLowerCase());
  if(idx === -1) return safe;
  const qLen = esc(q).length;
  return safe.slice(0,idx) +
    `<mark style="background:rgba(212,175,55,.3);color:var(--gold);border-radius:2px;padding:0 1px">${safe.slice(idx, idx+qLen)}</mark>` +
    safe.slice(idx+qLen);
}

/* ── Performance ── */
function debounce(fn, ms){ let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }

/* ── UI: Toast, Loading, Modais ── */
function toast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

function showError(msg){ toast('❌ ' + msg); console.error(msg); }

/* ── Validação de formulários ── */
function validateForm(checks){
  for(const [val, msg] of checks){
    const empty = !val || (typeof val === 'string' && !val.trim());
    if(empty){ toast('⚠️ ' + msg); return false; }
  }
  return true;
}

/* ── Loading state em botões ── */
async function withLoading(btn, fn){
  if(!btn){ await fn(); return; }
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.style.opacity = '.65';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13" style="animation:spin .7s linear infinite"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg> Salvando…`;
  try { await fn(); }
  finally { btn.disabled = false; btn.style.opacity = ''; btn.innerHTML = orig; }
}

/* ── Modal de confirmação genérico ── */
function showConfirm({ title = 'Confirmar', msg = '', confirmText = 'Confirmar', danger = false, onConfirm }){
  let modal = document.getElementById('mo-confirm');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'mo-confirm';
    modal.className = 'mo';
    modal.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-hd">
          <div>
            <h3 id="mo-confirm-title" style="font-size:16px"></h3>
            <p id="mo-confirm-msg" style="color:var(--text3);font-size:13px;margin-top:5px;line-height:1.5"></p>
          </div>
          <button class="modal-close" onclick="closeMo('mo-confirm')">
            <svg viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-ft">
          <button class="btn" onclick="closeMo('mo-confirm')">Cancelar</button>
          <button class="btn" id="mo-confirm-btn" style="font-weight:700"></button>
        </div>
      </div>`;
    modal.addEventListener('click', e => { if(e.target === modal) closeMo('mo-confirm'); });
    document.body.appendChild(modal);
  }
  document.getElementById('mo-confirm-title').textContent = title;
  document.getElementById('mo-confirm-msg').textContent = msg;
  const btn = document.getElementById('mo-confirm-btn');
  btn.textContent = confirmText;
  btn.style.cssText = `font-weight:700;background:${danger ? 'var(--red)' : 'var(--gold)'};color:${danger ? '#fff' : '#000'};border-color:${danger ? 'var(--red)' : 'transparent'}`;
  btn.onclick = async () => { closeMo('mo-confirm'); await onConfirm(); };
  openMo('mo-confirm');
}

/* ── Modal de input genérico (substitui prompt()) ── */
function showInputModal({ title = 'Editar', label = 'Valor', placeholder = '', value = '', onConfirm }){
  let modal = document.getElementById('mo-input');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'mo-input';
    modal.className = 'mo';
    modal.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-hd">
          <h3 id="mo-input-title" style="font-size:16px"></h3>
          <button class="modal-close" onclick="closeMo('mo-input')">
            <svg viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="card-body" style="padding:0 20px 16px">
          <label id="mo-input-label" style="font-size:12px;color:var(--text3);display:block;margin-bottom:6px"></label>
          <input id="mo-input-field" class="input" style="width:100%" />
        </div>
        <div class="modal-ft">
          <button class="btn" onclick="closeMo('mo-input')">Cancelar</button>
          <button class="btn btn-gold" id="mo-input-btn" style="font-weight:700">Salvar</button>
        </div>
      </div>`;
    modal.addEventListener('click', e => { if(e.target === modal) closeMo('mo-input'); });
    document.body.appendChild(modal);
  }
  document.getElementById('mo-input-title').textContent = title;
  document.getElementById('mo-input-label').textContent = label;
  const field = document.getElementById('mo-input-field');
  field.placeholder = placeholder;
  field.value = value;
  const btn = document.getElementById('mo-input-btn');
  btn.onclick = async () => {
    const v = field.value.trim();
    if(!v){ toast('⚠️ Campo obrigatório'); return; }
    closeMo('mo-input');
    await onConfirm(v);
  };
  field.onkeydown = e => { if(e.key === 'Enter') btn.click(); };
  openMo('mo-input');
  setTimeout(() => field.focus(), 80);
}

function showLoading(show){
  let el = document.getElementById('loading-overlay');
  if(!el){
    el=document.createElement('div');
    el.id='loading-overlay';
    el.style.cssText='position:fixed;inset:0;background:rgba(7,7,11,.85);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px';
    el.innerHTML='<div style="width:40px;height:40px;border:3px solid rgba(212,175,55,.2);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite"></div><div style="font-size:13px;color:var(--text2)">Carregando dados…</div>';
    document.body.appendChild(el);
  }
  el.style.display = show ? 'flex' : 'none';
}

function openMo(id){ document.getElementById(id).classList.add('open'); }
function closeMo(id){ document.getElementById(id).classList.remove('open'); }

/* ── Fecha modal ao clicar no overlay ── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.mo').forEach(mo => {
    mo.addEventListener('click', e => { if(e.target===mo) mo.classList.remove('open'); });
  });
});
