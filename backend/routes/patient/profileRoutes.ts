// backend/routes/patient/profileRoutes.ts
import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();


// @route   GET /api/patient/profile
// @desc    Get the profile of the authenticated patient
// @access  Private
router.get('/profile', protect, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { data: userProfile, error } = await supabase
      .from('User')
      .select(`
        user_id,
        name,
        email,
        role,
        Patient(
          patient_id,
          aadhaar_number,
          father_name,
          mother_name,
          additional_phone_number,
          blood_group,
          age,
          gender,
          street,
          city,
          district,
          state,
          country
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json(userProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/patient/profile
// @desc    Update the profile of the authenticated patient
// @access  Private
router.put('/profile', protect, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const updatedData = req.body;

    // Use the `update` query to save changes to the Patient table
    const { data: updatedPatient, error } = await supabase
      .from('Patient')
      .update(updatedData)
      .eq('user_id', userId) // Find the patient record by user ID
      .select();

    if (error) {
      throw error;
    }

    if (!updatedPatient) {
      return res.status(404).json({ message: 'Patient record not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', updatedPatient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Preferences: Reminder opt-in/out ---
// @route   GET /api/patient/preferences
// @desc    Get reminder preferences (email/sms). Defaults to true if not set.
// @access  Private
router.get('/preferences', protect, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const { data: prefRow, error } = await supabase
      .from('Patient')
      .select('reminder_email_opt_in, reminder_sms_opt_in')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // ignore no rows
      console.error('Preferences GET error:', error.message);
    }

    const emailOptIn = prefRow?.reminder_email_opt_in;
    const smsOptIn = prefRow?.reminder_sms_opt_in;
    return res.status(200).json({
      email: typeof emailOptIn === 'boolean' ? emailOptIn : true,
      sms: typeof smsOptIn === 'boolean' ? smsOptIn : true,
    });
  } catch (e:any) {
    console.error('Preferences GET unhandled:', e?.message || e);
    return res.status(500).json({ message: 'Failed to fetch preferences' });
  }
});

// @route   PUT /api/patient/preferences
// @desc    Update reminder preferences (email/sms)
// @access  Private
router.put('/preferences', protect, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });
    const { email, sms } = req.body as { email?: boolean; sms?: boolean };

    const { data, error } = await supabase
      .from('Patient')
      .update({
        ...(typeof email === 'boolean' ? { reminder_email_opt_in: email } : {}),
        ...(typeof sms === 'boolean' ? { reminder_sms_opt_in: sms } : {}),
      })
      .eq('user_id', userId)
      .select('reminder_email_opt_in, reminder_sms_opt_in')
      .single();

    if (error) {
      console.error('Preferences PUT error:', error.message);
      return res.status(500).json({ message: 'Failed to update preferences. Ensure DB columns exist.' });
    }

    return res.status(200).json({
      email: typeof data?.reminder_email_opt_in === 'boolean' ? data?.reminder_email_opt_in : true,
      sms: typeof data?.reminder_sms_opt_in === 'boolean' ? data?.reminder_sms_opt_in : true,
    });
  } catch (e:any) {
    console.error('Preferences PUT unhandled:', e?.message || e);
    return res.status(500).json({ message: 'Failed to update preferences' });
  }
});

export default router;