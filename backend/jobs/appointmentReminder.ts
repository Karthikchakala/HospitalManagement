import cron from 'node-cron';
import { supabase } from '../db';
import { sendMail } from '../mailer/transport';

function toDateTime(dateStr: string, timeStr: string) {
  // dateStr: YYYY-MM-DD, timeStr: HH:mm:ss or HH:mm
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm, ss] = timeStr.split(':').map(Number);
  const dt = new Date(y, (m - 1), d, hh || 0, mm || 0, ss || 0, 0);
  return dt;
}

export function startAppointmentReminderJob() {
  // Run every minute
  const sent: Map<number, number> = new Map();
  cron.schedule('* * * * *', () => {
    void (async () => {
      try {
        const now = new Date();
        const targetMinute = new Date(now.getTime() + 60 * 60 * 1000);
        targetMinute.setSeconds(0, 0);

        const todayStr = now.toISOString().slice(0, 10);
        const tomorrowStr = new Date(now.getTime() + 24*60*60*1000).toISOString().slice(0, 10);

        const { data: appts, error } = await supabase
          .from('Appointments')
          .select('appointment_id, patient_id, doctor_id, appointment_date, appointment_time, Patient(reminder_email_opt_in, reminder_sms_opt_in, User(name,email)), Doctor(User(name))')
          .in('appointment_date', [todayStr, tomorrowStr]);

        if (error) {
          console.error('[ReminderJob] fetch error', error.message);
          return;
        }

        for (const [id, ts] of [...sent.entries()]) {
          if (now.getTime() - ts > 5 * 60 * 1000) {
            sent.delete(id);
          }
        }

        const list = (appts || []) as any[];
        const tasks: Promise<any>[] = [];

        for (const appt of list) {
          const apptDate: string = appt.appointment_date;
          const apptTime: string = appt.appointment_time;
          if (!apptDate || !apptTime) continue;

          const startAt = toDateTime(apptDate, apptTime);
          const startMinute = new Date(startAt);
          startMinute.setSeconds(0, 0);

          if (startMinute.getTime() !== targetMinute.getTime()) continue;
          const apptId = Number(appt.appointment_id);
          if (sent.has(apptId)) continue;

          const to = appt.Patient?.User?.[0]?.email;
          const emailOptIn = (typeof appt.Patient?.reminder_email_opt_in === 'boolean') ? appt.Patient?.reminder_email_opt_in : true;
          const patientName = appt.Patient?.User?.[0]?.name || 'Patient';
          const doctorName = appt.Doctor?.User?.[0]?.name || 'Doctor';
          if (!to || !emailOptIn) continue;

          const when = startAt.toLocaleString();
          const html = `
              <div style="font-family:Arial,Helvetica,sans-serif">
                <h2>Appointment Reminder</h2>
                <p>Dear ${patientName},</p>
                <p>This is a reminder for your appointment in approximately 1 hour.</p>
                <ul>
                  <li><b>Doctor:</b> ${doctorName}</li>
                  <li><b>Date & Time:</b> ${when}</li>
                </ul>
                <p>Please arrive atleast 15 minutes early.</p>
                <p>— Hospify</p>
              </div>`;

          const task = (async () => {
            try {
              await sendMail({ to, subject: 'Appointment reminder (in 1 hour)', html });
              sent.set(apptId, Date.now());
              try {
                await supabase.from('Appointments').update({ remainder_sent: true }).eq('appointment_id', apptId);
              } catch {}
              try {
                await supabase.from('Appointments').update({ reminder_sent: true }).eq('appointment_id', apptId);
              } catch {}
              console.log(`[ReminderJob] Reminder sent for appointment_id=${apptId}`);
            } catch (e:any) {
              console.error('[ReminderJob] sendMail failed', e?.message || e);
            }
          })();
          tasks.push(task);
        }

        if (tasks.length) {
          await Promise.allSettled(tasks);
        }
      } catch (e:any) {
        console.error('[ReminderJob] Unhandled error', e?.message || e);
      }
    })();
  });
}
