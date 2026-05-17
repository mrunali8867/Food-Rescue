// ============================================================
//  script.js  –  FoodRescue Frontend Logic  (FIXED)
//  Handles: modals, dark mode, fetch() calls to backend
// ============================================================

// FIX: Auto-detect the server URL so it works on both
// localhost AND your phone (same WiFi). No more hardcoding!
const API = window.location.origin;

// ════════════════════════════════════════════════════════════
//  DARK MODE TOGGLE
// ════════════════════════════════════════════════════════════
const darkToggle = document.getElementById('darkToggle');

if (localStorage.getItem('fr-dark') === 'true') {
  document.body.classList.add('dark');
  darkToggle.textContent = '☀️';
}

darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  darkToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('fr-dark', isDark);
});

// ════════════════════════════════════════════════════════════
//  STICKY NAV SHADOW
// ════════════════════════════════════════════════════════════
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 10 ? '0 4px 20px rgba(0,0,0,0.1)' : 'none';
});

// ════════════════════════════════════════════════════════════
//  MOBILE HAMBURGER MENU
// ════════════════════════════════════════════════════════════
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('nav-open');
    hamburger.textContent = navLinks.classList.contains('nav-open') ? '✕' : '☰';
  });

  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      navLinks.classList.remove('nav-open');
      hamburger.textContent = '☰';
    }
  });
}

// ════════════════════════════════════════════════════════════
//  SMOOTH SCROLL
// ════════════════════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href === '#browse') { e.preventDefault(); openBrowseModal(); return; }
    const target = document.querySelector(href);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ════════════════════════════════════════════════════════════
//  SCROLL REVEAL
// ════════════════════════════════════════════════════════════
const revealEls = document.querySelectorAll('.step, .stat, .card');
revealEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
});
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = [...entry.target.parentElement.children].indexOf(entry.target);
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, idx * 100);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// ════════════════════════════════════════════════════════════
//  ANIMATED STAT COUNTERS
// ════════════════════════════════════════════════════════════
const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const numEl  = entry.target.querySelector('.stat-num');
    const text   = numEl.textContent.trim();
    const isK    = text.includes('K');
    const rawNum = parseFloat(text.replace(/[^0-9.]/g, ''));
    numEl.innerHTML = '';
    const spanNum = Object.assign(document.createElement('span'), { className: 'counter-val' });
    const spanSuf = document.createElement('span');
    spanSuf.style.color = 'var(--orange)';
    numEl.append(spanNum, spanSuf);
    let count = 0;
    const timer = setInterval(() => {
      count += rawNum / (1400 / 16);
      if (count >= rawNum) { count = rawNum; clearInterval(timer); }
      spanNum.textContent = Math.floor(count) + (isK ? 'K' : '');
      spanSuf.textContent = '+';
    }, 16);
    statObserver.unobserve(entry.target);
  });
}, { threshold: 0.3 });
document.querySelectorAll('.stat').forEach(el => statObserver.observe(el));

// ════════════════════════════════════════════════════════════
//  MODAL UTILITY
// ════════════════════════════════════════════════════════════
function createModal(id, title, bodyHTML) {
  document.getElementById(id)?.remove();

  const overlay = document.createElement('div');
  overlay.id = id;
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" aria-label="Close">✕</button>
      <h2 class="modal-title">${title}</h2>
      ${bodyHTML}
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));

  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.classList.contains('modal-close')) closeModal(id);
  });
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') { closeModal(id); document.removeEventListener('keydown', escHandler); }
  });
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('active');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}

function setFormMsg(formEl, msg, isError = false) {
  let msgEl = formEl.querySelector('.form-msg');
  if (!msgEl) {
    msgEl = document.createElement('p');
    msgEl.className = 'form-msg';
    formEl.appendChild(msgEl);
  }
  msgEl.textContent = msg;
  msgEl.style.color = isError ? '#e05252' : '#2d6a4f';
}

// ════════════════════════════════════════════════════════════
//  NAV UPDATE AFTER SIGN IN / SIGN OUT
// ════════════════════════════════════════════════════════════
function updateNavAfterLogin() {
  const user = JSON.parse(sessionStorage.getItem('fr-user') || 'null');
  const btnSignIn  = document.getElementById('btnSignIn');
  const btnSignUp  = document.getElementById('btnSignUp');
  const btnDonate  = document.getElementById('btnDonate');

  if (user) {
    btnSignIn.textContent = 'Sign Out';
    btnSignUp.textContent = `👤 ${user.name.split(' ')[0]}`;
    btnSignUp.style.pointerEvents = 'none';
    btnDonate.style.display = 'inline-block';
  } else {
    btnSignIn.textContent = 'Sign In';
    btnSignUp.textContent = 'Sign Up';
    btnSignUp.style.pointerEvents = 'auto';
  }
}

// Run on page load
updateNavAfterLogin();

// ════════════════════════════════════════════════════════════
//  SIGN UP
// ════════════════════════════════════════════════════════════
document.getElementById('btnSignUp').addEventListener('click', () => {
  // If already logged in, do nothing
  if (sessionStorage.getItem('fr-user')) return;

  createModal('modal-signup', '🌱 Create Account', `
    <form id="formSignUp" novalidate>
      <label>Full Name<input type="text" name="name" placeholder="e.g. Priya Sharma" required autocomplete="name"/></label>
      <label>Email<input type="email" name="email" placeholder="you@example.com" required autocomplete="email"/></label>
      <label>Password<input type="password" name="password" placeholder="Min 6 characters" required autocomplete="new-password"/></label>
      <button type="submit" class="form-btn">Create Account</button>
    </form>
  `);

  document.getElementById('formSignUp').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector('button[type="submit"]');
    const { name, email, password } = Object.fromEntries(new FormData(form));

    btn.textContent = 'Creating…';
    btn.disabled = true;

    try {
      const res  = await fetch(`${API}/api/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setFormMsg(form, data.error, true);
        btn.textContent = 'Create Account';
        btn.disabled = false;
        return;
      }
      setFormMsg(form, `✅ ${data.message} You can now sign in.`);
      form.reset();
      setTimeout(() => closeModal('modal-signup'), 1800);
    } catch {
      setFormMsg(form, '❌ Cannot reach server. Make sure it is running (npm start).', true);
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  });
});

// ════════════════════════════════════════════════════════════
//  SIGN IN / SIGN OUT
// ════════════════════════════════════════════════════════════
document.getElementById('btnSignIn').addEventListener('click', () => {
  // Handle Sign Out
  const existing = sessionStorage.getItem('fr-user');
  if (existing) {
    sessionStorage.removeItem('fr-user');
    updateNavAfterLogin();
    return;
  }

  createModal('modal-signin', '🔑 Sign In', `
    <form id="formSignIn" novalidate>
      <label>Email<input type="email" name="email" placeholder="you@example.com" required autocomplete="email"/></label>
      <label>Password<input type="password" name="password" placeholder="Your password" required autocomplete="current-password"/></label>
      <button type="submit" class="form-btn">Sign In</button>
    </form>
  `);

  document.getElementById('formSignIn').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const btn  = form.querySelector('button[type="submit"]');
    const { email, password } = Object.fromEntries(new FormData(form));

    btn.textContent = 'Signing in…';
    btn.disabled = true;

    try {
      const res  = await fetch(`${API}/api/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setFormMsg(form, data.error, true);
        btn.textContent = 'Sign In';
        btn.disabled = false;
        return;
      }
      setFormMsg(form, `✅ ${data.message}`);
      form.reset();
      sessionStorage.setItem('fr-user', JSON.stringify({ id: data.userId, name: data.name }));
      updateNavAfterLogin();
      setTimeout(() => closeModal('modal-signin'), 1500);
    } catch {
      setFormMsg(form, '❌ Cannot reach server. Make sure it is running (npm start).', true);
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });
});

// ════════════════════════════════════════════════════════════
//  DONATE NOW
// ════════════════════════════════════════════════════════════
document.getElementById('btnDonate').addEventListener('click', () => {
  createModal('modal-donate', '🌾 Donate Food', `
    <form id="formDonate" novalidate>
      <label>Your Name<input type="text" name="donorName" placeholder="e.g. Rahul Mehta" required/></label>
      <label>Food Type<input type="text" name="foodType" placeholder="e.g. Rice & Dal, Vegetables…" required/></label>
      <label>Quantity<input type="text" name="quantity" placeholder="e.g. 5 kg, 10 plates" required/></label>
      <label>Pickup Location<input type="text" name="pickupLocation" placeholder="e.g. Andheri West, Mumbai" required/></label>
      <button type="submit" class="form-btn btn-orange">List My Donation</button>
    </form>
  `);

  document.getElementById('formDonate').addEventListener('submit', async e => {
    e.preventDefault();
    const form    = e.target;
    const btn     = form.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(form));

    // Basic validation
    for (const [key, val] of Object.entries(payload)) {
      if (!val.trim()) {
        setFormMsg(form, 'Please fill in all fields.', true);
        return;
      }
    }

    btn.textContent = 'Submitting…';
    btn.disabled = true;

    try {
      const res  = await fetch(`${API}/api/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setFormMsg(form, data.error, true);
        btn.textContent = 'List My Donation';
        btn.disabled = false;
        return;
      }
      setFormMsg(form, `✅ ${data.message}`);
      form.reset();
      setTimeout(() => closeModal('modal-donate'), 1800);
    } catch {
      setFormMsg(form, '❌ Cannot reach server. Make sure it is running (npm start).', true);
      btn.textContent = 'List My Donation';
      btn.disabled = false;
    }
  });
});

// ════════════════════════════════════════════════════════════
//  BROWSE FOODS
// ════════════════════════════════════════════════════════════
async function loadFoods(containerEl) {
  containerEl.innerHTML = '<p class="food-loading">Loading available foods…</p>';
  try {
    const res = await fetch(`${API}/api/foods`);
    if (!res.ok) throw new Error('Server error');
    const foods = await res.json();

    if (!foods.length) {
      containerEl.innerHTML = '<p class="food-empty">No food available right now. Check back soon!</p>';
      return;
    }

    containerEl.innerHTML = foods.map(f => `
      <div class="food-card" data-id="${f.id}">
        <div class="food-header">
          <span class="food-type">${f.foodType}</span>
          <span class="food-qty">${f.quantity}</span>
        </div>
        <p class="food-donor">🧑 Donated by <strong>${f.donorName}</strong></p>
        <p class="food-loc">📍 ${f.pickupLocation}</p>
        <button class="btn-claim" data-id="${f.id}">Claim This Food</button>
      </div>
    `).join('');

    containerEl.querySelectorAll('.btn-claim').forEach(btn => {
      btn.addEventListener('click', () => claimFood(btn.dataset.id, containerEl));
    });

  } catch {
    containerEl.innerHTML = '<p class="food-empty">❌ Cannot reach server. Make sure it is running (npm start).</p>';
  }
}

function openBrowseModal() {
  createModal('modal-browse', '🥗 Available Foods', `<div id="foodList"></div>`);
  loadFoods(document.getElementById('foodList'));
}

// Nav "Browse Foods" link
document.querySelectorAll('a[href="#browse"]').forEach(el =>
  el.addEventListener('click', e => { e.preventDefault(); openBrowseModal(); })
);

// Hero card "Browse Food →" and "Become a Donor" buttons
document.querySelectorAll('.btn-learn').forEach(btn => {
  btn.addEventListener('click', e => {
    const href = btn.getAttribute('href');
    if (href === '#browse') { e.preventDefault(); openBrowseModal(); }
  });
});

document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('btnDonate').click();
  });
});

document.querySelectorAll('.btn-outline').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('btnSignUp').click();
  });
});

// ════════════════════════════════════════════════════════════
//  CLAIM FOOD
// ════════════════════════════════════════════════════════════
async function claimFood(foodId, containerEl) {
  // Use logged-in user name if available, otherwise ask
  const user = JSON.parse(sessionStorage.getItem('fr-user') || 'null');
  let recipientName = user ? user.name : '';

  if (!recipientName) {
    recipientName = prompt('Enter your name to claim this food:')?.trim();
    if (!recipientName) return;
  }

  const card = containerEl.querySelector(`[data-id="${foodId}"]`);
  const btn  = card?.querySelector('.btn-claim');
  if (btn) { btn.textContent = 'Claiming…'; btn.disabled = true; }

  try {
    const res  = await fetch(`${API}/api/claim/${foodId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientName })
    });
    const data = await res.json();

    if (!res.ok) { alert(`❌ ${data.error}`); if (btn) { btn.textContent = 'Claim This Food'; btn.disabled = false; } return; }

    alert(`✅ ${data.message}`);
    card?.remove();
    if (!containerEl.querySelector('.food-card'))
      containerEl.innerHTML = '<p class="food-empty">All food has been claimed! Check back later.</p>';

  } catch {
    alert('❌ Cannot reach server. Make sure it is running.');
    if (btn) { btn.textContent = 'Claim This Food'; btn.disabled = false; }
  }
}
