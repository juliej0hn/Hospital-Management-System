// Parse server data
var serverDataEl = document.getElementById('server-data');
var doctors = serverDataEl ? JSON.parse(serverDataEl.getAttribute('data-doctors') || '[]') : [];
var bookings = serverDataEl ? JSON.parse(serverDataEl.getAttribute('data-bookings') || '[]') : [];
var myAppointments = serverDataEl ? JSON.parse(serverDataEl.getAttribute('data-my-appointments') || '[]') : [];
var loggedInName = serverDataEl ? (serverDataEl.getAttribute('data-logged-in-name') || '') : '';

function filterDoctors() {
    var sector   = document.getElementById('sector-filter').value;
    var filtered = (sector === 'all')
        ? doctors
        : doctors.filter(function(d) { return d.sector === sector; });
    renderDoctorList(filtered);
}

function renderDoctorList(list) {
    var container = document.getElementById('doctor-list');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<p class="empty-msg">No doctors found for this specialty.</p>';
        return;
    }

    for (var i = 0; i < list.length; i++) {
        var doctor   = list[i];
        var doctorBookings = bookings.filter(function(b) { return b.doctorName === doctor.name; });
        var isFull   = doctorBookings.length >= doctor.maxCapacity;

        var card = document.createElement('div');
        card.className = 'doctor-card card';
        card.innerHTML =
            '<div class="doctor-info">'
            + '<div class="doctor-name">'     + escHtml(doctor.name)     + '</div>'
            + '<div class="doctor-meta">'     + escHtml(doctor.sector)   + ' · ' + escHtml(doctor.timeSlot) + '</div>'
            + '<div class="doctor-capacity">' + doctorBookings.length    + ' / ' + doctor.maxCapacity + ' booked</div>'
            + '</div>'
            + '<button class="btn-book' + (isFull ? ' btn-full' : '') + '" '
            + (isFull ? 'disabled' : 'onclick="openBookingModal(\'' + escHtml(doctor.name) + '\')"') + '>'
            + (isFull ? 'Fully Booked' : 'Book')
            + '</button>';

        container.appendChild(card);
    }
}

var selectedDoctorName = null;

function openBookingModal(doctorName) {
    selectedDoctorName = doctorName;
    document.getElementById('modal-doctor-name').textContent = 'Booking with ' + doctorName;

    var nameField = document.getElementById('patient-name');
    nameField.value = (typeof loggedInName !== 'undefined' && loggedInName) ? loggedInName : '';

    document.getElementById('appointment-type').value = 'Consultation';

    var alreadyBooked = myAppointments.some(function(a) { return a.doctorName === doctorName; });
    var btn  = document.getElementById('confirm-booking-btn');
    btn.disabled  = alreadyBooked;
    btn.textContent  = alreadyBooked ? 'Already Booked' : 'Confirm Booking';
    nameField.disabled = alreadyBooked;

    document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    selectedDoctorName = null;
}

function confirmBooking(event) {
    event.preventDefault();

    var patientName  = document.getElementById('patient-name').value.trim();
    var appointmentType = document.getElementById('appointment-type').value;
 if (!patientName) {
        alert('Please enter the patient name.');
        return;
    }
    if (patientName.length < 2 || patientName.length > 60) {
        alert('Patient name must be between 2 and 60 characters.');
        return;
    }
    if (!/^[a-zA-Z\s\-'.]+$/.test(patientName)) {
        alert('Patient name can only contain letters, spaces, hyphens, and apostrophes.');
        return;
    }
    if (!appointmentType) {
        alert('Please select an appointment type.');
        return;
    }
    var validTypes = ['Consultation', 'Follow-up', 'Lab Result'];
    if (validTypes.indexOf(appointmentType) === -1) {
        alert('Invalid appointment type selected.');
        return;
    }

    
    var doctor = null;
    for (var i = 0; i < doctors.length; i++) {
        if (doctors[i].name === selectedDoctorName) { doctor = doctors[i]; break; }
    }
    if (!doctor) { closeModal(); return; }

    
    if (myAppointments.some(function(a) { return a.doctorName === doctor.name; })) {
        alert('You already have an appointment with this doctor.');
        return;
    }


    var count = bookings.filter(function(b) { return b.doctorName === doctor.name; }).length;
    if (count >= doctor.maxCapacity) {
        alert('This doctor is fully booked.');
        closeModal();
        return;
    }


    var btn   = document.getElementById('confirm-booking-btn');
    btn.disabled   = true;
    btn.textContent = 'Booking...';

    fetch('/client/book', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ doctorName: doctor.name, patientName, appointmentType })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.success) {
            window.location.reload();
        } else {
            alert('Booking failed: ' + (data.error || 'Unknown error.'));
            btn.disabled    = false;
            btn.textContent = 'Confirm Booking';
        }
    })
    .catch(function(err) {
        alert('Network error: ' + err.message);
        btn.disabled    = false;
        btn.textContent = 'Confirm Booking';
    });
}

function renderMyAppointments() {
    var container = document.getElementById('my-appointments-list');
    if (!container) return;

    if (myAppointments.length === 0) {
        container.innerHTML = '<p class="empty-msg">No appointments booked yet.</p>';
        return;
    }

    container.innerHTML = '';
    for (var i = 0; i < myAppointments.length; i++) {
        var appt     = myAppointments[i];
        var apptTime = new Date(appt.appointmentTime);
        var diffMins = (apptTime - new Date()) / (1000 * 60);
        var isLocked = diffMins < 60;

        var item = document.createElement('div');
        item.className = 'appt-item card';
        item.style.marginBottom = '10px';
        item.innerHTML =
            '<div class="appt-info">'
            + '<div class="appt-doctor"><strong>' + escHtml(appt.doctorName) + '</strong></div>'
            + '<div class="appt-meta">Position in queue: <strong>#' + appt.positionInLine + '</strong></div>'
            + '<div class="appt-meta">Appointment time: ' + apptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>'
            + '</div>'
            + '<div style="display:flex; align-items:center; gap:10px;">'
            + '<div class="appt-badge">' + escHtml(appt.appointmentType) + '</div>'
            + (isLocked
                ? '<span style="color:red; font-size:0.8em;">🔒 Locked</span>'
                : '<button class="btn-small btn-cancel" onclick="cancelAppointment(\'' + appt.id + '\')">Cancel</button>')
            + '</div>';

        container.appendChild(item);
    }
}

async function cancelAppointment(bookingId) {
    if (!confirm('Cancel this appointment?')) return;
    try {
        const res  = await fetch('/client/cancel', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ bookingId })
        });
        const data = await res.json();
        if (data.success) {
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Request failed: ' + err.message);
    }
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}


renderDoctorList(doctors);
