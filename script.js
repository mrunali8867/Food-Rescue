// ══════════════════════════════════
//   script.js — Food Rescue
// ══════════════════════════════════


// ── DARK MODE TOGGLE ──
document.getElementById('darkToggle').addEventListener('click', function () {
  document.body.classList.toggle('dark');
  this.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});


// ── SIGN IN ──
document.getElementById('btnSignIn').addEventListener('click', function () {
  alert('Sign In clicked!\nTODO: Connect to Supabase auth.');
});


// ── SIGN UP ──
document.getElementById('btnSignUp').addEventListener('click', function () {
  alert('Sign Up clicked!\nTODO: Connect to Supabase signup.');
});


// ── DONATE NOW ──
document.getElementById('btnDonate').addEventListener('click', function () {
  alert('Donate Now clicked!\nTODO: Add your donation flow here.');
});


// ── SMOOTH SCROLL for nav links ──
document.querySelectorAll('.nav-links a').forEach(function (link) {
  link.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});
