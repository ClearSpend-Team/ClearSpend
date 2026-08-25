const SB_URL = 'https://chbfgkguxkdadnevqthk.supabase.co'; 
const SB_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoYmZna2d1eGtkYWRuZXZxdGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTcxOTUsImV4cCI6MjEwMjg5MzE5NX0.hemyiyKpJXt7CvxReNOzX4AVajM7V_LHl0SOJNAutcw
const sb = supabase.createClient(SB_URL, SB_KEY);

let roadmapBills = []; let debtList = []; let committed = 0;

function formatCurrency(i){ 
    let v = i.value.replace(/\D/g, ""); 
    v = (v/100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); 
    i.value = v === '$0.00' ? '' : v; 
}

function parseVal(s) { return parseFloat(s.replace(/[$,]/g, "")) || 0; }

function updateFreq() { 
    document.getElementById('in-days').value = document.getElementById('in-freq').value; 
    runCalc(); 
}

function addDebt() {
    const n = document.getElementById('debt-name').value; 
    const a = parseVal(document.getElementById('debt-amt').value);
    if(!n || !a) return; 
    debtList.push({name:n, amt:a});
    document.getElementById('debt-name').value=''; 
    document.getElementById('debt-amt').value=''; 
    renderDebts(); runCalc();
}

function removeDebt(i) { debtList.splice(i, 1); renderDebts(); runCalc(); }

function renderDebts() {
    const list = document.getElementById('debt-list'); list.innerHTML = '';
    debtList.forEach((d, idx) => { 
        list.innerHTML += `<div class="data-row"><span>${d.name}: $${d.amt.toLocaleString()}</span><span class="remove-btn" onclick="removeDebt(${idx})">×</span></div>`; 
    });
}

function addBill() {
    const n = document.getElementById('bill-name').value; 
    const a = parseVal(document.getElementById('bill-amt').value); 
    const d = document.getElementById('bill-due').value;
    if(!n || !a || !d) return; 
    roadmapBills.push({name:n, amt:a, due:new Date(d), paid:[]});
    document.getElementById('bill-name').value=''; 
    document.getElementById('bill-amt').value=''; 
    renderRoadmap(); runCalc();
}

function removeBill(i) { roadmapBills.splice(i, 1); renderRoadmap(); runCalc(); }

function toggleB(bi, ci) { 
    const dateStr = new Date().toLocaleDateString('en-US', {month:'short',day:'numeric'});
    if(!roadmapBills[bi].paid.some(p => p.idx === ci)) roadmapBills[bi].paid.push({idx:ci, date:dateStr});
    else roadmapBills[bi].paid = roadmapBills[bi].paid.filter(p => p.idx !== ci);
    renderRoadmap(); runCalc(); 
}

function renderRoadmap() {
    const list = document.getElementById('roadmap-list'); list.innerHTML = ''; committed = 0;
    const freq = +document.getElementById('in-freq').value;
    const nextPay = new Date(document.getElementById('in-payday').value || new Date());
    roadmapBills.forEach((b, i) => {
        const days = Math.ceil((new Date(b.due) - new Date()) / (1000*60*60*24));
        const checks = Math.max(1, Math.floor(days/freq)+1); const slice = b.amt / checks;
        const paidCount = b.paid.length; const percent = (paidCount / checks) * 100;
        let color = percent < 34 ? 'var(--red)' : percent < 100 ? 'var(--amber)' : 'var(--green)';
        let bubbles = ''; for(let j=0; j<checks; j++) {
            const pInfo = b.paid.find(p => p.idx === j); if(pInfo) committed += slice;
            let bDate = new Date(nextPay); bDate.setDate(bDate.getDate() + (j * freq));
            bubbles += `<div class="bubble ${pInfo?'paid':''}" onclick="toggleB(${i},${j})">$${slice.toFixed(0)}${pInfo?`<span class="bubble-date">${pInfo.date}</span>`:''}</div>`;
        }
        list.innerHTML += `<div class="card" style="min-height:auto; margin-bottom:10px; padding:24px; border-left:10px solid ${color};"><div style="display:flex; justify-content:space-between"><b>${b.name} (Due in ${days} days)</b><span>Total: $${b.amt.toLocaleString()} <span class="remove-btn" onclick="removeBill(${i})">×</span></span></div><div class="bubble-row">${bubbles}</div></div>`;
    });
}

function runCalc() {
  const inc = parseVal(document.getElementById('in-income').value); 
  const bill = parseVal(document.getElementById('in-bills').value);
  const yearly = parseVal(document.getElementById('in-annual').value); 
  const days = +document.getElementById('in-days').value || 14;
  const stateB = +document.getElementById('in-state').value;
  const safe = (inc - bill) - committed; const burn = safe / days;
  document.getElementById('display-safe').innerText = '$' + safe.toLocaleString();
  const statusT = document.getElementById('status-text'); const card = document.getElementById('main-card');
  statusT.innerText = 'Daily Limit: $' + burn.toFixed(2);
  card.classList.remove('halo-green', 'halo-yellow', 'halo-red');
  if (burn > (100 * stateB)) { statusT.style.color="var(--green)"; card.classList.add('halo-green'); }
  else if (burn > (40 * stateB)) { statusT.style.color="var(--amber)"; card.classList.add('halo-yellow'); }
  else { statusT.style.color="var(--red)"; card.classList.add('halo-red'); }
  const totalDebt = debtList.reduce((acc, curr) => acc + curr.amt, 0);
  const ratio = (totalDebt / (yearly || 1)) * 100;
  const bar = document.getElementById('ratio-bar'); const label = document.getElementById('ratio-label');
  if(bar) { bar.style.width = Math.min(100, ratio*2) + "%"; bar.style.background = ratio < 15 ? 'var(--green)' : ratio < 40 ? 'var(--amber)' : 'var(--red)'; label.innerText = "Status: " + (ratio < 15 ? "Healthy" : ratio < 40 ? "Caution" : "Danger"); }
}

function openAuth(mode) {
  window.currentMode = mode;
  const isSign = mode === 'signin';
  document.getElementById('auth-content').innerHTML = `
    <h2 style="font-size: 36px; font-weight: 950; letter-spacing: -2px;">${isSign ? 'Welcome Back' : 'Join ClearSpend'}</h2>
    <p style="color: var(--muted); margin-bottom: 30px;">${isSign ? 'Access your private vault.' : 'Sync your profile to the cloud.'}</p>
    <input type="email" id="auth-email" placeholder="name@email.com">
    <div style="text-align: left;"><label class="input-label">${isSign ? 'Enter Password' : 'Create Password'}</label></div>
    <input type="password" id="auth-password" placeholder="Min. 6 characters">
    <button class="btn-primary" style="width: 100%;" onclick="handleAuth('${mode}')">${isSign ? 'Sign In' : 'Create Account'}</button>
    <div style="margin-top: 20px; font-weight: 800; color: var(--indigo); cursor: pointer;" onclick="openAuth('${isSign ? 'signup' : 'signin'}')">${isSign ? 'Need an account? Join Free' : 'Already have an account? Sign In'}</div>
    <button class="btn-secondary" style="margin-top: 15px; width: 100%; font-size: 13px;" onclick="closeAuth()">Cancel</button>
  `;
  document.getElementById('auth-modal').style.display = 'flex';
}
function closeAuth() { document.getElementById('auth-modal').style.display = 'none'; }

async function handleAuth(mode) {
  const email = document.getElementById('auth-email').value; const password = document.getElementById('auth-password').value;
  const { error } = mode === 'signin' ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password });
  if(error) alert(error.message); else location.reload();
}

async function saveToCloud() {
  const { data: { user } } = await sb.auth.getUser(); if(!user) { openAuth('signup'); return; }
  const updates = { id: user.id, income: parseVal(document.getElementById('in-income').value), bills: parseVal(document.getElementById('in-bills').value), data_vault: { bills: roadmapBills, debts: debtList }, updated_at: new Date() };
  await sb.from('profiles').upsert(updates); alert("Vault Synced!");
}

async function checkUser() {
  const { data: { user } } = await sb.auth.getUser();
  if(user) {
    document.getElementById('nav-auth').innerHTML = `<div id="plan-badge" class="status-badge">...</div><span style="font-size:14px;font-weight:800;">${user.email}</span><button style="background:none;font-size:12px;margin-left:10px;" onclick="sb.auth.signOut().then(()=>location.reload())">Sign Out</button>`;
    const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
    if(profile) {
      document.getElementById('plan-badge').style.display = 'block'; document.getElementById('plan-badge').innerText = profile.plan;
      if(profile.plan === 'PRO') document.querySelectorAll('.pro-feat, #annual-box').forEach(el => el.classList.add('unlocked'));
      if(profile.plan === 'STARTER' || profile.plan === 'PRO') { 
          const fl = document.getElementById('freq-lock'); if(fl) fl.style.display = 'none'; 
      }
      if(profile.data_vault) { roadmapBills = profile.data_vault.bills || []; debtList = profile.data_vault.debts || []; renderDebts(); renderRoadmap(); }
      runCalc();
    }
  }
}
runCalc(); checkUser();
