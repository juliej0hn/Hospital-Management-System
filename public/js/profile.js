(function() {
    var error = new URLSearchParams(window.location.search).get('error');
    if (error) {
        var banner = document.createElement('div');
        banner.style.cssText = 'background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:12px 18px; border-radius:10px; margin-bottom:16px; font-size:0.9rem; font-weight:500;';
        banner.textContent = '⚠️ ' + decodeURIComponent(error);
        document.addEventListener('DOMContentLoaded', function() {
            var container = document.querySelector('.profile-container');
            if (container) container.insertBefore(banner, container.firstChild);
        });
    }
    var success = new URLSearchParams(window.location.search).get('success');
    if (success) {
        var sBanner = document.createElement('div');
        sBanner.style.cssText = 'background:#f0fdf4; border:1px solid #bbf7d0; color:#16a34a; padding:12px 18px; border-radius:10px; margin-bottom:16px; font-size:0.9rem; font-weight:500;';
        sBanner.textContent = '✅ File uploaded successfully.';
        document.addEventListener('DOMContentLoaded', function() {
            var container = document.querySelector('.profile-container');
            if (container) container.insertBefore(sBanner, container.firstChild);
        });
    }
})();

function validatePhone() {
    var phone = document.getElementById('phone-input').value.replace(/\s+/g, '').trim();
    var errEl = document.getElementById('phone-error');
    errEl.style.display = 'none';

    if (!phone) {
        errEl.textContent = 'Please enter a phone number.';
        errEl.style.display = 'block';
        return false;
    }
    if (!/^\+?[0-9]{7,15}$/.test(phone)) {
        errEl.textContent = 'Phone must be 7–15 digits, optionally starting with +';
        errEl.style.display = 'block';
        return false;
    }
    return true;
}

function validateUpload() {
    var fileInput = document.getElementById('report-file');
    var errEl     = document.getElementById('upload-error');
    errEl.style.display = 'none';

    if (!fileInput.files || fileInput.files.length === 0) {
        errEl.textContent = 'Please select a file to upload.';
        errEl.style.display = 'block';
        return false;
    }

    var file = fileInput.files[0];
    var allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain',
                        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    var allowedExts  = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.doc', '.docx'];
    var ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (allowedTypes.indexOf(file.type) === -1 && allowedExts.indexOf(ext) === -1) {
        errEl.textContent = 'Only PDF, PNG, JPG, TXT, and DOC files are allowed.';
        errEl.style.display = 'block';
        return false;
    }

    var maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
        errEl.textContent = 'File size must not exceed 5 MB.';
        errEl.style.display = 'block';
        return false;
    }
    return true;
}

async function cancelAppointment(bookingId) {
    if (!confirm('Cancel this appointment?')) return;
    const res = await fetch('/client/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
    });
    const data = await res.json();
    if (data.success) window.location.reload();
    else alert('Error: ' + data.error);
}
