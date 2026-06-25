function getBookingsForDoctor(doctorName) {
    return bookings.filter(function(b) { return b.doctorName === doctorName; });
}

function isDoctorFull(doctor) {
    return getBookingsForDoctor(doctor.name).length >= doctor.maxCapacity;
}
