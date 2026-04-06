// ============================================================
//  script.js  –  FoodRescue Frontend Logic
//  Handles: modals, dark mode, fetch() calls to backend
// ============================================================

const API = 'http://localhost:3000';  // Change if deploying remotely

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
//  SMOOTH SCROLL
// ════════════════════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
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
//  SIGN UP
// ════════════════════════════════════════════════════════════
document.getElementById('btnSignUp').addEventListener('click', () => {
  createModal('modal-signup', '🌱 Create Account', `
    <form id="formSignUp" novalidate>
      <label>Full Name<input type="text" name="name" placeholder="e.g. Priya Sharma" required/></label>
      <label>Email<input type="email" name="email" placeholder="you@example.com" required/></label>
      <label>Password<input type="password" name="password" placeholder="Min 6 characters" required/></label>
      <button type="submit" class="form-btn">Create Account</button>
    </form>
  `);

  document.getElementById('formSignUp').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const { name, email, password } = Object.fromEntries(new FormData(form));

    console.log('[SIGNUP DATA]', { name, email, password });

    try {
      const res  = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) return setFormMsg(form, data.error, true);
      setFormMsg(form, `✅ ${data.message} You can now sign in.`);
      form.reset();
      setTimeout(() => closeModal('modal-signup'), 1800);
    } catch {
      setFormMsg(form, '❌ Could not connect to server. Is it running?', true);
    }
  });
});

// ════════════════════════════════════════════════════════════
//  SIGN IN
// ════════════════════════════════════════════════════════════
document.getElementById('btnSignIn').addEventListener('click', () => {
  createModal('modal-signin', '🔑 Sign In', `
    <form id="formSignIn" novalidate>
      <label>Email<input type="email" name="email" placeholder="you@example.com" required/></label>
      <label>Password<input type="password" name="password" placeholder="Your password" required/></label>
      <button type="submit" class="form-btn">Sign In</button>
    </form>
  `);

  document.getElementById('formSignIn').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const { email, password } = Object.fromEntries(new FormData(form));

    console.log('[SIGNIN DATA]', { email, password });

    try {
      const res  = await fetch(`${API}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return setFormMsg(form, data.error, true);
      setFormMsg(form, `✅ ${data.message}`);
      form.reset();
      sessionStorage.setItem('fr-user', JSON.stringify({ id: data.userId, name: data.name }));
      setTimeout(() => closeModal('modal-signin'), 1500);
    } catch {
      setFormMsg(form, '❌ Could not connect to server. Is it running?', true);
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
    const form = e.target;
    const payload = Object.fromEntries(new FormData(form));

    console.log('[DONATE DATA]', payload);

    try {
      const res  = await fetch(`${API}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return setFormMsg(form, data.error, true);
      setFormMsg(form, `✅ ${data.message}`);
      form.reset();
      setTimeout(() => closeModal('modal-donate'), 1800);
    } catch {
      setFormMsg(form, '❌ Could not connect to server. Is it running?', true);
    }
  });
});

// ════════════════════════════════════════════════════════════
//  BROWSE FOODS
// ════════════════════════════════════════════════════════════
async function loadFoods(containerEl) {
  containerEl.innerHTML = '<p class="food-loading">Loading available foods…</p>';
  try {
    const res   = await fetch(`${API}/foods`);
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
    containerEl.innerHTML = '<p class="food-empty">❌ Could not reach server. Make sure it\'s running.</p>';
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

// Hero card buttons
document.getElementById('cardDonate')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('btnDonate').click(); });
document.getElementById('cardBrowse')?.addEventListener('click', e => { e.preventDefault(); document.getElementById('btnSignUp').click(); });

// ════════════════════════════════════════════════════════════
//  CLAIM FOOD
// ════════════════════════════════════════════════════════════
async function claimFood(foodId, containerEl) {
  const recipientName = prompt('Enter your name to claim this food:')?.trim();
  if (!recipientName) return;

  try {
    const res  = await fetch(`${API}/claim/${foodId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientName })
    });
    const data = await res.json();

    if (!res.ok) { alert(`❌ ${data.error}`); return; }

    alert(`✅ ${data.message}`);
    console.log(`[CLAIM] Food ID ${foodId} claimed by ${recipientName}`);

    containerEl.querySelector(`[data-id="${foodId}"]`)?.remove();
    if (!containerEl.querySelector('.food-card'))
      containerEl.innerHTML = '<p class="food-empty">All food has been claimed! Check back later.</p>';

  } catch {
    alert('❌ Could not connect to server.');
  }
}
