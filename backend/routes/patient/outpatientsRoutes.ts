import { Router } from 'express';
import { supabase } from '../../db';

const router = Router();

// GET /api/patient/outpatients?doctor_id=&department_id=&payment_status=
router.get('/outpatients', async (req, res) => {
  try {
    const { doctor_id, department_id, payment_status } = req.query as Record<string, string | undefined>;

    let query = supabase
      .from('Outpatients')
      .select('outpatient_id, patient_id, doctor_id, department_id, visit_date, appointment_time, symptoms, diagnosis, prescription, consultation_fee, payment_status')
      .order('visit_date', { ascending: false });

    if (doctor_id) query = query.eq('doctor_id', Number(doctor_id));
    if (department_id) query = query.eq('department_id', Number(department_id));
    if (payment_status) query = query.eq('payment_status', payment_status);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data ?? []);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

// POST /api/patient/outpatients/book
router.post('/outpatients/book', async (req, res) => {
  try {
    const { patient_id, doctor_id, department_id, visit_date, appointment_time, symptoms, diagnosis, prescription, consultation_fee, payment_status } = req.body || {};
    if (!patient_id || !doctor_id || !department_id || !visit_date || !appointment_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const payload = {
      patient_id: Number(patient_id),
      doctor_id: Number(doctor_id),
      department_id: Number(department_id),
      visit_date: String(visit_date),
      appointment_time: String(appointment_time),
      symptoms: symptoms ?? null,
      diagnosis: diagnosis ?? null,
      prescription: prescription ?? null,
      consultation_fee: consultation_fee != null ? Number(consultation_fee) : null,
      payment_status: payment_status ?? 'Pending',
    };
    const { data, error } = await supabase.from('Outpatients').insert(payload).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

export default router;
