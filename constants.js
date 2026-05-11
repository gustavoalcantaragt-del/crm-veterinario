/* ── Paletas de cor ── */
const PALETTE = ['#d4af37','#2563eb','#7c3aed','#d97706','#059669','#e11d48','#0891b2','#c4603a','#4f46e5','#f97316'];
const STAGE_COLORS = ['#2563eb','#7c3aed','#d97706','#059669','#e11d48','#0891b2','#c4603a','#4f46e5','#d4af37','#f97316'];

/* ── Mapa de origens ── */
const ORIGIN_MAP = {
  ig_comentario:{l:'IG Comentário',    icon:'💬',c:'#e1306c',bg:'rgba(225,48,108,.12)', group:'instagram'},
  ig_seguidor:  {l:'IG Seguidor/Anúncio',icon:'📢',c:'#a855f7',bg:'rgba(168,85,247,.12)',group:'instagram'},
  whatsapp:     {l:'WhatsApp',          icon:'📱',c:'#22c55e',bg:'rgba(34,197,94,.12)',  group:'whatsapp'},
  indicacao:    {l:'Indicação',         icon:'🤝',c:'#06b6d4',bg:'rgba(6,182,212,.12)',  group:'frio'},
  organico:     {l:'Orgânico',          icon:'🌱',c:'#4ade80',bg:'rgba(74,222,128,.10)', group:'frio'},
  evento:       {l:'Evento',            icon:'🎪',c:'#f97316',bg:'rgba(249,115,22,.10)', group:'frio'},
  site:         {l:'Site',              icon:'🌐',c:'#3b82f6',bg:'rgba(59,130,246,.10)', group:'outro'},
  email:        {l:'E-mail',            icon:'✉️',c:'#d4af37',bg:'rgba(212,175,55,.10)', group:'outro'},
  linkedin:     {l:'LinkedIn',          icon:'💼',c:'#0891b2',bg:'rgba(8,145,178,.10)',  group:'outro'},
  outro:        {l:'Outro',             icon:'💬',c:'#8a8680',bg:'rgba(138,134,128,.10)',group:'outro'}
};

/* ── Controle de acesso por role ── */
const ROLE_PAGES = {
  admin:      ['dashboard','kanban','leads-list','funnels-cfg','etiquetas','automacoes','reports','tarefas','thiago','abordagem','configuracoes','usuarios'],
  dev:        ['dashboard','kanban','leads-list','funnels-cfg','etiquetas','automacoes','reports','tarefas','thiago','abordagem','configuracoes','usuarios'],
  estagiario: ['dashboard','kanban','leads-list','funnels-cfg','reports','tarefas','abordagem','configuracoes'],
  marketing:  ['dashboard','leads-list','reports','configuracoes'],
};
const ROLE_COLORS = { admin:'#2d9d8f', estagiario:'#a855f7', dev:'#3b82f6', marketing:'#f97316' };
const ROLE_LABELS = { admin:'ADMIN', estagiario:'ESTAGIÁRIO', dev:'DEV', marketing:'MARKETING' };
const ROLE_EDIT   = { admin:true, dev:true, estagiario:true, marketing:false };
const ROLE_DELETE = { admin:true, dev:true, estagiario:true, marketing:false };
