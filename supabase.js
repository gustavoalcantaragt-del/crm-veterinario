/* ── Cliente Supabase ── */
const { createClient } = supabase;
const sb = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseKey);

/* ── Carga inicial (paralela) ── */
const dbLoadAll = () => Promise.all([
  sb.from('funnels').select('*').order('created_at'),
  sb.from('leads').select('*').order('created_at'),
  sb.from('tasks').select('*').order('created_at'),
  sb.from('mentorships').select('*').order('created_at'),
  sb.from('settings').select('*'),
]);

/* ── Leads ── */
const dbInsertLead      = data      => sb.from('leads').insert(data).select().single();
const dbUpdateLead      = (id,data) => sb.from('leads').update(data).eq('id', id);
const dbDeleteLead      = id        => sb.from('leads').delete().eq('id', id);

/* ── Funnels ── */
const dbInsertFunnel = data      => sb.from('funnels').insert(data).select().single();
const dbUpdateFunnel = (id,data) => sb.from('funnels').update(data).eq('id', id);
const dbDeleteFunnel = id        => sb.from('funnels').delete().eq('id', id);

/* ── Tasks ── */
const dbInsertTask  = data      => sb.from('tasks').insert(data).select().single();
const dbUpdateTask  = (id,data) => sb.from('tasks').update(data).eq('id', id);
const dbDeleteTask  = id        => sb.from('tasks').delete().eq('id', id);
const dbListTags    = ()        => sb.from('tags').select('*').order('category').order('name');
const dbInsertTag   = data      => sb.from('tags').insert(data).select().single();
const dbUpdateTag   = (id,data) => sb.from('tags').update(data).eq('id', id);
const dbDeleteTag   = id        => sb.from('tags').delete().eq('id', id);

/* ── Mentorships ── */
const dbInsertMentorship = data      => sb.from('mentorships').insert(data).select().single();
const dbUpdateMentorship = (id,data) => sb.from('mentorships').update(data).eq('id', id);
const dbDeleteMentorship = id        => sb.from('mentorships').delete().eq('id', id);

/* ── Settings ── */
const dbUpsertSetting = (key, value) => sb.from('settings').upsert({ key, value });

/* ── Perfis / Usuários ── */
const dbGetProfile       = uid      => sb.from('user_profiles').select('*').eq('id', uid).single();
const dbListProfiles     = ()       => sb.from('users_with_email').select('*').order('created_at');
const dbUpdateProfileRole = (id, role) => sb.from('user_profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id);
const dbUpdateProfileName = (id, name) => sb.from('user_profiles').update({ name, avatar: (name[0]||'?').toUpperCase(), updated_at: new Date().toISOString() }).eq('id', id);

/* ── Auth ── */
const dbGetSession = ()           => sb.auth.getSession();
const dbSignIn     = (email, pw)  => sb.auth.signInWithPassword({ email, password: pw });
const dbSignOut    = ()           => sb.auth.signOut();
