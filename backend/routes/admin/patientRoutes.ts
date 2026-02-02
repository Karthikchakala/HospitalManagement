// backend/routes/admin/patientRoutes.ts
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
        console.warn(`ACCESS DENIED: User ID ${req.user?.id} attempted to access Admin Patient routes with role: ${req.user?.role}`);
        return res.status(403).json({ message: 'Access denied: Must be an Admin' });
    }
    next();
};

// @route   GET /api/admin/patients
// @desc    Get a list of all patients and their basic profile information
// @access  Private (Admin Only)
router.get('/patients', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Fetch all patient records, joining with the User table for name and email
    const { data: patients, error } = await supabase
      .from('Patient')
      .select(`
        patient_id,
        blood_group,
        age,
        city,
        User!inner(user_id, name, email)
      `)
      .order('patient_id', { ascending: true });

    if (error) {
      console.error("Supabase Admin Patients Fetch Error:", error);
      throw error;
    }
    console.log("Raw staff data:", JSON.stringify(patients, null, 2));

    // CRITICAL FIX: Transform the data to safely access the nested User array
    const formattedPatients = patients.map(patient => {
        // Access the first element of the nested User array (or use N/A if missing)
        const rawUserData = patient.User; 

    // Step 2: Extract the user object. Check if it's an array and take the first element,
    // otherwise, assume it is the object itself.
    const user = rawUserData 
                 ? (Array.isArray(rawUserData) ? rawUserData[0] : rawUserData)
                 : null; // Use null here initially

    // Step 3: Ensure the final user object is not null/undefined for mapping
    const finalUser = user || { name: 'N/A', email: 'N/A', user_id: null };
        
        return {
            id: patient.patient_id,
            name: finalUser.name, 
            email: finalUser.email,
            age: patient.age,
            blood_group: patient.blood_group,
            city: patient.city,
        };
    });

    res.status(200).json(formattedPatients);
  } catch (err) {
    console.error('Admin Patient Fetch Request Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;