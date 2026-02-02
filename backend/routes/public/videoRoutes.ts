import express from 'express';
import nodemailer from 'nodemailer';
import { supabase } from '../../db';
import { protect } from '../../middleware/authMiddleware';

// In-memory signaling store (MVP)
// rooms[roomId] = { offer?: any, answer?: any, candidates: any[] }
const rooms: Record<string, { offer?: any; answer?: any; candidates: any[] }> = {};

const router = express.Router();

router.get('/video/room/:id', (req, res) => {
  const id = String(req.params.id);
  if (!rooms[id]) rooms[id] = { candidates: [] };
  return res.json({ success: true, roomId: id, offer: !!rooms[id].offer, answer: !!rooms[id].answer, candidates: rooms[id].candidates.length });
});

router.post('/video/room/:id/offer', express.json(), (req, res) => {
  const id = String(req.params.id);
  if (!rooms[id]) rooms[id] = { candidates: [] };
  rooms[id].offer = req.body;
  return res.json({ success: true });
});

router.get('/video/room/:id/offer', (req, res) => {
  const id = String(req.params.id);
  const r = rooms[id];
  return res.json({ success: true, offer: r?.offer || null });
});

router.post('/video/room/:id/answer', express.json(), (req, res) => {
  const id = String(req.params.id);
  if (!rooms[id]) rooms[id] = { candidates: [] };
  rooms[id].answer = req.body;
  return res.json({ success: true });
});

router.get('/video/room/:id/answer', (req, res) => {
  const id = String(req.params.id);
  const r = rooms[id];
  return res.json({ success: true, answer: r?.answer || null });
});

router.post('/video/room/:id/candidate', express.json(), (req, res) => {
  const id = String(req.params.id);
  if (!rooms[id]) rooms[id] = { candidates: [] };
  rooms[id].candidates.push(req.body);
  return res.json({ success: true });
});

router.get('/video/room/:id/candidates', (req, res) => {
  const id = String(req.params.id);
  const r = rooms[id];
  return res.json({ success: true, candidates: r?.candidates || [] });
});

router.delete('/video/room/:id', (req, res) => {
  const id = String(req.params.id);
  delete rooms[id];
  return res.json({ success: true });
});

export default router;

// --- Email Invite ---
router.post('/video/invite', protect, express.json(), async (req, res) => {
  try {
    const userId = (req as any)?.user?.id; // authenticated patient
    const { doctorId, roomId, paymentMode } = req.body || {};
    if (!doctorId || !roomId) return res.status(400).json({ success: false, message: 'doctorId and roomId are required' });

    // Lookup patient email from User by auth id
    const { data: patientUser, error: pErr } = await supabase
      .from('User')
      .select('email, name')
      .eq('user_id', Number(userId))
      .single();
    if (pErr) return res.status(500).json({ success: false, message: 'Failed to resolve patient user' });

    // Lookup doctor email from Doctor -> User
    const { data: doc, error: dErr } = await supabase
      .from('Doctor')
      .select('user_id, User(email, name)')
      .eq('doctor_id', Number(doctorId))
      .single();
    if (dErr) return res.status(500).json({ success: false, message: 'Failed to resolve doctor user' });

    const docUser = Array.isArray((doc as any)?.User) ? (doc as any).User[0] : (doc as any)?.User;
    const doctorEmail = docUser?.email;
    const doctorName = docUser?.name || 'Doctor';
    const patientEmail = (patientUser as any)?.email;
    const patientName = (patientUser as any)?.name || 'Patient';

    if (!doctorEmail || !patientEmail) {
      return res.status(400).json({ success: false, message: 'Missing recipient email(s)' });
    }

    const SITE = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_BASE || 'http://localhost:3000';
    const meetUrl = `${SITE}/video/${encodeURIComponent(String(roomId))}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const from = process.env.FROM_EMAIL || 'no-reply@hospify.local';
    const subject = 'Virtual Appointment Link';
    const html = `
      <div>
        <p>Dear ${patientName} and ${doctorName},</p>
        <p>Your virtual appointment has been scheduled.</p>
        <p><strong>Meeting Link:</strong> <a href="${meetUrl}">${meetUrl}</a></p>
        <p><strong>Payment Mode:</strong> ${paymentMode || 'Razorpay'}</p>
        <p>Please join the link at your appointment time.</p>
        <p>— Hospify</p>
      </div>
    `;

    await transporter.sendMail({ from, to: [patientEmail, doctorEmail], subject, html });

    return res.json({ success: true, meetUrl });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || 'Failed to send invite' });
  }
});
