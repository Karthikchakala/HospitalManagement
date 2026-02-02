import cron from 'node-cron';
import { supabase } from '../db';
import { sendMail } from '../mailer/transport';

export function startHomeVisitReminderJob() {
  // Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const dateStr = inOneHour.toISOString().slice(0, 10); // YYYY-MM-DD (in local date this is close enough)

      // Fetch by date only, filter in code to a ~60 min window to avoid exact HH:MM match issues
      const { data: visits, error } = await supabase
        .from('HomeVisit')
        .select('*')
        .eq('visit_date', dateStr)
        .in('status', ['Pending', 'Accepted']);
      if (error || !visits || visits.length === 0) return;

      for (const v of visits) {
        const { data: patient, error: pErr } = await supabase
          .from('Patient')
          .select('patient_id, User(name, email)')
          .eq('patient_id', v.patient_id)
          .single();
        const patientUser = patient ? (Array.isArray((patient as any).User) ? (patient as any).User[0] : (patient as any).User) : null;
        if (pErr || !patientUser?.email) continue;

        // Combine date + time into a Date in local time
        // v.visit_time is time without tz; create ISO-like string without Z to get local
        const targetStr = `${v.visit_date}T${String(v.visit_time).slice(0,5)}`; // YYYY-MM-DDTHH:MM
        const target = new Date(targetStr);
        const diffMinutes = (target.getTime() - now.getTime()) / 60000;

        // Send reminder when within ~60 ± 2.5 minutes window
        if (Math.abs(diffMinutes - 60) > 2.5) continue;

        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#334155">
            <h2 style="color:#0ea5e9;margin:0 0 12px">Appointment Reminder</h2>
            <p>Hi ${patientUser.name || 'Patient'}, this is a reminder for your upcoming home visit in about 1 hour.</p>
            <ul>
              <li><strong>Service:</strong> ${v.service_type}</li>
              <li><strong>Date:</strong> ${v.visit_date}</li>
              <li><strong>Time:</strong> ${v.visit_time}</li>
              <li><strong>Address:</strong> ${v.address}</li>
              <li><strong>Status:</strong> ${v.status}</li>
            </ul>
            <p style="color:#64748b;font-size:12px">This is an automated message. Please do not reply.</p>
          </div>
        `;

        try {
          await sendMail({ to: patientUser.email, subject: 'Home Visit Reminder', html });
        } catch (e) {
          // continue loop
        }
      }
    } catch {
      // swallow errors to avoid crashing the scheduler
    }
  });
}
