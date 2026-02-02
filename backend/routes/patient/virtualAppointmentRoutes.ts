import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';
import { randomUUID } from 'crypto';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

const getPatientId = async (userId: string) => {
  const numericUserId = parseInt(userId);
  if (isNaN(numericUserId)) return null;
  const { data } = await supabase.from('Patient').select('patient_id').eq('user_id', numericUserId).single();
  return (data as any)?.patient_id as number | undefined;
};

router.post('/virtual-appointments', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, status } = req.body || {};
    const userId = req.user?.id;
    if (!userId || !doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const patientId = await getPatientId(userId);
    if (!patientId) return res.status(404).json({ message: 'Patient not found' });

    const SITE = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_BASE || 'http://localhost:3000';
    const roomId = randomUUID();
    const webrtcLink = `${SITE}/video/${encodeURIComponent(roomId)}`;

    const { data, error } = await supabase
      .from('VirtualAppointments')
      .insert([
        {
          patient_id: patientId,
          doctor_id: Number(doctorId),
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          status: status || 'Scheduled',
          webrtc_link: webrtcLink,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return res.status(201).json({ success: true, virtualAppointment: data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || 'Failed to create virtual appointment' });
  }
});

export default router;
