const SB_URL = 'https://chbfgkguxkdadnevqthk.supabase.co'; 
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoYmZna2d1eGtkYWRuZXZxdGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMTcxOTUsImV4cCI6MjEwMjg5MzE5NX0.hemyiyKpJXt7CvxReNOzX4AVajM7V_LHl0SOJNAutcw'; 
const sb = supabase.createClient(SB_URL, SB_KEY);

window.formatCurrency = function(i){ 
    let v = i.value.replace(/\D/g, ""); 
    v = (v/100).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); 
    i.value = v === '$0.00' ? '' : v; 
};
window.parseVal = function(s) { return parseFloat(String(s).replace(/[$,]/g, "")) || 0; };

window.runCalc = function() {
  const inc = parseVal(document.getElementById('in-income').value); 
  const bill = parseVal(document.getElementById('in-bills').value);
  const days = +document.getElementById('in-days').value || 14;
  
  const safe = inc - bill;
  const burn = safe / days;

  document.getElementById('display-safe').innerText = '$' + safe.toLocaleString(undefined, {minimumFractionDigits: 2});
  
  // FIXED: Shows 2 decimal places ($122.14)
  document.getElementById('status-text').innerText = 'Daily Limit: $' + burn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
  
  const card = document.getElementById('main-card');
  card.classList.remove('halo-green', 'halo-yellow', 'halo-red');
  if (burn > 100) { document.getElementById('status-text').style.color = "var(--green)"; card.classList.add('halo-green'); }
  else if (burn > 40) { document.getElementById('status-text').style.color = "var(--amber)"; card.classList.add('halo-yellow'); }
  else { document.getElementById('status-text').style.color = "var(--red)"; card.classList.add('halo-red'); }
};

window.openAuth = function(mode) {
  window.currentMode = mode;
  document.getElementById('auth-modal').style.display = 'flex';
  document.getElementById('auth-content').innerHTML = `<h2>${mode === 'signin' ? 'Welcome Back' : 'Join ClearSpend'}</h2><input type="email" id="auth-email" placeholder="Email"><input type="password" id="auth-password" placeholder="Password"><button class="btn-primary" onclick="handleAuth()">Continue</button><button class="btn-secondary" onclick="closeAuth()">Cancel</button>`;
};
window.closeAuth = () => document.getElementById('auth-modal').style.display = 'none';
window.handleAuth = async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const { error } = window.currentMode === 'signin' ? await sb.auth.signInWithPassword({ email, password }) : await sb.auth.signUp({ email, password });
  if(error) alert(error.message); else location.reload();
};

window.checkUser = async function() {
  const { data: { user } } = await sb.auth.getUser();
  if(user) {
    const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
    if(profile && profile.plan === 'PRO') {
        document.querySelectorAll('.pro-feat').forEach(el => el.classList.add('unlocked'));
    }
  }
};
window.runCalc(); window.checkUser();
