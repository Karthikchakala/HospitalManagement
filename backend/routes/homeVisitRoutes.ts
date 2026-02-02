import express from 'express';
import { supabase } from '../db';
import { sendMail } from '../mailer/transport';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Helper: get patient_id from authenticated user
async function getPatientIdFromUser(userId?: string): Promise<number | null> {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('Patient')
    .select('patient_id')
    .eq('user_id', Number(userId))
    .single();
  if (error) return null;
  return (data as any)?.patient_id ?? null;
}

// POST /api/home-visit/create-bill → create Billing for home visit before payment
router.post('/home-visit/create-bill', protect, async (req, res) => {
  try {
    const userId = (req as any)?.user?.id as string | undefined;
    const patientId = await getPatientIdFromUser(userId);
    if (!patientId) return res.status(401).json({ success: false, message: 'Patient not authenticated' });

    const service_type = (req.body?.service_type || '').toString();
    const baseFees: Record<string, number> = {
      Doctor: 500,
      Nurse: 300,
      Physiotherapist: 400,
      Caregiver: 250,
    };
    const amount = baseFees[service_type] ?? 300; // default

    const services = `Home Visit - ${service_type}`;
    const billPayload: any = {
      patient_id: patientId,
      appointment_id: null,
      services,
      consultation_charges: 0,
      medicine_costs: 0,
      total_amount: amount,
      status: 'Unpaid',
      payment_method: null,
      payment_date: null,
    };
    const { data: bill, error } = await supabase.from('Billing').insert(billPayload).select('*').single();
    if (error) throw error;

    return res.status(200).json({ success: true, bill });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || 'Failed to create bill' });
  }
});

// POST /api/home-visit → create a new home visit booking (patient_id auto from auth if not provided)
router.post('/home-visit', protect, async (req, res) => {
  try {
    const body = req.body || {};
    let patient_id = body?.patient_id != null ? Number(body.patient_id) : NaN;
    const assigned_id = body?.assigned_id != null ? Number(body.assigned_id) : null;
    const service_type = (body?.service_type || '').toString().trim();
    const visit_date = (body?.visit_date || '').toString().trim();
    const visit_time = (body?.visit_time || '').toString().trim();
    const address = (body?.address || '').toString().trim();
    const notes = (body?.notes || '').toString().trim();

    // If patient_id not in body, derive from authenticated user
    if (!patient_id && req.user?.id) {
      const { data: userWithPatient, error: upErr } = await supabase
        .from('User')
        .select('user_id, Patient(patient_id)')
        .eq('user_id', req.user.id)
        .single();
      if (upErr) {
        return res.status(400).json({ success: false, message: 'Unable to resolve patient profile' });
      }
      const patientRel: any = (userWithPatient as any)?.Patient;
      const resolvedPid = Array.isArray(patientRel) ? patientRel[0]?.patient_id : patientRel?.patient_id;
      patient_id = resolvedPid || NaN;
    }

    if (!patient_id || !service_type || !visit_date || !visit_time || !address) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const insertPayload: any = {
      patient_id,
      assigned_id: service_type === 'Doctor' ? (assigned_id || null) : null,
      service_type,
      visit_date,
      visit_time,
      address,
      notes,
      status: 'Pending',
    };

    const { data, error } = await supabase
      .from('HomeVisit')
      .insert([insertPayload])
      .select('*')
      .single();

    if (error) throw error;

    // Send confirmation email via backend mailer
    try {
      const { data: patient, error: pErr } = await supabase
        .from('Patients')
        .select('id, name, email')
        .eq('id', data.patient_id)
        .single();
      let doctor: any = null;
      if (data.assigned_id) {
        const { data: d, error: dErr } = await supabase
          .from('Doctors')
          .select('id, name, email')
          .eq('id', data.assigned_id)
          .single();
        if (!dErr) doctor = d;
      }
      if (!pErr && patient?.email) {
        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#334155">
            <h2 style="color:#0ea5e9;margin:0 0 12px">Home Visit Booking Confirmation</h2>
            <p>Hi ${patient.name || 'Patient'},</p>
            <p>Your home visit request has been received.</p>
            <ul>
              <li><strong>Service:</strong> ${data.service_type}</li>
              <li><strong>Date:</strong> ${data.visit_date}</li>
              <li><strong>Time:</strong> ${data.visit_time}</li>
              <li><strong>Address:</strong> ${data.address}</li>
              <li><strong>Status:</strong> ${data.status}</li>
              ${doctor ? `<li><strong>Assigned:</strong> Dr. ${doctor.name}</li>` : ''}
            </ul>
            <p>We will keep you updated on any changes.</p>
            <p style="color:#64748b;font-size:12px">This is an automated message. Please do not reply.</p>
          </div>`;
        await sendMail({ to: patient.email, subject: 'Home Visit Booking Confirmation', html });
      }
    } catch (e) {
      // non-blocking
    }

    return res.status(201).json({ success: true, message: 'Home visit booked', data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to create home visit' });
  }
});

// GET /api/home-visit → fetch visits (filters: patient_id, assigned_id, service_type)
router.get('/home-visit', async (req, res) => {
  try {
    const patient_id = req.query.patient_id as string | undefined;
    const assigned_id = req.query.assigned_id as string | undefined;
    const service_type = req.query.service_type as string | undefined;

    let query: any = supabase.from('HomeVisit').select('*').order('created_at', { ascending: false });
    if (patient_id) query = query.eq('patient_id', Number(patient_id));
    if (assigned_id) query = query.eq('assigned_id', Number(assigned_id));
    if (service_type) query = query.eq('service_type', service_type);

    const { data, error } = await query;
    if (error) throw error;

    // Attach patient_name via Patient -> User(name)
    const ids = Array.from(new Set((data || []).map((v: any) => v.patient_id).filter(Boolean)));
    let nameMap: Record<number, string> = {};
    if (ids.length > 0) {
      const { data: patients, error: pErr } = await supabase
        .from('Patient')
        .select('patient_id, User(name)')
        .in('patient_id', ids as any);
      if (!pErr && patients) {
        for (const p of patients as any[]) {
          const u = Array.isArray(p.User) ? p.User[0] : p.User;
          nameMap[p.patient_id] = u?.name || '';
        }
      }
    }

    const enriched = (data || []).map((v: any) => ({ ...v, patient_name: nameMap[v.patient_id] }));

    return res.status(200).json({ success: true, message: 'Fetched home visits', data: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch home visits' });
  }
});

// PATCH /api/home-visit/:id → update status and/or assigned_id
router.patch('/home-visit/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const body = req.body || {};
    const updates: Record<string, any> = {};
    if (body.status) updates.status = String(body.status);
    if (body.assigned_id !== undefined) updates.assigned_id = body.assigned_id ? Number(body.assigned_id) : null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No updatable fields provided' });
    }

    const { data, error } = await supabase
      .from('HomeVisit')
      .update(updates)
      .eq('visit_id', id)
      .select('*')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Home visit updated', data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to update home visit' });
  }
});

// GET /api/home-visit/departments → list departments (id, name)
router.get('/home-visit/departments', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('Departments')
      .select('department_id, name')
      .order('name', { ascending: true });
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Fetched departments', data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch departments' });
  }
});

// GET /api/home-visit/doctors → list doctors with department info
// Optional filter: ?department_id=ID
router.get('/home-visit/doctors', async (req, res) => {
  try {
    const department_id = req.query.department_id as string | undefined;

    // Fetch doctors
    let q: any = supabase
      .from('Doctor')
      .select('doctor_id, User(name), department_id')
      .order('doctor_id', { ascending: true });
    if (department_id) q = q.eq('department_id', Number(department_id));
    const { data: docs, error: dErr } = await q;
    if (dErr) throw dErr;

    const deptIds = Array.from(new Set((docs || []).map((d: any) => d.department_id).filter(Boolean)));
    let deptMap: Record<number, string> = {};
    if (deptIds.length > 0) {
      const { data: depts, error: depErr } = await supabase
        .from('Departments')
        .select('department_id, name')
        .in('department_id', deptIds as any);
      if (!depErr && depts) {
        deptMap = Object.fromEntries(depts.map((x: any) => [x.department_id, x.name]));
      }
    }

    const out = (docs || []).map((d: any) => ({
      id: d.doctor_id,
      name: d?.User?.name || '',
      department_id: d.department_id,
      department_name: d.department_id ? deptMap[d.department_id] : undefined,
    }));

    return res.status(200).json({ success: true, message: 'Fetched doctors', data: out });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch doctors' });
  }
});

export default router;
