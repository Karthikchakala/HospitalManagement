import { Router } from 'express';
import { supabase } from '../../db';

const router = Router();

// GET /api/patient/status/inpatients?patient_id=...
router.get('/status/inpatients', async (req, res) => {
  try {
    const patient_id = Number((req.query as any).patient_id);
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });
    const { data, error } = await supabase
      .from('Inpatients')
      .select('inpatient_id, patient_id, doctor_id, department_id, room_number, ward_type, admission_date, discharge_date, diagnosis, treatment_plan, status')
      .eq('patient_id', patient_id)
      .order('admission_date', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data ?? []);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

// GET /api/patient/status/outpatients?patient_id=...
router.get('/status/outpatients', async (req, res) => {
  try {
    const patient_id = Number((req.query as any).patient_id);
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });
    const { data, error } = await supabase
      .from('Outpatients')
      .select('outpatient_id, patient_id, doctor_id, department_id, visit_date, appointment_time, symptoms, diagnosis, prescription, consultation_fee, payment_status')
      .eq('patient_id', patient_id)
      .order('visit_date', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data ?? []);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

// GET /api/patient/status?patient_id=... (combined)
router.get('/status', async (req, res) => {
  try {
    const patient_id = Number((req.query as any).patient_id);
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    const [inRes, outRes] = await Promise.all([
      supabase
        .from('Inpatients')
        .select('inpatient_id, patient_id, doctor_id, department_id, room_number, ward_type, admission_date, discharge_date, diagnosis, treatment_plan, status')
        .eq('patient_id', patient_id)
        .order('admission_date', { ascending: false }),
      supabase
        .from('Outpatients')
        .select('outpatient_id, patient_id, doctor_id, department_id, visit_date, appointment_time, symptoms, diagnosis, prescription, consultation_fee, payment_status')
        .eq('patient_id', patient_id)
        .order('visit_date', { ascending: false }),
    ]);

    if (inRes.error) return res.status(500).json({ error: inRes.error.message });
    if (outRes.error) return res.status(500).json({ error: outRes.error.message });

    return res.status(200).json({ inpatients: inRes.data ?? [], outpatients: outRes.data ?? [] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
});

export default router;
