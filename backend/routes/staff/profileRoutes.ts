// backend/routes/staff/profileRoutes.ts
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

// Middleware to ensure only Staff can access these routes
const restrictToStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role?.toLowerCase();
    if (userRole !== 'staff') {
        return res.status(403).json({ message: 'Access denied: Must be a Staff member' });
    }
    next();
};

// @route   GET /api/staff/profile
// @desc    Get the profile (User and Staff details) of the authenticated Staff member
// @access  Private (Staff Only)
router.get('/profile', protect, restrictToStaff, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // 1. Fetch BASIC USER DATA (Name, Email, Role)
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('user_id, name, email, role')
      .eq('user_id', userId)
      .single();

    if (userError) {
        console.error("Supabase User Data Fetch Error:", userError);
        throw userError;
    }
    
    // 2. Fetch STAFF-SPECIFIC DATA (Designation, etc.)
    const { data: staffData, error: staffError } = await supabase
      .from('Staff')
      .select('staff_id, designation')
      .eq('user_id', userId)
      .single();

    if (staffError) {
        console.error("Supabase Staff Data Fetch Error:", staffError);
        throw staffError;
    }
    
    // 3. Combine data into a single, flat profile object for the frontend
    const profile = {
        // Data from User table
        name: userData.name,
        email: userData.email,
        role: userData.role,
        // Data from Staff table
        designation: staffData.designation,
        staff_id: staffData.staff_id,
    };

    res.status(200).json(profile);
  } catch (err) {
    console.error('Staff Profile GET Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;