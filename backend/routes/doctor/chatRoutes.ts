// backend/routes/doctor/chatRoutes.ts
import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// GET /api/doctor/chat/patients
// Returns unique patients who have previously exchanged chat messages with this doctor
router.get('/chat/patients', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) return res.status(400).json({ message: 'Invalid User ID format' });

    // Find doctor_id for this user
    const { data: doctorRecord, error: doctorError } = await supabase
      .from('Doctor')
      .select('doctor_id')
      .eq('user_id', numericUserId)
      .single();

    if (doctorError || !doctorRecord) {
      return res.status(404).json({ message: 'Doctor record not found.' });
    }

    const doctorId = doctorRecord.doctor_id as number;

    // Fetch chat messages that involve this doctor (as sender or receiver)
    const { data: messages, error: msgError } = await supabase
      .from('chat_messages')
      .select('sender_type, sender_id, receiver_id')
      .or(
        `and(sender_type.eq.doctor,sender_id.eq.${doctorId}),and(sender_type.eq.patient,receiver_id.eq.${doctorId})`
      );

    if (msgError) {
      console.error('Fetch chat patients error:', msgError);
      return res.status(500).json({ message: 'Failed to fetch chat threads' });
    }

    // Derive unique patient IDs from messages
    const patientIdSet = new Set<number>();
    (messages || []).forEach((m: any) => {
      if (m.sender_type === 'patient') {
        patientIdSet.add(Number(m.sender_id));
      } else {
        // sender is doctor -> the patient is the receiver
        patientIdSet.add(Number(m.receiver_id));
      }
    });

    const patientIds = Array.from(patientIdSet.values()).filter(Boolean);
    if (patientIds.length === 0) return res.status(200).json([]);

    // Fetch patient details (name from linked User)
    const { data: patients, error: patError } = await supabase
      .from('Patient')
      .select('patient_id, User(name)')
      .in('patient_id', patientIds);

    if (patError) {
      console.error('Fetch patient details error:', patError);
      return res.status(500).json({ message: 'Failed to fetch patient details' });
    }

    const result = (patients || []).map((p: any) => ({
      patient_id: p.patient_id,
      name: Array.isArray(p.User) ? (p.User[0]?.name || 'Patient') : (p.User?.name || 'Patient'),
    }));

    return res.status(200).json(result);
  } catch (e: any) {
    console.error('doctor/chat/patients error:', e?.message || e);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
