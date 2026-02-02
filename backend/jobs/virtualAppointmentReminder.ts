import cron from 'node-cron';
import { supabase } from '../db';
import { sendMail } from '../mailer/transport';

function toDateTime(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm, ss] = timeStr.split(':').map(Number);
  return new Date(y, (m - 1), d, hh || 0, mm || 0, ss || 0, 0);
}

export function startVirtualAppointmentReminderJob() {
  const sent: Map<number, number> = new Map();

  cron.schedule('* * * * *', () => {
    void (async () => {
      try {
        const now = new Date();
        const targetMinute = new Date(now.getTime() + 60 * 60 * 1000);
        targetMinute.setSeconds(0, 0);

        const todayStr = now.toISOString().slice(0, 10);
        const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const { data, error } = await supabase
          .from('VirtualAppointments')
          .select(`
            virtual_appointment_id,
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            webrtc_link,
            Patient(reminder_email_opt_in, User(name, email)),
            Doctor(User(name, email))
          `)
          .in('appointment_date', [todayStr, tomorrowStr])
          .in('status', ['Scheduled', 'Accepted']);

        if (error) {
          console.error('[VirtualReminderJob] fetch error', error.message);
          return;
        }

        for (const [id, ts] of [...sent.entries()]) {
          if (now.getTime() - ts > 5 * 60 * 1000) {
            sent.delete(id);
          }
        }

        const list = (data || []) as any[];
        const tasks: Promise<any>[] = [];

        for (const appt of list) {
          const apptDate: string = appt.appointment_date;
          const apptTime: string = appt.appointment_time;
          if (!apptDate || !apptTime) continue;

          const startAt = toDateTime(apptDate, apptTime);
          const startMinute = new Date(startAt);
          startMinute.setSeconds(0, 0);

          if (startMinute.getTime() !== targetMinute.getTime()) continue;
          const id = Number(appt.virtual_appointment_id);
          if (sent.has(id)) continue;

          const patientEmail = appt.Patient?.User?.[0]?.email || appt.Patient?.User?.email;
          const doctorEmail = appt.Doctor?.User?.[0]?.email || appt.Doctor?.User?.email;
          const patientName = appt.Patient?.User?.[0]?.name || appt.Patient?.User?.name || 'Patient';
          const doctorName = appt.Doctor?.User?.[0]?.name || appt.Doctor?.User?.name || 'Doctor';
          const emailOptIn = typeof appt.Patient?.reminder_email_opt_in === 'boolean' ? appt.Patient?.reminder_email_opt_in : true;
          if (!patientEmail || !doctorEmail || !emailOptIn) continue;

          const when = startAt.toLocaleString();
          const link = appt.webrtc_link;
          const html = `
            <div style="font-family:Arial,Helvetica,sans-serif">
              <h2>Virtual Appointment Reminder</h2>
              <p>Dear ${patientName} and ${doctorName},</p>
              <p>This is a reminder for your virtual appointment in exactly 1 hour.</p>
              <ul>
                <li><b>Date & Time:</b> ${when}</li>
                <li><b>Meeting Link:</b> <a href="${link}">${link}</a></li>
              </ul>
              <p>Please join a few minutes early to test audio/video.</p>
              <p>— Hospify</p>
            </div>
          `;

          const task = (async () => {
            try {
              await sendMail({ to: patientEmail, subject: 'Virtual appointment reminder (in 1 hour)', html });
              await sendMail({ to: doctorEmail, subject: 'Virtual appointment reminder (in 1 hour)', html });
              sent.set(id, Date.now());
              console.log(`[VirtualReminderJob] Sent reminders for virtual_appointment_id=${id}`);
            } catch (e: any) {
              console.error('[VirtualReminderJob] sendMail failed', e?.message || e);
            }
          })();

          tasks.push(task);
        }

        if (tasks.length) {
          await Promise.allSettled(tasks);
        }
      } catch (e: any) {
        console.error('[VirtualReminderJob] Unhandled error', e?.message || e);
      }
    })();
  });
}
