import express from 'express';
import { supabase } from '../../db';
import { sendMail } from '../../mailer/transport';

const router = express.Router();

// POST /api/notifications/home-visit
// Body: { visit_id: number }
router.post('/home-visit', async (req, res) => {
  try {
    const visit_id = Number(req.body?.visit_id);
    if (!visit_id || Number.isNaN(visit_id)) {
      return res.status(400).json({ success: false, message: 'visit_id is required' });
    }

    // Fetch visit with patient and doctor basic info
    const { data: visit, error: vErr } = await supabase
      .from('HomeVisit')
      .select('*')
      .eq('visit_id', visit_id)
      .single();
    if (vErr || !visit) {
      return res.status(404).json({ success: false, message: vErr?.message || 'Visit not found' });
    }

    // Patient email
    const { data: patient, error: pErr } = await supabase
      .from('Patient')
      .select('patient_id, User(name, email)')
      .eq('patient_id', visit.patient_id)
      .single();
    const patientUser = patient ? (Array.isArray((patient as any).User) ? (patient as any).User[0] : (patient as any).User) : null;
    if (pErr || !patient || !patientUser?.email) {
      return res.status(400).json({ success: false, message: 'Patient email not found' });
    }

    // Doctor (optional)
    let doctor: any = null;
    if (visit.assigned_id) {
      const { data: d, error: dErr } = await supabase
        .from('Doctor')
        .select('doctor_id, User(name, email)')
        .eq('doctor_id', visit.assigned_id)
        .single();
      if (!dErr) doctor = d;
    }
    const doctorUser = doctor ? (Array.isArray((doctor as any).User) ? (doctor as any).User[0] : (doctor as any).User) : null;

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#334155">
        <h2 style="color:#0ea5e9;margin:0 0 12px">Home Visit Booking Confirmation</h2>
        <p>Hi ${patientUser?.name || 'Patient'},</p>
        <p>Your home visit request has been received.</p>
        <ul>
          <li><strong>Service:</strong> ${visit.service_type}</li>
          <li><strong>Date:</strong> ${visit.visit_date}</li>
          <li><strong>Time:</strong> ${visit.visit_time}</li>
          <li><strong>Address:</strong> ${visit.address}</li>
          <li><strong>Status:</strong> ${visit.status}</li>
          ${doctorUser ? `<li><strong>Assigned:</strong> Dr. ${doctorUser?.name || ''}</li>` : ''}
        </ul>
        <p>We will keep you updated on any changes.</p>
        <p style="color:#64748b;font-size:12px">This is an automated message. Please do not reply.</p>
      </div>
    `;

    await sendMail({
      to: patientUser?.email,
      subject: 'Home Visit Booking Confirmation',
      html,
    });

    return res.status(200).json({ success: true, message: 'Confirmation email sent' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to send confirmation email' });
  }
});

export default router;
