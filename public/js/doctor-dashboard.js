// Format start/end time inputs into the timeSlot string the server expects.
// Output: "1:00 PM - 5:00 PM"  (no date)
function formatTimeSlot(startStr, endStr) {
    function to12h(t) {
        var parts = t.split(':');
        var h     = parseInt(parts[0], 10);
        var m     = parts[1];
        var ampm  = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return h + ':' + m + ' ' + ampm;
    }
    return to12h(startStr) + ' - ' + to12h(endStr);
}

async function updateSlots() {
    var startVal = document.getElementById('slot-start').value;
    var endVal   = document.getElementById('slot-end').value;

    if (!startVal || !endVal) {
        alert('Please fill in both start time and end time.');
        return;
    }
    if (startVal >= endVal) {
        alert('End time must be later than start time.');
        return;
    }

    var timeSlot = formatTimeSlot(startVal, endVal);

    try {
        var res  = await fetch('/doctor/update-slots', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ timeSlot })
        });
        var data = await res.json();
        if (data.success) {
            alert('Slot updated. New capacity: ' + data.newCapacity + '. All patients have been notified via Email.');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Request failed: ' + err.message);
    }
}

async function clearSlot() {
    if (!confirm('This will cancel ALL appointments and remove your time slot.\nAll patients will be notified via Email.\n\nContinue?')) return;

    try {
        var res  = await fetch('/doctor/clear-slot', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        var data = await res.json();
        if (data.success) {
            alert('All appointments cancelled. Patients have been notified via Email.');
            window.location.reload();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (err) {
        alert('Request failed: ' + err.message);
    }
}
