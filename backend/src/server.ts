import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Log every incoming request
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
app.use(cors({
  origin: '*', // restrict to your domain in production e.g. 'https://monstar-ticketing.web.app'
}));

// ── SMTP Transporter ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"${process.env.SMTP_FROM_NAME || 'MonStar Ship Lines'}" <${process.env.SMTP_FROM_EMAIL}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

// ── Helpers ──────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return '₱' + Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Email Templates ──────────────────────────────────────────
function passengerEmailHtml(booking: any, trip: any): string {
  const passengerRows = (booking.passengers || [])
    .map((p: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${p.firstName} ${p.lastName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-transform:capitalize;">${p.type}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${p.seatClass}</td>
      </tr>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#0a1628;padding:32px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700;letter-spacing:1px;">MonStar Ship Lines</h1>
      <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">Booking Confirmation</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#0f172a;font-size:16px;">Hi <strong>${booking.passengerName}</strong>,</p>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
        Your booking has been received and is currently <strong>pending payment confirmation</strong> from our admin team.
        You will receive another email once your booking is confirmed.
      </p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Booking Reference</p>
        <p style="margin:0;color:#0a1628;font-size:22px;font-weight:700;font-family:monospace;">${booking.bookingRef}</p>
      </div>
      ${trip ? `
      <h3 style="margin:0 0 12px;color:#0f172a;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">Trip Details</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
        <tr><td style="padding:8px 0;color:#64748b;width:40%;">Route</td><td style="padding:8px 0;color:#0f172a;font-weight:600;">${trip.origin} → ${trip.destination}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Vessel</td><td style="padding:8px 0;color:#0f172a;">${trip.vesselName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Departure</td><td style="padding:8px 0;color:#0f172a;">${formatDate(trip.departureDate)} at ${trip.departureTime}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Arrival</td><td style="padding:8px 0;color:#0f172a;">${formatDate(trip.arrivalDate)} at ${trip.arrivalTime}</td></tr>
      </table>
      ` : ''}
      <h3 style="margin:0 0 12px;color:#0f172a;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">Passengers</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:8px 12px;text-align:left;color:#475569;font-weight:600;">Name</th>
            <th style="padding:8px 12px;text-align:left;color:#475569;font-weight:600;">Type</th>
            <th style="padding:8px 12px;text-align:left;color:#475569;font-weight:600;">Class</th>
          </tr>
        </thead>
        <tbody>${passengerRows}</tbody>
      </table>
      <div style="background:#0a1628;border-radius:8px;padding:16px 20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="color:#94a3b8;font-size:14px;">Total Fare</span>
          <span style="color:#f59e0b;font-size:20px;font-weight:700;">${formatCurrency(booking.totalAmount)}</span>
        </div>
      </div>
      <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">
        Please present your booking reference at the port for payment and boarding.
        Your QR ticket will be available after payment confirmation.
      </p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">MonStar Ship Lines · Valid for date of travel only</p>
    </div>
  </div>
</body>
</html>`;
}

function adminEmailHtml(booking: any, trip: any): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;">
    <div style="background:#0a1628;padding:24px 32px;">
      <h2 style="margin:0;color:white;font-size:18px;">🔔 New Booking Received</h2>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">MonStar Admin Notification</p>
    </div>
    <div style="padding:32px;font-size:14px;color:#0f172a;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#64748b;width:40%;">Booking Ref</td><td style="padding:8px 0;font-weight:700;font-family:monospace;">${booking.bookingRef}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Passenger</td><td style="padding:8px 0;">${booking.passengerName}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;">${booking.passengerEmail}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Pax Count</td><td style="padding:8px 0;">${(booking.passengers || []).length}</td></tr>
        ${trip ? `
        <tr><td style="padding:8px 0;color:#64748b;">Route</td><td style="padding:8px 0;">${trip.origin} → ${trip.destination}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b;">Departure</td><td style="padding:8px 0;">${formatDate(trip.departureDate)} ${trip.departureTime}</td></tr>
        ` : ''}
        <tr><td style="padding:8px 0;color:#64748b;">Total</td><td style="padding:8px 0;font-weight:700;">${formatCurrency(booking.totalAmount)}</td></tr>
      </table>
      <p style="margin:24px 0 0;color:#64748b;font-size:13px;">Log in to the admin panel to confirm payment.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Route: Health Check ───────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'MonStar Email Server running' });
});

// ── Route: Send Booking Email ─────────────────────────────────
app.post('/send-booking-email', async (req, res) => {
  const { booking, trip } = req.body;

  if (!booking || !booking.passengerEmail) {
    return res.status(400).json({ error: 'Missing booking data' });
  }

  try {
    // Email to passenger
    await transporter.sendMail({
      from: FROM,
      to: booking.passengerEmail,
      subject: `Booking Received – ${booking.bookingRef} | MonStar Ship Lines`,
      html: passengerEmailHtml(booking, trip),
    });

    // Email to admin
    if (ADMIN_EMAIL) {
      await transporter.sendMail({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: `New Booking: ${booking.bookingRef} – ${booking.passengerName}`,
        html: adminEmailHtml(booking, trip),
      });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MonStar Email Server running on port ${PORT}`);
});