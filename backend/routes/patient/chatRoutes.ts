// backend/routes/patient/chatRoutes.ts
import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

async function getPatientId(userId: string): Promise<number | null> {
  const numericUserId = parseInt(userId);
  if (isNaN(numericUserId)) return null;
  const { data } = await supabase
    .from('Patient')
    .select('patient_id')
    .eq('user_id', numericUserId)
    .single();
  return data?.patient_id || null;
}

// GET /api/patient/chat/doctors
// Returns unique doctors who have previously exchanged chat messages with this patient
router.get('/chat/doctors', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const patientId = await getPatientId(userId);
    if (!patientId) return res.status(404).json({ message: 'Patient record not found.' });

    // Fetch chat messages that involve this patient (as sender or receiver)
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('sender_type, sender_id, receiver_id')
      .or(
        `and(sender_type.eq.patient,sender_id.eq.${patientId}),and(sender_type.eq.doctor,receiver_id.eq.${patientId})`
      );

    if (msgError) {
      console.error('Fetch chat doctors error:', msgError);
      return res.status(500).json({ message: 'Failed to fetch chat threads' });
    }

    // Derive unique doctor IDs from messages
    const doctorIdSet = new Set<number>();
    (messages || []).forEach((m: any) => {
      if (m.sender_type === 'doctor') {
        doctorIdSet.add(Number(m.sender_id));
      } else {
        // sender is patient -> doctor is the receiver
        doctorIdSet.add(Number(m.receiver_id));
      }
    });

    const doctorIds = Array.from(doctorIdSet.values()).filter(Boolean);
    if (doctorIds.length === 0) return res.status(200).json([]);

    // Fetch doctor details (name from linked User)
    const { data: doctors, error: docError } = await supabase
      .from('Doctor')
      .select('doctor_id, User(name)')
      .in('doctor_id', doctorIds);

    if (docError) {
      console.error('Fetch doctor details error:', docError);
      return res.status(500).json({ message: 'Failed to fetch doctor details' });
    }

    const result = (doctors || []).map((d: any) => ({
      doctor_id: d.doctor_id,
      name: Array.isArray(d.User) ? (d.User[0]?.name || 'Doctor') : (d.User?.name || 'Doctor'),
    }));

    return res.status(200).json(result);
  } catch (e: any) {
    console.error('/patient/chat/doctors error:', e?.message || e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/patient/chat/appointments
// Optional query: ?doctorId=123 to filter appointments with a specific doctor
router.get('/chat/appointments', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const patientId = await getPatientId(userId);
    if (!patientId) return res.status(404).json({ message: 'Patient record not found.' });

    const doctorIdParam = req.query.doctorId as string | undefined;

    let query = supabase
      .from('Appointments')
      .select('appointment_id, appointment_date, appointment_time, reason, status, doctor_id');

    query = query.eq('patient_id', patientId);
    if (doctorIdParam) {
      query = query.eq('doctor_id', Number(doctorIdParam));
    }

    const { data: appointments, error } = await query.order('appointment_date', { ascending: true });
    if (error) {
      console.error('Fetch patient appointments error:', error);
      return res.status(500).json({ message: 'Failed to fetch appointments' });
    }

    return res.status(200).json(appointments || []);
  } catch (e: any) {
    console.error('/patient/chat/appointments error:', e?.message || e);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
