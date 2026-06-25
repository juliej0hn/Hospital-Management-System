function handleAdminLogin(event) {
    var username = document.getElementById('admin-username').value.trim();
    var password = document.getElementById('admin-password').value;

    if (!username || !password) {
        event.preventDefault();
        alert('Please enter both username and password.');
        return;
    }

    var btn = document.getElementById('admin-login-btn');
    btn.textContent = 'Logging in...';
    btn.disabled    = true;

    document.getElementById('admin-login-form').action  = '/admin/login';
    document.getElementById('admin-login-form').method  = 'POST';
}