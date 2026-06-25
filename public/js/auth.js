
var currentTab = 'login';

function switchTab(tab) {
    currentTab = tab;
    var isLogin   = tab === 'login';
    document.getElementById('login-tab').classList.toggle('active',  isLogin);
    document.getElementById('signup-tab').classList.toggle('active', !isLogin);
    document.getElementById('signup-fields').classList.toggle('hidden', isLogin);
    document.getElementById('auth-submit').textContent = isLogin ? 'Login' : 'Create Account';
    document.getElementById('auth-form').action        = isLogin ? '/auth/login' : '/auth/signup';

    
    var errBox = document.getElementById('auth-error');
    if (errBox) { errBox.classList.add('hidden'); errBox.textContent = ''; }
}

function handleAuth(event) {
    var email    = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;
    var errBox   = document.getElementById('auth-error');

    function showError(msg) {
        errBox.textContent = msg;
        errBox.classList.remove('hidden');
        event.preventDefault();
    }

    if (!email || !password) return showError('Please fill in email and password.');

    var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return showError('Please enter a valid email address.');

    var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password))
        return showError('Password must be at least 6 characters with a letter and a number.');

    if (currentTab === 'signup') {
        var fn = document.getElementById('first-name').value.trim();
        var ln = document.getElementById('last-name').value.trim();
        if (!fn || !ln) return showError('Please fill in your full name.');
    }
}


window.addEventListener('DOMContentLoaded', function () {
    var error = new URLSearchParams(window.location.search).get('error');
    if (!error) return;

    var messages = {
        invalid:      'Invalid email or password.',
        exists:       'An account with this email already exists.',
        missing:      'Please fill in all required fields.',
        server:       'Server error. Please try again later.',
        weakpass:     'Password must be at least 6 characters with a letter and a number.',
        invalidphone: 'Invalid phone number format. Use 7–15 digits.'
    };

    var errBox = document.getElementById('auth-error');
    if (errBox) {
        errBox.textContent = messages[error] || 'An error occurred. Please try again.';
        errBox.classList.remove('hidden');
    }
});
