import express from 'express';
import { supabase } from '../../db';

const router = express.Router();

// GET /api/doctors
// Returns doctors with department_name and user name
router.get('/doctors', async (_req, res) => {
  try {
    const { data: docs, error: dErr } = await supabase
      .from('Doctor')
      .select('doctor_id, department_id, specialization, profile_picture_url, experience_years, education, bio, languages_spoken, User(name)');
    if (dErr) throw dErr;

    // Department map
    let deptMap: Record<number, string> = {};
    const deptIds = Array.from(new Set((docs || []).map((d: any) => d.department_id).filter(Boolean)));
    if (deptIds.length) {
      const { data: depts, error: deptErr } = await supabase
        .from('Departments')
        .select('department_id, name')
        .in('department_id', deptIds as any);
      if (!deptErr && depts) {
        deptMap = Object.fromEntries((depts as any[]).map(d => [d.department_id, d.name]));
      }
    }

    const out = (docs || []).map((d: any) => {
      const userRel = Array.isArray(d.User) ? d.User[0] : d.User;
      // Normalize languages to a readable string
      const langs = Array.isArray(d.languages_spoken) ? (d.languages_spoken as any[]).join(', ') : (d.languages_spoken ?? null);
      return {
        doctor_id: d.doctor_id,
        doctor_name: userRel?.name || '',
        department_id: d.department_id,
        department_name: deptMap[d.department_id] || undefined,
        profile_image: d.profile_picture_url || null,
        specialization: d.specialization ?? null,
        experience_years: d.experience_years ?? null,
        education: d.education ?? null,
        bio: d.bio ?? null,
        languages_spoken: langs,
      };
    });

    return res.status(200).json({ success: true, data: out });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch doctors' });
  }
});

export default router;
