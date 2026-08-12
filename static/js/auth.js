/* ==========================================================================
   AUTHENTICATION PAGES (LOGIN, SIGNUP, FORGOT PASSWORD) - CLIENT LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
  initSignupValidation();
});

// Show / Hide Password Toggle
function initPasswordToggles() {
  const toggleBtns = document.querySelectorAll('.btn-toggle-pwd');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = `<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;
      } else {
        input.type = 'password';
        btn.innerHTML = `<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
      }
    });
  });
}

// Quick Demo Credentials Fill & Highlight
function fillDemoCredentials(role) {
  const emailInput = document.getElementById('login-email');
  const pwdInput = document.getElementById('login-password');
  const chips = document.querySelectorAll('.demo-chip');

  chips.forEach(c => c.classList.remove('active'));

  if (role === 'student') {
    if (emailInput) emailInput.value = 'student@demo.edu';
    if (pwdInput) pwdInput.value = 'student123';
    document.getElementById('chip-student')?.classList.add('active');
  } else if (role === 'teacher') {
    if (emailInput) emailInput.value = 'teacher@demo.edu';
    if (pwdInput) pwdInput.value = 'teacher123';
    document.getElementById('chip-teacher')?.classList.add('active');
  } else if (role === 'admin') {
    if (emailInput) emailInput.value = 'admin@demo.edu';
    if (pwdInput) pwdInput.value = 'admin123';
    document.getElementById('chip-admin')?.classList.add('active');
  }
}

// Live Validation for Signup Page
function initSignupValidation() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  const pwd = document.getElementById('signup-password');
  const confirmPwd = document.getElementById('signup-confirm-password');
  const matchHint = document.getElementById('pwd-match-hint');

  function checkMatch() {
    if (!pwd || !confirmPwd || !matchHint) return;
    if (!confirmPwd.value) {
      matchHint.style.display = 'none';
      confirmPwd.classList.remove('error');
      return;
    }

    if (pwd.value !== confirmPwd.value) {
      matchHint.style.display = 'block';
      matchHint.textContent = '❌ Passwords do not match';
      matchHint.style.color = 'var(--accent-rose)';
      confirmPwd.classList.add('error');
    } else {
      matchHint.style.display = 'block';
      matchHint.textContent = '✓ Passwords match';
      matchHint.style.color = 'var(--accent-emerald)';
      confirmPwd.classList.remove('error');
    }
  }

  pwd?.addEventListener('input', checkMatch);
  confirmPwd?.addEventListener('input', checkMatch);

  form.addEventListener('submit', (e) => {
    if (pwd.value !== confirmPwd.value) {
      e.preventDefault();
      alert('Passwords do not match. Please verify your password entry.');
      return;
    }
    setButtonLoading('btn-signup-submit', 'Creating Account...');
  });
}

// Button Loading Helper
function handleFormSubmit(btnId, loadingText = 'Signing In...') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  setButtonLoading(btnId, loadingText);
}

function setButtonLoading(btnId, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner" style="display:inline-block;"></div> <span>${text}</span>`;
}
