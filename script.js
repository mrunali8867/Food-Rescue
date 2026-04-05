
const darkToggle = document.getElementById('darkToggle');
darkToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});

// Example button actions
document.getElementById('btnDonate').addEventListener('click', () => {
  alert('Redirecting to donation form...');
});
document.getElementById('btnSignUp').addEventListener('click', () => {
  alert('Redirecting to sign-up page...');
});
document.getElementById('btnSignIn').addEventListener('click', () => {
  alert('Redirecting to sign-in page...');
});
