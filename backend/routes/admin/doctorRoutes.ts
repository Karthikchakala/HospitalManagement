// backend/routes/admin/doctorRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

// Extend the Request type for the user property (from authMiddleware)
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware to ensure only Admins can access these routes
const restrictToAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Convert the role to lowercase to handle potential casing issues
    const userRole = req.user?.role?.toLowerCase(); 

    if (userRole !== 'admin') {
        console.warn(`ACCESS DENIED: User ID ${req.user?.id} attempted to access Admin Doctor routes with role: ${req.user?.role}`);
        return res.status(403).json({ message: 'Access denied: Must be an Admin' });
    }
    next();
};

// @route   GET /api/admin/doctors
// @desc    Get a list of all doctors with their specialization and user info
// @access  Private (Admin Only)
router.get('/doctors', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Fetch all doctor records, joining with the User table for name and email
    const { data: doctors, error } = await supabase
      .from('Doctor')
      .select(`
        doctor_id,
        specialization,
        license_number,
        userData:User!inner(user_id, name, email)
      `)
      .order('doctor_id', { ascending: true });

    if (error) {
      console.error("Supabase Admin Doctors Fetch Error:", error);
      throw error;
    }

    // CRITICAL FIX: Transform the data to access the nested User object correctly
    const formattedDoctors = doctors.map(doctor => {
        // Safe access: If User exists and is an array, get the first element; otherwise, use N/A
        const rawUserData = doctor.userData; 

    // Step 2: Safely extract the user object. Check if it's an array and take the first element,
    // otherwise, assume it is the object itself.
    const user = rawUserData 
                 ? (Array.isArray(rawUserData) ? rawUserData[0] : rawUserData)
                 : null; 

    // Step 3: Ensure the final user object is not null/undefined for mapping
    const finalUser = user || { name: 'N/A', email: 'N/A', user_id: null };
        
        return {
            id: doctor.doctor_id,
            name: finalUser.name, 
            email: finalUser.email, 
            specialization: doctor.specialization,
            license: doctor.license_number,
        };
    });

    res.status(200).json(formattedDoctors);
  } catch (err) {
    console.error('Admin Doctor Fetch Request Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/doctors/:id
// @desc    Update a doctor's user and profile data by doctor_id (Admin Only)
// @access  Private (Admin Only)
router.put('/doctors/:id', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.params.id;
    const { name, email, specialization, license, user_id } = req.body;

    if (!user_id || !name || !email || !specialization) {
        return res.status(400).json({ message: 'Missing required fields for update.' });
    }

    // 1. UPDATE USER TABLE (Name and Email)
    const { data: updatedUser, error: userUpdateError } = await supabase
      .from('User')
      .update({ name, email })
      .eq('user_id', user_id)
      .select('name, email');

    if (userUpdateError) throw userUpdateError;

    // 2. UPDATE DOCTOR TABLE (Specialization and License)
    const { data: updatedDoctor, error: doctorUpdateError } = await supabase
      .from('Doctor')
      .update({ specialization, license_number: license }) // Note: license_number is used in DB
      .eq('doctor_id', doctorId) 
      .select('specialization, license_number');

    if (doctorUpdateError) throw doctorUpdateError;

    // 3. Success Response (Combined for frontend refresh)
    res.status(200).json({
        id: doctorId,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        specialization: updatedDoctor[0].specialization,
        license: updatedDoctor[0].license_number
    });

  } catch (err: any) {
    console.error('Admin Doctor PUT Error:', err);
    // Unique constraint violation (e.g., trying to use an email already taken)
    if (err.code === '23505') { 
        return res.status(400).json({ message: 'Error: Email already in use.' });
    }
    res.status(500).json({ message: 'Server error: Failed to update doctor profile.' });
  }
});

export default router;