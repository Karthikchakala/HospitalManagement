import { Router } from 'express';
import { supabase } from '../../db';

const router = Router();

// GET /api/patient/inpatients?doctor_id=&department_id=&status=
router.get('/inpatients', async (req, res) => {
  try {
    const { doctor_id, department_id, status } = req.query as Record<string, string | undefined>;

    let query = supabase
      .from('Inpatients')
      .select('inpatient_id, patient_id, doctor_id, department_id, room_number, ward_type, admission_date, discharge_date, diagnosis, treatment_plan, status')
      .order('admission_date', { ascending: false });

    if (doctor_id) query = query.eq('doctor_id', Number(doctor_id));
    if (department_id) query = query.eq('department_id', Number(department_id));
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data ?? []);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

// POST /api/patient/inpatients/admit
router.post('/inpatients/admit', async (req, res) => {
  try {
    const { patient_id, doctor_id, department_id, room_number, ward_type, admission_date, diagnosis, treatment_plan } = req.body || {};
    if (!patient_id || !doctor_id || !department_id || !room_number || !ward_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const payload = {
      patient_id: Number(patient_id),
      doctor_id: Number(doctor_id),
      department_id: Number(department_id),
      room_number: String(room_number),
      ward_type: String(ward_type),
      admission_date: admission_date ?? new Date().toISOString().slice(0, 10),
      diagnosis: diagnosis ?? null,
      treatment_plan: treatment_plan ?? null,
      status: 'Admitted',
    };
    const { data, error } = await supabase.from('Inpatients').insert(payload).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

// Middleware to log discharge hits
router.all('/inpatients/discharge/:id', (req, _res, next) => {
  console.log(`[Inpatients] ${req.method} ${req.originalUrl}`);
  next();
});

// PUT /api/patient/inpatients/discharge/:id
router.put('/inpatients/discharge/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const discharge_date = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('Inpatients')
      .update({ status: 'Discharged', discharge_date })
      .eq('inpatient_id', id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Inpatient not found' });
    const admission = new Date(data.admission_date as string);
    const discharge = new Date(discharge_date);
    const ms = Math.max(0, discharge.getTime() - admission.getTime());
    const daysStayed = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    const ward = String(data.ward_type || '').toLowerCase();
    const wardRates: Record<string, number> = { general: 1000, 'semi-private': 2000, private: 3000, icu: 5000 };
    const dailyRate = wardRates[ward] ?? 1000;
    const total_amount = daysStayed * dailyRate;
    const services = `Inpatient stay (${data.ward_type || ''} ${data.room_number || ''}) — ${daysStayed} day(s) x ${dailyRate}`.trim();
    const billPayload = {
      patient_id: data.patient_id,
      appointment_id: null as any,
      services,
      consultation_charges: 0,
      medicine_costs: 0,
      total_amount,
      status: 'pending',
      payment_method: null as any,
      payment_date: null as any,
    };
    const billRes = await supabase.from('Billing').insert(billPayload).select('*').single();
    if (billRes.error) return res.status(500).json({ error: billRes.error.message });

    // Insert EMR history entry with structured fields
    const emrPayload = {
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      diagnosis: data.diagnosis || null,
      notes: (data.treatment_plan || '').toString() || null,
      visit_date: discharge_date, // keep for compatibility
      // Extended fields if present in schema
      encounter_type: 'Inpatient',
      in_date: data.admission_date,
      out_date: discharge_date,
      ward_type: data.ward_type || null,
      room_number: data.room_number || null,
      staff_id: (req as any)?.user?.staff_id ?? null,
      prescriptions: null as any,
    } as any;
    const emrRes = await supabase.from('EMR').insert(emrPayload).select('*').single();
    if (emrRes.error) return res.status(500).json({ error: emrRes.error.message });

    return res.status(200).json({ inpatient: data, bill: billRes.data, emr: emrRes.data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

// POST alias for discharge to help clients that cannot send PUT
router.post('/inpatients/discharge/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const discharge_date = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('Inpatients')
      .update({ status: 'Discharged', discharge_date })
      .eq('inpatient_id', id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Inpatient not found' });
    const admission = new Date(data.admission_date as string);
    const discharge = new Date(discharge_date);
    const ms = Math.max(0, discharge.getTime() - admission.getTime());
    const daysStayed = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    const ward = String(data.ward_type || '').toLowerCase();
    const wardRates: Record<string, number> = { general: 1000, 'semi-private': 2000, private: 3000, icu: 5000 };
    const dailyRate = wardRates[ward] ?? 1000;
    const total_amount = daysStayed * dailyRate;
    const services = `Inpatient stay (${data.ward_type || ''} ${data.room_number || ''}) — ${daysStayed} day(s) x ${dailyRate}`.trim();
    const billPayload = {
      patient_id: data.patient_id,
      appointment_id: null as any,
      services,
      consultation_charges: 0,
      medicine_costs: 0,
      total_amount,
      status: 'pending',
      payment_method: null as any,
      payment_date: null as any,
    };
    const billRes = await supabase.from('Billing').insert(billPayload).select('*').single();
    if (billRes.error) return res.status(500).json({ error: billRes.error.message });

    // Insert EMR history entry with structured fields
    const emrPayload = {
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      diagnosis: data.diagnosis || null,
      notes: (data.treatment_plan || '').toString() || null,
      visit_date: discharge_date,
      encounter_type: 'Inpatient',
      in_date: data.admission_date,
      out_date: discharge_date,
      ward_type: data.ward_type || null,
      room_number: data.room_number || null,
      staff_id: (req as any)?.user?.staff_id ?? null,
      prescriptions: null as any,
    } as any;
    const emrRes = await supabase.from('EMR').insert(emrPayload).select('*').single();
    if (emrRes.error) return res.status(500).json({ error: emrRes.error.message });

    return res.status(200).json({ inpatient: data, bill: billRes.data, emr: emrRes.data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

export default router;
