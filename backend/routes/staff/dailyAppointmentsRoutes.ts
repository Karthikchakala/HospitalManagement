// // backend/routes/staff/dailyAppointmentsRoutes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// Middleware to restrict access to Staff roles (Receptionists)
const restrictToStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'staff') {
    return res.status(403).json({ message: 'Access denied: Must be Staff.' });
  }
  next();
};

// @route   GET /api/staff/appointments/today
// @desc    Get all scheduled appointments for the current day across the hospital
// @access  Private (Staff Only)
router.get('/appointments/today', protect, restrictToStaff, async (req: AuthRequest, res: Response) => {
  try {
    const hasParams = Object.keys(req.query).length > 0;
    const { date, status, page, pageSize, format } = req.query as Record<string, string>;

    const targetDate = (date && date.trim().length > 0)
      ? date
      : new Date().toISOString().split('T')[0];

    // Base query used by both simple and advanced paths
    let baseQuery = supabase
      .from('Appointments')
      .select(`
        appointment_id,
        appointment_time,
        reason,
        status,
        appointment_date,
        Patient:patient_id (
          patient_id,
          user_id,
          User:user_id (
            name
          )
        ),
        Doctor:doctor_id (
          doctor_id,
          user_id,
          User:user_id (
            name
          )
        )
      `)
      .eq('appointment_date', targetDate)
      .neq('status', 'Canceled');

    if (status && status !== 'All') {
      baseQuery = baseQuery.eq('status', status);
    }

    // If no params were provided, preserve original behavior: no pagination, return array only
    if (!hasParams) {
      const { data: appointments, error } = await baseQuery
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Supabase Appointments Fetch Error:', error);
        throw error;
      }

      const formattedAppts = (appointments as any[] || []).map((appt: any) => {
        const patientName = appt.Patient?.User?.name || 'N/A';
        const doctorName = appt.Doctor?.User?.name || 'N/A';
        return {
          id: appt.appointment_id,
          time: appt.appointment_time,
          patientName,
          doctorName,
          reason: appt.reason,
          status: appt.status,
        };
      });

      return res.status(200).json(formattedAppts);
    }

    // Advanced path: pagination and CSV export
    const pageNum = Math.max(parseInt(String(page || '1'), 10) || 1, 1);
    const sizeNum = Math.min(Math.max(parseInt(String(pageSize || '10'), 10) || 10, 1), 100);
    const from = (pageNum - 1) * sizeNum;
    const to = from + sizeNum - 1;

    const { data: pageData, error: pageError } = await baseQuery
      .order('appointment_time', { ascending: true })
      .range(from, to);

    if (pageError) {
      console.error('Supabase Appointments Page Fetch Error:', pageError);
      throw pageError;
    }

    // total count (separate count query without joins)
    let countQuery = supabase
      .from('Appointments')
      .select('appointment_id', { count: 'exact', head: true })
      .eq('appointment_date', targetDate)
      .neq('status', 'Canceled');
    if (status && status !== 'All') {
      countQuery = countQuery.eq('status', status);
    }
    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error('Supabase Appointments Count Error:', countError);
      throw countError;
    }

    const formattedAppts = (pageData as any[] || []).map((appt: any) => {
      const patientName = appt.Patient?.User?.name || 'N/A';
      const doctorName = appt.Doctor?.User?.name || 'N/A';
      return {
        id: appt.appointment_id,
        time: appt.appointment_time,
        patientName,
        doctorName,
        reason: appt.reason,
        status: appt.status,
      };
    });

    if (format === 'csv') {
      // Simple CSV (no commas in fields assumed). For production, consider a robust CSV lib.
      const header = 'id,time,patientName,doctorName,reason,status';
      const rows = formattedAppts.map(a => [a.id, a.time, a.patientName, a.doctorName, a.reason, a.status]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      const csv = [header, ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="appointments_${targetDate}.csv"`);
      return res.status(200).send(csv);
    }

    return res.status(200).json({
      data: formattedAppts,
      meta: {
        total: count || 0,
        page: pageNum,
        pageSize: sizeNum,
        totalPages: Math.ceil((count || 0) / sizeNum),
        date: targetDate,
        status: status || 'All',
      }
    });
  } catch (err: any) {
    console.error('Daily Appointments Fetch Error:', err);
    res.status(500).json({ message: 'Failed to fetch appointments.' });
  }
});

// @route   PATCH /api/staff/appointments/:id/status
// @desc    Update appointment status (e.g., Scheduled -> Checked-In/Completed/No-Show)
// @access  Private (Staff Only)
router.patch('/appointments/:id/status', protect, restrictToStaff, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status?: string };
    const allowed = ['Scheduled', 'Checked-In', 'Completed', 'No-Show', 'Canceled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const { data, error } = await supabase
      .from('Appointments')
      .update({ status })
      .eq('appointment_id', id)
      .select('appointment_id, status')
      .single();

    if (error) {
      console.error('Supabase Appointment Status Update Error:', error);
      return res.status(500).json({ message: 'Failed to update status.' });
    }

    return res.status(200).json({ message: 'Status updated.', appointment: data });
  } catch (err: any) {
    console.error('Appointment Status Update Error:', err);
    res.status(500).json({ message: 'Failed to update appointment status.' });
  }
});

export default router;
