import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';
import { sendMail } from '../../mailer/transport';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

async function getPatientId(userId?: string): Promise<number | null> {
  if (!userId) return null;
  const { data, error } = await supabase.from('Patient').select('patient_id').eq('user_id', Number(userId)).single();
  if (error) return null;
  return (data as any)?.patient_id ?? null;
}

async function getDoctorNameAndEmail(doctorId: number): Promise<{ name: string; email: string | null }> {
  try {
    const { data, error } = await supabase
      .from('Doctor')
      .select('doctor_id, user_id, User(name, email)')
      .eq('doctor_id', doctorId)
      .single();
    if (error || !data) return { name: 'Doctor', email: null };
    const u = Array.isArray((data as any).User) ? (data as any).User[0] : (data as any).User;
    return { name: u?.name || 'Doctor', email: u?.email || null };
  } catch {
    return { name: 'Doctor', email: null };
  }
}

// GET /api/patient/appointments/upcoming
// Unified list across Appointments, VirtualAppointments, HomeVisit
// router.get('/appointments/upcoming', protect, async (req: AuthRequest, res: Response) => {
//   try {
//     const patientId = await getPatientId(req.user?.id);
//     if (!patientId) return res.status(401).json({ success: false, message: 'Not authenticated' });

//     const todayStr = new Date().toISOString().slice(0, 10);

//     // In-person Appointments
//     const { data: appts, error: apptErr } = await supabase
//       .from('Appointments')
//       .select('appointment_id, appointment_date, appointment_time, status, doctor_id, Doctor(User(name))')
//       .eq('patient_id', patientId)
//       .neq('status', 'Canceled')
//       .gte('appointment_date', todayStr)
//       .order('appointment_date', { ascending: true });

//     // Virtual Appointments
//     const { data: vAppts, error: vErr } = await supabase
//       .from('VirtualAppointments')
//       .select('id, appointment_date, appointment_time, status, doctor_id, Doctor(User(name))')
//       .eq('patient_id', patientId)
//       .neq('status', 'Canceled')
//       .gte('appointment_date', todayStr)
//       .order('appointment_date', { ascending: true });

//     // Home Visits (only those with Doctor assigned)
//     const { data: hVisits, error: hErr } = await supabase
//       .from('HomeVisit')
//       .select('visit_id, visit_date, visit_time, status, assigned_id')
//       .eq('patient_id', patientId)
//       .neq('status', 'Canceled')
//       .gte('visit_date', todayStr)
//       .order('visit_date', { ascending: true });

//     if (apptErr || vErr || hErr) {
//       return res.status(500).json({ success: false,
//     message: 'Failed to fetch appointments',
//     errors: { apptErr, vErr, hErr } });
//     }

//     const normalize = [] as any[];
//     (appts || []).forEach((a: any) => {
//       const u = Array.isArray(a?.Doctor?.User) ? a.Doctor.User[0] : a?.Doctor?.User;
//       normalize.push({
//         type: 'in_person',
//         appointment_id: a.appointment_id,
//         date: a.appointment_date,
//         time: a.appointment_time,
//         status: a.status,
//         doctor_id: a.doctor_id,
//         doctor_name: u?.name || 'Doctor',
//       });
//     });
//     (vAppts || []).forEach((a: any) => {
//       const u = Array.isArray(a?.Doctor?.User) ? a.Doctor.User[0] : a?.Doctor?.User;
//       normalize.push({
//         type: 'virtual',
//         appointment_id: a.id,
//         date: a.appointment_date,
//         time: a.appointment_time,
//         status: a.status,
//         doctor_id: a.doctor_id,
//         doctor_name: u?.name || 'Doctor',
//       });
//     });
//     (hVisits || []).forEach((h: any) => {
//       if (!h.assigned_id) return; // only show doctor visits
//       normalize.push({
//         type: 'home_visit',
//         appointment_id: h.visit_id,
//         date: h.visit_date,
//         time: h.visit_time,
//         status: h.status,
//         doctor_id: h.assigned_id,
//         doctor_name: 'Doctor', // resolve on client if needed
//       });
//     });

//     return res.status(200).json({ success: true, data: normalize });
//   } catch (e: any) {
//     return res.status(500).json({ success: false, message: e?.message || 'Server error' });
//   }
// });

// GET /api/patient/appointments/upcoming
router.get('/appointments/upcoming', protect, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = await getPatientId(req.user?.id);
    if (!patientId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const todayStr = new Date().toISOString().slice(0, 10);

    // In-person Appointments
    const { data: appts, error: apptErr } = await supabase
      .from('Appointments')
      .select('appointment_id, appointment_date, appointment_time, status, doctor_id, Doctor(User(name))')
      .eq('patient_id', patientId)
      .neq('status', 'Canceled')
      .gte('appointment_date', todayStr)
      .order('appointment_date', { ascending: true });

    // Virtual Appointments
    const { data: vAppts, error: vErr } = await supabase
      .from('VirtualAppointments')
      .select('virtual_appointment_id, appointment_date, appointment_time, status, doctor_id, Doctor(User(name))')
      .eq('patient_id', patientId)
      .neq('status', 'Canceled')
      .gte('appointment_date', todayStr)
      .order('appointment_date', { ascending: true });

    // Home Visits
    const { data: hVisits, error: hErr } = await supabase
      .from('HomeVisit')
      .select('visit_id, visit_date, visit_time, status, assigned_id')
      .eq('patient_id', patientId)
      .neq('status', 'Canceled')
      .gte('visit_date', todayStr)
      .order('visit_date', { ascending: true });

    if (apptErr || vErr || hErr) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments',
        errors: { apptErr, vErr, hErr }
      });
    }

    const normalize: any[] = [];

    // Map in-person
    (appts || []).forEach((a: any) => {
      const u = Array.isArray(a?.Doctor?.User) ? a.Doctor.User[0] : a?.Doctor?.User;
      normalize.push({
        type: 'in_person',
        appointment_id: a.appointment_id,
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status,
        doctor_id: a.doctor_id,
        doctor_name: u?.name || 'Doctor',
      });
    });

    // Map virtual
    (vAppts || []).forEach((a: any) => {
      const u = Array.isArray(a?.Doctor?.User) ? a.Doctor.User[0] : a?.Doctor?.User;
      normalize.push({
        type: 'virtual',
        appointment_id: a.virtual_appointment_id, // <-- corrected
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status,
        doctor_id: a.doctor_id,
        doctor_name: u?.name || 'Doctor',
      });
    });

    // Map home visits
    (hVisits || []).forEach((h: any) => {
      if (!h.assigned_id) return;
      normalize.push({
        type: 'home_visit',
        appointment_id: h.visit_id,
        date: h.visit_date,
        time: h.visit_time,
        status: h.status,
        doctor_id: h.assigned_id,
        doctor_name: 'Doctor',
      });
    });

    return res.status(200).json({ success: true, data: normalize });

  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
});


// PATCH /api/patient/appointments/:type/:id/cancel
router.patch('/appointments/:type/:id/cancel', protect, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = await getPatientId(req.user?.id);
    if (!patientId) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const type = String(req.params.type);
    const id = Number(req.params.id);
    if (!['in_person', 'virtual', 'home_visit'].includes(type) || !id) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    let table = '';
    let idCol = '';
    let dateCol = '';
    if (type === 'in_person') { table = 'Appointments'; idCol = 'appointment_id'; dateCol = 'appointment_date'; }
    if (type === 'virtual') { table = 'VirtualAppointments'; idCol = 'id'; dateCol = 'appointment_date'; }
    if (type === 'home_visit') { table = 'HomeVisit'; idCol = 'visit_id'; dateCol = 'visit_date'; }

    // Security: ensure ownership
    const constraint = type === 'home_visit' ? { patient_id: patientId } : { patient_id: patientId };

    const { data, error } = await supabase
      .from(table)
      .update({ status: 'Canceled' })
      .eq(idCol, id)
      .match(constraint)
      .select('*')
      .single();

    if (error) return res.status(400).json({ success: false, message: error.message });

    return res.status(200).json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
});

// PATCH /api/patient/appointments/:type/:id/reschedule
router.patch('/appointments/:type/:id/reschedule', protect, async (req: AuthRequest, res: Response) => {
  try {
    const patientId = await getPatientId(req.user?.id);
    if (!patientId) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const type = String(req.params.type);
    const id = Number(req.params.id);
    const { appointment_date, appointment_time } = req.body || {};
    if (!['in_person', 'virtual', 'home_visit'].includes(type) || !id || !appointment_date || !appointment_time) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    let table = '';
    let idCol = '';
    let dateCol = '';
    let timeCol = '';
    let doctorIdCol = '';
    if (type === 'in_person') { table = 'Appointments'; idCol = 'appointment_id'; dateCol = 'appointment_date'; timeCol = 'appointment_time'; doctorIdCol = 'doctor_id'; }
    if (type === 'virtual') { table = 'VirtualAppointments'; idCol = 'id'; dateCol = 'appointment_date'; timeCol = 'appointment_time'; doctorIdCol = 'doctor_id'; }
    if (type === 'home_visit') { table = 'HomeVisit'; idCol = 'visit_id'; dateCol = 'visit_date'; timeCol = 'visit_time'; doctorIdCol = 'assigned_id'; }

    const { data: updated, error } = await supabase
      .from(table)
      .update({ [dateCol]: appointment_date, [timeCol]: appointment_time })
      .eq(idCol, id)
      .eq('patient_id', patientId)
      .select('*')
      .single();

    if (error || !updated) return res.status(400).json({ success: false, message: error?.message || 'Update failed' });

    // Notify doctor via email
    try {
      const doctorId = (updated as any)[doctorIdCol] as number | null;
      if (doctorId) {
        const { name, email } = await getDoctorNameAndEmail(doctorId);
        if (email) {
          const html = `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#334155">
              <h2 style="color:#0ea5e9;margin:0 0 12px">Appointment Rescheduled</h2>
              <p>Hello Dr. ${name},</p>
              <p>The following appointment has been rescheduled by the patient:</p>
              <ul>
                <li><strong>Type:</strong> ${type.replace('_', ' ')}</li>
                <li><strong>New Date:</strong> ${appointment_date}</li>
                <li><strong>New Time:</strong> ${appointment_time}</li>
              </ul>
              <p>Please check your dashboard for details.</p>
              <p style="color:#64748b;font-size:12px">This is an automated message. Please do not reply.</p>
            </div>`;
          await sendMail({ to: email, subject: 'Appointment Rescheduled', html });
        }
      }
    } catch {}

    return res.status(200).json({ success: true, data: updated });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || 'Server error' });
  }
});

export default router;
