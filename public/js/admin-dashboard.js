// Parse server data
var serverDataEl = document.getElementById('server-data');
var doctors = serverDataEl ? JSON.parse(serverDataEl.getAttribute('data-doctors') || '[]') : [];
var bookings = serverDataEl ? JSON.parse(serverDataEl.getAttribute('data-bookings') || '[]') : [];

function formatAvailability(dateStr, startStr, endStr) {
    if (!dateStr || !startStr || !endStr) return '';

    var d        = new Date(dateStr);
    var months   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dateLabel = months[d.getMonth()] + ' ' + d.getDate();

    function to12h(t) {
        var parts = t.split(':');
        var h     = parseInt(parts[0], 10);
        var m     = parts[1];
        var ampm  = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return h + ':' + m + ' ' + ampm;
    }

    return dateLabel + ', ' + to12h(startStr) + ' - ' + to12h(endStr);
}

// Add Doctor 
function validateDoctorForm(name, sector, dateVal, startVal, endVal, avgTime) {
    if (!name) { alert('Please enter the doctor name.'); return false; }
    if (name.length < 3 || name.length > 80) { alert('Doctor name must be between 3 and 80 characters.'); return false; }
    if (!/^[a-zA-Z\s\-'.]+$/.test(name)) { alert('Doctor name can only contain letters, spaces, hyphens, and apostrophes.'); return false; }
    if (!sector) { alert('Please select a sector/specialty.'); return false; }
    var validSectors = ['Cardiology', 'Pediatrics', 'General', 'Orthopedics'];
    if (validSectors.indexOf(sector) === -1) { alert('Invalid sector selected.'); return false; }
    if (!dateVal) { alert('Please select a date.'); return false; }
    var today = new Date(); today.setHours(0,0,0,0);
    var selectedDate = new Date(dateVal + 'T00:00:00');
    if (selectedDate < today) { alert('Date cannot be in the past.'); return false; }
    if (!startVal || !endVal) { alert('Please fill in both start and end times.'); return false; }
    if (startVal >= endVal) { alert('End time must be later than start time.'); return false; }
    if (isNaN(avgTime) || avgTime < 1) { alert('Average consultation time must be at least 1 minute.'); return false; }
    if (avgTime > 120) { alert('Average consultation time cannot exceed 120 minutes.'); return false; }
    return true;
}

function addDoctor(event) {
    event.preventDefault();

    var name     = document.getElementById('doctor-name').value.trim();
    var password = document.getElementById('doctor-password').value.trim();
    var sector   = document.getElementById('doctor-sector').value;
    var dateVal  = document.getElementById('doctor-date').value;
    var startVal = document.getElementById('doctor-time-start').value;
    var endVal   = document.getElementById('doctor-time-end').value;
    var avgTime  = parseInt(document.getElementById('doctor-avg-time').value, 10);

    if (!validateDoctorForm(name, sector, dateVal, startVal, endVal, avgTime)) return;

    var timeSlot = formatAvailability(dateVal, startVal, endVal);

    fetch('/admin/doctor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, password, sector, timeSlot, avgConsultationTime: avgTime })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            window.location.reload();
        } else {
            alert('Error: ' + (data.error || 'Could not add doctor.'));
        }
    })
    .catch(function(err) { alert('Network error: ' + err.message); });
}

// Edit Doctor 
function openEditForm(doctorName) {
    var doctor = null;
    for (var i = 0; i < doctors.length; i++) {
        if (doctors[i].name === doctorName) { doctor = doctors[i]; break; }
    }
    if (!doctor) return;

    document.getElementById('edit-doctor-original-name').value = doctor.name;
    document.getElementById('edit-doctor-name').value          = doctor.name;
    document.getElementById('edit-doctor-sector').value        = doctor.sector;
    document.getElementById('edit-doctor-password').value      = '';
    document.getElementById('edit-doctor-avg-time').value      = doctor.avgConsultationTime;
    document.getElementById('edit-form-panel').classList.remove('hidden');
}

function closeEditForm() {
    document.getElementById('edit-form-panel').classList.add('hidden');
}

function saveEditDoctor(event) {
    event.preventDefault();

    var originalName = document.getElementById('edit-doctor-original-name').value;
    var name     = document.getElementById('edit-doctor-name').value.trim();
    var password = document.getElementById('edit-doctor-password').value.trim();
    var sector   = document.getElementById('edit-doctor-sector').value;
    var dateVal  = document.getElementById('edit-doctor-date').value;
    var startVal = document.getElementById('edit-doctor-time-start').value;
    var endVal   = document.getElementById('edit-doctor-time-end').value;
    var avgTime  = parseInt(document.getElementById('edit-doctor-avg-time').value, 10);

    if (!validateDoctorForm(name, sector, dateVal, startVal, endVal, avgTime)) return;

    var timeSlot = formatAvailability(dateVal, startVal, endVal);

    fetch('/admin/doctor/edit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ originalName, name, password, sector, timeSlot, avgConsultationTime: avgTime })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            window.location.reload();
        } else {
            alert('Error: ' + (data.error || 'Could not update doctor.'));
        }
    })
    .catch(function(err) { alert('Network error: ' + err.message); });
}

// Delete Doctor 
function deleteDoctor(doctorName) {
    if (!confirm('Are you sure you want to delete ' + doctorName + '? This will also cancel all their bookings.')) return;

    fetch('/admin/doctor/delete', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: doctorName })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            window.location.reload();
        } else {
            alert('Error: ' + (data.error || 'Could not delete doctor.'));
        }
    })
    .catch(function(err) { alert('Network error: ' + err.message); });
}

// Dashboard Table 
function renderDashboardTable() {
    var tbody = document.getElementById('dashboard-tbody');
    tbody.innerHTML = '';

    if (doctors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="admin-dash-empty">No doctors added yet.</td></tr>';
        return;
    }

    for (var i = 0; i < doctors.length; i++) {
        var doctor         = doctors[i];
        var doctorBookings = bookings.filter(function(b) { return b.doctorName === doctor.name; });
        var patientNames   = doctorBookings.map(function(b) { return b.patientName; }).join(', ') || '—';

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><span class="doctor-link" onclick="openEditForm(\'' + escHtml(doctor.name) + '\')">' + escHtml(doctor.name) + '</span></td>'
            + '<td>' + doctorBookings.length + ' / ' + doctor.maxCapacity + '</td>'
            + '<td>' + escHtml(patientNames) + '</td>'
            + '<td>' + escHtml(doctor.sector) + '</td>'
            + '<td><button class="btn-toggle-form btn-delete" onclick="deleteDoctor(\'' + escHtml(doctor.name) + '\')">🗑️ Delete</button></td>';
        tbody.appendChild(tr);
    }
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

renderDashboardTable();