const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = 'Hayat Hospital <noreply@hayathospital.me>';

// Shared HTML wrapper — consistent branding for every email.
function _wrapHtml(accentColor, iconEmoji, title, bodyContent) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0077B6,${accentColor});padding:36px 40px;text-align:center;">
              <div style="font-size:42px;margin-bottom:10px;">${iconEmoji}</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.3px;">Hayat Hospital</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.82);font-size:13px;">Patient Notification System</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 20px;color:#0077B6;font-size:18px;font-weight:700;">${title}</h2>
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                This is an automated message from <strong>Hayat Hospital</strong>.<br>
                Please do not reply to this email. For assistance, contact reception.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// 1. SLOTS UPDATED — appointment rescheduled notification
exports.sendSlotsUpdatedEmail = async ({ patientEmail, patientName, doctorName, newDate, newTime }) => {
    const subject = 'Appointment Rescheduled - Hayat Hospital';

    const bodyContent = `
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 18px;">
        Dear <strong>${patientName}</strong>,
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 18px;">
        We would like to inform you that your appointment with
        <strong>${doctorName}</strong> has been <strong>rescheduled</strong>.
        Please find your updated appointment details below:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff8ff;border:1px solid #bfdbfe;border-radius:12px;margin:0 0 24px;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;">
                  <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Doctor</span><br>
                  <span style="color:#0077B6;font-size:16px;font-weight:700;">${doctorName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0 6px;border-top:1px solid #bfdbfe;">
                  <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">New Date</span><br>
                  <span style="color:#1e293b;font-size:15px;font-weight:600;">📅 ${newDate}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0 6px;border-top:1px solid #bfdbfe;">
                  <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">New Time</span><br>
                  <span style="color:#1e293b;font-size:15px;font-weight:600;">🕐 ${newTime}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;">
        Your appointment is <strong>still confirmed</strong>. If you have any questions or need to make changes,
        please contact our reception team.
      </p>`;

    const html = _wrapHtml('#7B2CBF', '📅', 'Appointment Rescheduled', bodyContent);

    const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [patientEmail],
        subject: subject,
        html: html
    });

    if (error) {
        return console.error(error);
    }
    console.log('🟢 [External API Success]:', data);
};

// 2. CAPACITY REDUCED — urgent clinic schedule adjustment
exports.sendCapacityReducedEmail = async ({ patientEmail, patientName, clinicName, originalDate }) => {
    const subject = 'Urgent: Clinic Schedule Adjustment - Hayat Hospital';

    const bodyContent = `
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 18px;">
        Dear <strong>${patientName}</strong>,
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin:0 0 20px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;color:#c2410c;font-size:14px;font-weight:700;">
              ⚠️ Important Notice Regarding Your Upcoming Appointment
            </p>
          </td>
        </tr>
      </table>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 18px;">
        Due to an unexpected reduction in clinic capacity at
        <strong>${clinicName}</strong>, your scheduled appointment on
        <strong>${originalDate}</strong> requires review and may have been automatically adjusted.
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        We sincerely apologize for this inconvenience. Please contact us to confirm or rebook your appointment at your
        earliest convenience.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:12px;margin:0 0 24px;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;">
                  <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Clinic</span><br>
                  <span style="color:#92400e;font-size:16px;font-weight:700;">${clinicName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0 6px;border-top:1px solid #fde68a;">
                  <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Original Date</span><br>
                  <span style="color:#1e293b;font-size:15px;font-weight:600;">📅 ${originalDate}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;">
        Thank you for your patience and understanding. We value your trust in Hayat Hospital.
      </p>`;

    const html = _wrapHtml('#d97706', '⚠️', 'Urgent: Clinic Schedule Adjustment', bodyContent);

    const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [patientEmail],
        subject: subject,
        html: html
    });

    if (error) {
        return console.error(error);
    }
    console.log('🟢 [External API Success]:', data);
};

// 3. APPOINTMENT CANCELED — cancellation notice
exports.sendAppointmentCanceledEmail = async ({ patientEmail, patientName, doctorName, appointmentDate, cancellationReason }) => {
    const subject = 'Cancellation Notice - Hayat Hospital';

    const bodyContent = `
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 18px;">
        Dear <strong>${patientName}</strong>,
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin:0 0 20px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;color:#dc2626;font-size:14px;font-weight:700;">
              ❌ Your Appointment Has Been Cancelled
            </p>
          </td>
        </tr>
      </table>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 18px;">
        We regret to inform you that your appointment with <strong>${doctorName}</strong>
        scheduled for <strong>${appointmentDate}</strong> has been <strong>cancelled</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf2f8;border:1px solid #f9a8d4;border-radius:12px;margin:0 0 24px;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;">
                  <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Doctor</span><br>
                  <span style="color:#0077B6;font-size:16px;font-weight:700;">${doctorName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0 6px;border-top:1px solid #f9a8d4;">
                  <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Appointment Date</span><br>
                  <span style="color:#1e293b;font-size:15px;font-weight:600;">📅 ${appointmentDate}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0 6px;border-top:1px solid #f9a8d4;">
                  <span style="color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reason for Cancellation</span><br>
                  <span style="color:#dc2626;font-size:15px;font-weight:600;">⚕️ ${cancellationReason}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 18px;">
        We sincerely apologize for any inconvenience this may have caused. Please visit our portal
        to rebook your appointment at a time that suits you best.
      </p>
      <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;">
        Thank you for your understanding and for choosing <strong>Hayat Hospital</strong>.
      </p>`;

    const html = _wrapHtml('#dc2626', '❌', 'Appointment Cancellation Notice', bodyContent);

    const { data, error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: [patientEmail],
        subject: subject,
        html: html
    });

    if (error) {
        return console.error(error);
    }
    console.log('🟢 [External API Success]:', data);
};
