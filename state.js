/* ── Dados carregados do Supabase ── */
let funnels       = [];
let leads         = [];
let tasks         = [];
let mentorships   = [];
let estagiarioObs = '';

/* ── IDs de seleção / edição ativos ── */
let activeFunnelId      = null;
let activeLeadId        = null;
let editingLeadId       = null;
let movingLeadId        = null;
let editingFunnelId     = null;
let editingTaskId       = null;
let editingMentorshipId = null;

/* ── UI state ── */
let mfColor     = PALETTE[0]; // cor selecionada no modal de funil
let tableFilter = 'all';
let tableSearch = '';
let tempStages  = [];
let currentPage = 'dashboard';

/* ── Filtros avançados de Leads ── */
let leadsFilters = { origin:'', status:'', followup:'', vet:'' };

/* ── Aba ativa de Mentorias ── */
let mentoriasTab = 'visao-geral';

/* ── Cache e filtros da tela de Usuários ── */
let _usuariosCache      = [];
let _usuariosSearch     = '';
let _usuariosRoleFilter = 'all';

/* ── Lookups rápidos ── */
const getFunnel = id => funnels.find(f => f.id === id);
const getLead   = id => leads.find(l => l.id === id);
