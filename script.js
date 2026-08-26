const SB_URL = 'https://chbfgkguxkdadnevqthk.supabase.co'; 
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoYmZna2d1eGtkYWRuZXZxdGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTcxOTUsImV4cCI6MjEwMjg5MzE5NX0.hemyiyKpJXt7CvxReNOzX4AVajM7V_LHl0SOJNAutcw'; 
const sb = supabase.createClient(SB_URL, SB_KEY);

window.essentialBills = []; 

window.formatCurrency = function(i){ 
    let v = i.value.replace(/\D/g, ""); 
    v = (v/100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); 
    i.value = v === '$0.00' ? '' : v; 
};
window.parseVal = function(s) { return parseFloat(String(s).replace(/[$,]/g, "")) || 0; };

window.updateFreq = function() {
    document.getElementById('in-days').value = document.getElementById('in-freq').value;
    window.runCalc();
};

window.updateDaysFromDate = function() {
    const dateInput = document.getElementById('in-payday').value;
    if (!dateInput) return;
    const diff = Math.ceil((new Date(dateInput) - new Date()) / (1000*60*60*24));
    if (diff >= 0) { document.getElementById('in-days').value = diff; window.runCalc(); }
};

window.addEssentialBill = function() {
    const n = document.getElementById('bill-item-name').value;
    const a = parseVal(document.getElementById('bill-item-amt').value);
    const f = document.getElementById('bill-item-freq').value;
    if(!n || !a) return;
    window.essentialBills.push({name: n, amt: a, freq: f});
    document.getElementById('bill-item-name').value = '';
    document.getElementById('bill-item-amt').value = '';
    updateFrictionBox();
    renderEssentials();
    window.runCalc();
};

window.removeEssentialBill = function(i) {
    window.essentialBills.splice(i, 1);
    updateFrictionBox();
    renderEssentials();
    window.runCalc();
};

function updateFrictionBox() {
    const total = window.essentialBills.reduce((acc, curr) => {
        return acc + (curr.amt * parseFloat(curr.freq));
    }, 0);
    document.getElementById('in-bills').value = '$' + total.toLocaleString(undefined, {minimumFractionDigits: 2});
}

function renderEssentials() {
    const list = document.getElementById('essentials-list');
    list.innerHTML = '';
    window.essentialBills.forEach((b, i) => {
        const freqText = b.freq == "1" ? "Mo" : b.freq == "4" ? "Wk" : "Bi-Wk";
        list.innerHTML += `<div class="stack-row"><span>${b.name} (${freqText})</span><div style="display:flex; align-items:center;"><span>$${b.amt.toLocaleString()}</span><span class="remove-btn" onclick="window.removeEssentialBill(${i})">×</span></div></div>`;
    });
}

window.runCalc = function() {
  const inc = parseVal(document.getElementById('in-income').value); 
  const bill = parseVal(document.getElementById('in-bills').value);
  const yearly = parseVal(document.getElementById('in-annual').value);
  const days = +document.getElementById('in-days').value || 14;
  const stateMultiplier = parseFloat(document.getElementById('in-state').value);
  const isCushionOn = document.getElementById('cushion-toggle').checked;
  const cushionPercent = parseFloat(document.getElementById('cushion-percent').value);

  let safe = inc - bill;
  if (isCushionOn) {
      const cushionAmt = safe * cushionPercent;
      document.getElementById('val-cushion').innerText = '$' + cushionAmt.toLocaleString(undefined, {minimumFractionDigits: 2});
      safe = safe - cushionAmt;
  } else {
      document.getElementById('val-cushion').innerText = '$0.00';
  }

  const burn = safe / days;
  document.getElementById('display-safe').innerText = '$' + safe.toLocaleString(undefined, {minimumFractionDigits: 2});
  const statusT = document.getElementById('status-text'); const card = document.getElementById('main-card');
  statusT.innerText = 'Daily Limit: $' + burn.toFixed(2);
  
  card.classList.remove('halo-green', 'halo-yellow', 'halo-red');
  if (burn > (100 * stateMultiplier)) { statusT.style.color="var(--green)"; card.classList.add('halo-green'); }
  else if (burn > (40 * stateMultiplier)) { statusT.style.color="var(--amber)"; card.classList.add('halo-yellow'); }
  else { statusT.style.color="var(--red)"; card.classList.add('halo-red'); }

  const ratio = (bill * 12 / (yearly || 1)) * 100;
  const bar = document.getElementById('ratio-bar');
  const label = document.getElementById('ratio-label');
  const msg = document.getElementById('ratio-msg');
  if(bar && msg) {
      bar.style.width = Math.min(100, ratio * 2) + "%";
      if(ratio < 20) { bar.style.background = "var(--green)"; label.innerText = "Ratio: " + ratio.toFixed(1) + "% (Elite)"; msg.innerText = "Status: Secure."; msg.style.color = "var(--green)"; }
      else if(ratio < 40) { bar.style.background = "var(--amber)"; label.innerText = "Ratio: " + ratio.toFixed(1) + "% (Stable)"; msg.innerText = "Status: Caution."; msg.style.color = "var(--amber)"; }
      else { bar.style.background = "var(--red)"; label.innerText = "Ratio: " + ratio.toFixed(1) + "% (Heavy)"; msg.innerText = "Status: Overburdened."; msg.style.color = "var(--red)"; }
  }
};

window.openAuth = function(mode) {
  window.currentMode = mode; const isSign = mode === 'signin';
  document.getElementById('auth-content').innerHTML = `<h2 style="font-size: 36px; font-weight: 950; letter-spacing: -2px;">${isSign ? 'Welcome Back' : 'Join ClearSpend'}</h2><p style="color: var(--muted); margin-bottom: 30px;">${isSign ? 'Access your private vault.' : 'Sync your profile to the cloud.'}</p><input type="email" id="auth-email" placeholder="name@email.com"><div style="text-align: left;"><label class="input-label">${isSign ? 'Enter Password' : 'Create Password'}</label></div><input type="password" id="auth-password" placeholder="Min. 6 characters"><button class="btn-primary" style="width: 100%;" onclick="handleAuth('${mode}')">${isSign ? 'Sign In' : 'Create Account'}</button><div style="margin-top: 20px; font-weight: 800; color: var(--indigo); cursor: pointer;" onclick="openAuth('${isSign ? 'signup' : 'signin'}')">${isSign ? 'Need an account? Join Free' : 'Already have an account? Sign In'}</div><button class="btn-secondary" style="margin-top: 15px; width: 100%; font-size: 13px;" onclick="closeAuth()">Cancel</button>`;
  document.getElementById('auth-modal').style.display = 'flex';
}
window.closeAuth = function() { document.getElementById('auth-modal').style.display = 'none'; }

window.handleAuth = async function(mode) {
  const email = document.getElementById('auth-email').value; const password = document.getElementById('auth-password').value;
  const { error } = mode === 'signin' ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password });
  if(error) alert(error.message); else location.reload();
}

window.saveToCloud = async function() {
  const btn = document.getElementById('sync-btn');
  btn.innerText = "Syncing...";
  const { data: { user } } = await sb.auth.getUser(); if(!user) { openAuth('signup'); return; }
  const updates = { id: user.id, income: parseVal(document.getElementById('in-income').value), bills: parseVal(document.getElementById('in-bills').value), data_vault: { cushion: document.getElementById('cushion-toggle').checked, cushionPercent: document.getElementById('cushion-percent').value, annual: parseVal(document.getElementById('in-annual').value), essentials: window.essentialBills, state: document.getElementById('in-state').value }, updated_at: new Date() };
  const { error } = await sb.from('profiles').upsert(updates);
  if(!error) { 
      btn.innerText = "Vault Saved ✓"; 
      btn.classList.add('success-green'); 
      setTimeout(() => { btn.innerText = "Secure Sync"; btn.classList.remove('success-green'); }, 3000); 
  }
}

window.checkUser = async function() {
  const { data: { user } } = await sb.auth.getUser();
  if(user) {
    document.getElementById('nav-auth').innerHTML = `<div id="plan-badge" class="status-badge">...</div><span style="font-size:14px;font-weight:800;">${user.email}</span><button style="background:none;font-size:12px;margin-left:10px;" onclick="sb.auth.signOut().then(()=>location.reload())">Sign Out</button>`;
    const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
    if(profile) {
      document.getElementById('plan-badge').style.display = 'block'; document.getElementById('plan-badge').innerText = profile.plan;
      if(profile.plan === 'PRO' || profile.plan === 'STARTER') {
          document.getElementById('starter-cushion').classList.add('unlocked');
          document.getElementById('essentials-box').classList.add('unlocked');
          document.getElementById('freq-lock').style.display = 'none';
      }
      if(profile.plan === 'PRO') { document.getElementById('annual-box').classList.add('unlocked'); }
      document.getElementById('in-income').value = profile.income ? '$'+profile.income.toLocaleString() : '';
      document.getElementById('in-bills').value = profile.bills ? '$'+profile.bills.toLocaleString() : '';
      if(profile.data_vault) { 
          document.getElementById('cushion-toggle').checked = profile.data_vault.cushion || false; 
          document.getElementById('cushion-percent').value = profile.data_vault.cushionPercent || "0.10";
          document.getElementById('in-annual').value = profile.data_vault.annual ? '$'+profile.data_vault.annual.toLocaleString() : '';
          document.getElementById('in-state').value = profile.data_vault.state || "1.0";
          window.essentialBills = profile.data_vault.essentials || [];
          renderEssentials();
      }
      window.runCalc();
    }
  }
}
window.runCalc(); window.checkUser();
