/* ── Load all data from Supabase ── */
async function loadAll() {
  if(!currentUser){ initAuth(); return; }
  updateUIForUser();
  showLoading(true);
  try {
    const [f, l, t, m, s] = await dbLoadAll();
    if(f.error) throw f.error;
    if(l.error) throw l.error;
    if(t.error) throw t.error;
    if(m.error) throw m.error;

    funnels     = (f.data||[]).map(mapFunnel);
    leads       = (l.data||[]).map(mapLead);
    tasks       = (t.data||[]).map(mapTask);
    mentorships = (m.data||[]).map(mapMentorship);
    estagiarioObs = s.data?.find(x=>x.key==='estagiario_obs')?.value || '';

    if(funnels.length > 0) activeFunnelId = funnels[0].id;

    showLoading(false);
    renderSidebar();
    const firstPage = (ROLE_PAGES[currentUser.role]||['dashboard'])[0];
    showPage(firstPage);
  } catch(e) {
    showLoading(false);
    console.error(e);
    showError('Erro ao conectar com o banco de dados: ' + e.message);
  }
}

/* ── DB → JS mappers ── */
function mapFunnel(r){ return { id:r.id, name:r.name, icon:r.icon||'📋', color:r.color||'#d4af37', stages:r.stages||[] }; }

function mapLead(r){ return {
  id:r.id, name:r.name, email:r.email||'', phone:r.phone||'', instagram:r.instagram||'',
  company:r.company||'', origin:r.origin||'ig_comentario', isVet:r.is_vet!==false,
  funnelId:r.funnel_id, stageId:r.stage_id,
  value:r.value||0, tags:r.tags||[], notes:r.notes||'',
  followUp:r.follow_up||'', converted:r.converted||false,
  convertedDate:r.converted_date||'', serviceMonths:r.service_months||0,
  activities:r.activities||[], date:r.date||today()
}; }

function mapTask(r){ return { id:r.id, title:r.title, desc:r.description||'', priority:r.priority||'media', status:r.status||'pendente', deadline:r.deadline||'', createdAt:r.created_at }; }

function mapMentorship(r){ return { id:r.id, client:r.client, type:r.type||'Mentoria Individual', hoursPerSession:r.hours_per_session||1, sessionsPerWeek:r.sessions_per_week||1, totalWeeks:r.total_weeks||4, startDate:r.start_date||'', endDate:r.end_date||'', active:r.active!==false, value:r.value||0, notes:r.notes||'', scheduleType:r.schedule_type||'nenhuma', scheduleDayOfWeek:r.schedule_day_of_week||null, scheduleDayOfMonth:r.schedule_day_of_month||null, scheduleIntervalDays:r.schedule_interval_days||null, scheduleSessions:r.schedule_sessions||[] }; }

/* ── JS → DB mappers ── */
function leadToDb(l){ return {
  name:l.name, email:l.email||null, phone:l.phone||null, instagram:l.instagram||null,
  company:l.company||null, origin:l.origin, is_vet:l.isVet,
  funnel_id:l.funnelId||null, stage_id:l.stageId||null,
  value:l.value||0, tags:l.tags||[], notes:l.notes||null,
  follow_up:l.followUp||null, converted:l.converted||false,
  converted_date:l.convertedDate||null, service_months:l.serviceMonths||0,
  activities:l.activities||[], date:l.date||today()
}; }

function taskToDb(t){ return { title:t.title, description:t.desc||null, priority:t.priority, status:t.status, deadline:t.deadline||null }; }

function mentorshipToDb(m){ return { client:m.client, type:m.type, hours_per_session:m.hoursPerSession, sessions_per_week:m.sessionsPerWeek, total_weeks:m.totalWeeks, start_date:m.startDate||null, end_date:m.endDate||null, active:m.active, value:m.value||0, notes:m.notes||null, schedule_type:m.scheduleType||'nenhuma', schedule_day_of_week:m.scheduleDayOfWeek||null, schedule_day_of_month:m.scheduleDayOfMonth||null, schedule_interval_days:m.scheduleIntervalDays||null, schedule_sessions:m.scheduleSessions||[] }; }
