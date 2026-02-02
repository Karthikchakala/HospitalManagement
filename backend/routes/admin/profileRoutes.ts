// backend/routes/admin/profileRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware to ensure only Admins can access these routes
const restrictToAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Must be an Admin' });
    }
    next();
};

// @route   GET /api/admin/profile
// @desc    Get the profile of the authenticated Admin
// @access  Private (Admin Only)
router.get('/profile', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Fetch name and email from the User table
    const { data: userData, error } = await supabase
      .from('User')
      .select('name, email, role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Supabase Admin Profile Fetch Error:", error);
      throw error;
    }

    if (!userData) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    res.status(200).json(userData);
  } catch (err) {
    console.error('Admin Profile GET Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;