import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../../db';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

const restrictToAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== 'admin') return res.status(403).json({ message: 'Access denied: Must be an Admin' });
  next();
};

function parseRange(period?: string, range?: string) {
  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  let from: Date;
  let to: Date;
  if (range && range.includes('_to_')) {
    const [a, b] = range.split('_to_');
    from = new Date(a);
    to = new Date(b);
  } else {
    const p = (period || 'month').toLowerCase();
    if (p === 'day' || p === 'daily' || p === 'today') {
      from = startOfDay(today);
      to = new Date(from);
      to.setDate(to.getDate() + 1);
    } else if (p === 'week' || p === 'weekly') {
      const day = today.getDay();
      const diff = (day + 6) % 7; // Monday start
      from = startOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() - diff));
      to = new Date(from);
      to.setDate(to.getDate() + 7);
    } else if (p === 'year' || p === 'yearly') {
      from = new Date(today.getFullYear(), 0, 1);
      to = new Date(today.getFullYear() + 1, 0, 1);
    } else {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      to = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }
  }
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  return { from, to, fromStr, toStr };
}

function pct(n: number, d: number) {
  return d > 0 ? +(100 * n / d).toFixed(2) : 0;
}

router.get('/analytics/revenue', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { period, range } = req.query as Record<string, string | undefined>;
    const { fromStr, toStr } = parseRange(period, range);

    const { data: bills, error } = await supabase
      .from('Billing')
      .select('bill_id, appointment_id, services, total_amount, status, payment_date')
      .eq('status', 'Paid')
      .gte('payment_date', fromStr)
      .lt('payment_date', toStr);

    if (error) return res.status(500).json({ message: 'Failed to fetch billing data' });

    const appIds = Array.from(new Set((bills || []).map((b: any) => b.appointment_id).filter(Boolean)));

    let deptByAppt: Record<number, { department_id?: number; department_name?: string }> = {};
    if (appIds.length > 0) {
      const { data: appts } = await supabase
        .from('Appointments')
        .select('appointment_id, doctor_id')
        .in('appointment_id', appIds as any);

      const doctorIds = Array.from(new Set((appts || []).map((a: any) => a.doctor_id).filter(Boolean)));
      let doctorToDept: Record<number, number> = {};
      if (doctorIds.length > 0) {
        const { data: docs } = await supabase
          .from('Doctor')
          .select('doctor_id, department_id')
          .in('doctor_id', doctorIds as any);
        (docs || []).forEach((d: any) => { if (d.department_id) doctorToDept[d.doctor_id] = d.department_id; });
      }

      const deptIds = Array.from(new Set(Object.values(doctorToDept)));
      let deptMap: Record<number, string> = {};
      if (deptIds.length > 0) {
        const { data: depts } = await supabase
          .from('Departments')
          .select('department_id, name')
          .in('department_id', deptIds as any);
        (depts || []).forEach((d: any) => { deptMap[d.department_id] = d.name; });
      }

      (appts || []).forEach((a: any) => {
        const depId = doctorToDept[a.doctor_id];
        deptByAppt[a.appointment_id] = { department_id: depId, department_name: depId ? deptMap[depId] : undefined };
      });
    }

    const byDept: Record<string, number> = {};
    let total = 0;
    const normDept = (label: string) => label || 'Other';

    (bills || []).forEach((b: any) => {
      const amt = Number(b.total_amount || 0) || 0;
      total += amt;
      let label = 'Other';
      const s = String(b.services || '').toLowerCase();
      if (b.appointment_id && deptByAppt[b.appointment_id]?.department_name) {
        label = deptByAppt[b.appointment_id].department_name as string;
      } else if (s.includes('home visit')) {
        label = 'Home Visit';
      } else if (s.includes('pharmacy')) {
        label = 'Pharmacy';
      } else if (s.includes('lab') || s.includes('diagnos')) {
        label = 'Laboratory';
      } else if (s.includes('virtual') || s.includes('video')) {
        label = 'Virtual Consultation';
      } else if (s.includes('inpatient')) {
        label = 'Inpatient';
      }
      byDept[normDept(label)] = (byDept[normDept(label)] || 0) + amt;
    });

    const byDeptArr = Object.entries(byDept).map(([label, value]) => ({ label, value }));

    const trendMap: Record<string, number> = {};
    (bills || []).forEach((b: any) => {
      const d = (b.payment_date || '').slice(0, 10);
      trendMap[d] = (trendMap[d] || 0) + (Number(b.total_amount || 0) || 0);
    });
    const trend = Object.entries(trendMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));

    const share = byDeptArr.map(x => ({ label: x.label, value: +pct(x.value, total).toFixed(2) }));

    return res.status(200).json({ totalRevenue: total, byDepartment: byDeptArr, trend, share });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Server error' });
  }
});

router.get('/analytics/revenue/department', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { range } = req.query as Record<string, string | undefined>;
    const { fromStr, toStr } = parseRange(undefined, range);

    const { data: bills, error } = await supabase
      .from('Billing')
      .select('bill_id, appointment_id, services, total_amount, status, payment_date')
      .eq('status', 'Paid')
      .gte('payment_date', fromStr)
      .lt('payment_date', toStr);

    if (error) return res.status(500).json({ message: 'Failed to fetch billing data' });

    const appIds = Array.from(new Set((bills || []).map((b: any) => b.appointment_id).filter(Boolean)));

    let deptByAppt: Record<number, string> = {};
    if (appIds.length > 0) {
      const { data: appts } = await supabase
        .from('Appointments')
        .select('appointment_id, doctor_id')
        .in('appointment_id', appIds as any);

      const doctorIds = Array.from(new Set((appts || []).map((a: any) => a.doctor_id).filter(Boolean)));
      let doctorToDept: Record<number, number> = {};
      if (doctorIds.length > 0) {
        const { data: docs } = await supabase
          .from('Doctor')
          .select('doctor_id, department_id')
          .in('doctor_id', doctorIds as any);
        (docs || []).forEach((d: any) => { if (d.department_id) doctorToDept[d.doctor_id] = d.department_id; });
      }

      const deptIds = Array.from(new Set(Object.values(doctorToDept)));
      let deptMap: Record<number, string> = {};
      if (deptIds.length > 0) {
        const { data: depts } = await supabase
          .from('Departments')
          .select('department_id, name')
          .in('department_id', deptIds as any);
        (depts || []).forEach((d: any) => { deptMap[d.department_id] = d.name; });
      }

      (appts || []).forEach((a: any) => {
        const depId = doctorToDept[a.doctor_id];
        deptByAppt[a.appointment_id] = depId ? deptMap[depId] : 'Other';
      });
    }

    const out: Record<string, number> = {};
    (bills || []).forEach((b: any) => {
      const amt = Number(b.total_amount || 0) || 0;
      const s = String(b.services || '').toLowerCase();
      let label = 'Other';
      if (b.appointment_id && deptByAppt[b.appointment_id]) label = deptByAppt[b.appointment_id];
      else if (s.includes('home visit')) label = 'Home Visit';
      else if (s.includes('pharmacy')) label = 'Pharmacy';
      else if (s.includes('lab') || s.includes('diagnos')) label = 'Laboratory';
      else if (s.includes('virtual') || s.includes('video')) label = 'Virtual Consultation';
      else if (s.includes('inpatient')) label = 'Inpatient';
      out[label] = (out[label] || 0) + amt;
    });

    const rows = Object.entries(out).map(([label, value]) => ({ label, value }));
    return res.status(200).json({ from: fromStr, to: toStr, byDepartment: rows });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Server error' });
  }
});

router.get('/analytics/patients/department', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { period, range } = req.query as Record<string, string | undefined>;
    const { fromStr, toStr } = parseRange(period, range);

    const { data: appts, error } = await supabase
      .from('Appointments')
      .select('appointment_id, appointment_date, status, doctor_id')
      .gte('appointment_date', fromStr)
      .lt('appointment_date', toStr)
      .neq('status', 'Canceled');

    if (error) return res.status(500).json({ message: 'Failed to fetch appointments' });

    // Also include Virtual Appointments
    const { data: vAppts } = await supabase
      .from('VirtualAppointments')
      .select('virtual_appointment_id, appointment_date, status, doctor_id')
      .gte('appointment_date', fromStr)
      .lt('appointment_date', toStr)
      .neq('status', 'Canceled');

    const allAppts = [...(appts || []), ...((vAppts as any[]) || [])];
    const doctorIds = Array.from(new Set(allAppts.map((a: any) => a.doctor_id).filter(Boolean)));
    let doctorToDept: Record<number, number> = {};
    if (doctorIds.length > 0) {
      const { data: docs } = await supabase
        .from('Doctor')
        .select('doctor_id, department_id')
        .in('doctor_id', doctorIds as any);
      (docs || []).forEach((d: any) => { if (d.department_id) doctorToDept[d.doctor_id] = d.department_id; });
    }

    const deptIds = Array.from(new Set(Object.values(doctorToDept)));
    let deptMap: Record<number, string> = {};
    if (deptIds.length > 0) {
      const { data: depts } = await supabase
        .from('Departments')
        .select('department_id, name')
        .in('department_id', deptIds as any);
      (depts || []).forEach((d: any) => { deptMap[d.department_id] = d.name; });
    }

    const byDept: Record<string, number> = {};
    allAppts.forEach((a: any) => {
      const depId = doctorToDept[a.doctor_id];
      const label = depId ? (deptMap[depId] || 'Other') : 'Other';
      byDept[label] = (byDept[label] || 0) + 1;
    });

    const trendMap: Record<string, number> = {};
    allAppts.forEach((a: any) => {
      const d = (a.appointment_date || '').slice(0, 10);
      trendMap[d] = (trendMap[d] || 0) + 1;
    });

    const rows = Object.entries(byDept).map(([label, value]) => ({ label, value }));
    const trend = Object.entries(trendMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));

    return res.status(200).json({ byDepartment: rows, trend });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Server error' });
  }
});

router.get('/analytics/patients/doctor', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { period, range } = req.query as Record<string, string | undefined>;
    const { fromStr, toStr } = parseRange(period, range);

    const { data: appts, error } = await supabase
      .from('Appointments')
      .select('appointment_id, appointment_date, status, doctor_id')
      .gte('appointment_date', fromStr)
      .lt('appointment_date', toStr)
      .neq('status', 'Canceled');

    if (error) return res.status(500).json({ message: 'Failed to fetch appointments' });

    // Include virtual appointments
    const { data: vAppts } = await supabase
      .from('VirtualAppointments')
      .select('virtual_appointment_id, appointment_date, status, doctor_id')
      .gte('appointment_date', fromStr)
      .lt('appointment_date', toStr)
      .neq('status', 'Canceled');

    const allAppts = [...(appts || []), ...((vAppts as any[]) || [])];

    const doctorIds = Array.from(new Set(allAppts.map((a: any) => a.doctor_id).filter(Boolean)));
    let docNameMap: Record<number, string> = {};
    if (doctorIds.length > 0) {
      const { data: docs } = await supabase
        .from('Doctor')
        .select('doctor_id, User(name)')
        .in('doctor_id', doctorIds as any);
      (docs || []).forEach((d: any) => {
        const u = Array.isArray(d.User) ? d.User[0] : d.User;
        docNameMap[d.doctor_id] = u?.name || `Doctor #${d.doctor_id}`;
      });
    }

    const byDoctor: Record<string, number> = {};
    allAppts.forEach((a: any) => {
      const label = docNameMap[a.doctor_id] || `Doctor #${a.doctor_id}`;
      byDoctor[label] = (byDoctor[label] || 0) + 1;
    });

    const rows = Object.entries(byDoctor)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const top10 = rows.slice(0, 10);

    const trendMap: Record<string, number> = {};
    allAppts.forEach((a: any) => {
      const d = (a.appointment_date || '').slice(0, 10);
      trendMap[d] = (trendMap[d] || 0) + 1;
    });
    const trend = Object.entries(trendMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));

    return res.status(200).json({ byDoctor: rows, top10, trend });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Server error' });
  }
});

router.get('/analytics/staff/performance', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { role, period, range } = req.query as Record<string, string | undefined>;
    const { fromStr, toStr } = parseRange(period, range);

    const { data: appts } = await supabase
      .from('Appointments')
      .select('appointment_id, appointment_date, status')
      .gte('appointment_date', fromStr)
      .lt('appointment_date', toStr);

    const totalAppointmentsBooked = (appts || []).length;
    const cancellationsHandled = (appts || []).filter((a: any) => a.status === 'Canceled').length;

    const { data: pharmacyBills } = await supabase
      .from('Billing')
      .select('bill_id, services, total_amount, payment_date, status')
      .gte('payment_date', fromStr)
      .lt('payment_date', toStr)
      .ilike('services', '%pharmacy%');

    const totalRxDispensed = (pharmacyBills || []).length;
    const pharmacyRevenue = (pharmacyBills || []).reduce((s: number, b: any) => s + (Number(b.total_amount || 0) || 0), 0);

    const { data: labBills } = await supabase
      .from('Billing')
      .select('bill_id, services, total_amount, payment_date, status')
      .gte('payment_date', fromStr)
      .lt('payment_date', toStr)
      .or('services.ilike.%lab%,services.ilike.%diagnos%');

    const labRevenue = (labBills || []).reduce((s: number, b: any) => s + (Number(b.total_amount || 0) || 0), 0);

    const { data: labTests } = await supabase
      .from('LabTests')
      .select('lab_test_id, status, completed_at, requested_at')
      .gte('requested_at', fromStr)
      .lt('requested_at', toStr);

    const totalTestsPerformed = (labTests || []).filter((t: any) => String(t.status).toLowerCase() === 'completed').length;

    const categories = [
      { label: 'Receptionists', metrics: { appointmentsBooked: totalAppointmentsBooked, patientsRegistered: null, cancellationsHandled } },
      { label: 'Pharmacists', metrics: { prescriptionsDispensed: totalRxDispensed, pharmacyRevenue: +pharmacyRevenue.toFixed(2) } },
      { label: 'Laboratorists', metrics: { testsPerformed: totalTestsPerformed, diagnosticsRevenue: +labRevenue.toFixed(2) } },
    ];

    const filtered = role ? categories.filter(c => c.label.toLowerCase() === role.toLowerCase()) : categories;

    return res.status(200).json({ period: { from: fromStr, to: toStr }, categories: filtered });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Server error' });
  }
});

export default router;
