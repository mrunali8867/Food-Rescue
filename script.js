// script.js — Food Rescue (enhanced)
// Dark mode persistence, button handlers, smooth scroll, accessibility checks

// Utility: safe query
function $(selector){ return document.querySelector(selector); }
function $all(selector){ return Array.from(document.querySelectorAll(selector)); }

// ---------- Dark mode toggle with persistence ----------
const darkToggle = $('#darkToggle');
if (darkToggle) {
  // initialize from localStorage
  const saved = localStorage.getItem('foodrescue:dark');
  if (saved === 'true') document.body.classList.add('dark');

  // update icon on load
  darkToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';

  darkToggle.addEventListener('click', function () {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    this.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('foodrescue:dark', isDark ? 'true' : 'false');
    this.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  });
}

// ---------- Sign In / Sign Up / Donate placeholders ----------
const btnSignIn = $('#btnSignIn');
const btnSignUp = $('#btnSignUp');
const btnDonate = $('#btnDonate');

if (btnSignIn) {
  btnSignIn.addEventListener('click', function () {
    // TODO: Replace with real auth flow (Supabase / Firebase / custom)
    alert('Sign In clicked!\nTODO: Connect to Supabase auth.');
  });
}

if (btnSignUp) {
  btnSignUp.addEventListener('click', function () {
    // TODO: Replace with real signup flow
    alert('Sign Up clicked!\nTODO: Connect to Supabase signup.');
  });
}

if (btnDonate) {
  btnDonate.addEventListener('click', function () {
    // TODO: Replace with donation flow / payment integration
    alert('Donate Now clicked!\nTODO: Add your donation flow here.');
  });
}

// ---------- Smooth scroll for anchor links ----------
$all('.nav-links a').forEach(function (link) {
  link.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // update focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });
});

// ---------- Small accessibility improvements ----------
document.addEventListener('keydown', function (e) {
  // allow Esc to close any open modals in future (placeholder)
  if (e.key === 'Escape') {
    // closeModal(); // implement if you add modals
  }
});

// ---------- Defensive DOM-ready wrapper ----------
(function waitForDOM() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDOM);
    return;
  }
  // DOM ready — ensure nav buttons have aria labels
  if (btnSignIn) btnSignIn.setAttribute('aria-label', 'Sign in');
  if (btnSignUp) btnSignUp.setAttribute('aria-label', 'Sign up');
  if (btnDonate) btnDonate.setAttribute('aria-label', 'Donate now');
  if (darkToggle) darkToggle.setAttribute('aria-label', 'Toggle dark mode');
})();
