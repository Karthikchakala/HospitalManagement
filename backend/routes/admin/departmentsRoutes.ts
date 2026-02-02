// backend/routes/admin/departmentRoutes.ts
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
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Must be an Admin' });
    }
    next();
};

// --- GET ALL DEPARTMENTS (READ) ---
router.get('/departments', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { data: departments, error } = await supabase
            .from('Departments')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        res.status(200).json(departments);
    } catch (err: any) { // Consistent naming: err
        console.error('Departments GET Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- CREATE NEW DEPARTMENT (POST) ---
router.post('/departments', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Department name is required.' });
        }

        const { data: newDept, error } = await supabase
            .from('Departments')
            .insert([{ name, description }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Department created successfully', department: newDept[0] });
    } catch (err: any) { // Consistent naming: err
        console.error('Departments POST Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- UPDATE DEPARTMENT (PUT) ---
router.put('/departments/:id', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const departmentId = req.params.id;
        const { name, description } = req.body;

        const { data: updatedDept, error } = await supabase
            .from('Departments')
            .update({ name, description })
            .eq('department_id', departmentId)
            .select();

        if (error) throw error;
        if (!updatedDept || updatedDept.length === 0) {
             return res.status(404).json({ message: 'Department not found.' });
        }
        res.status(200).json({ message: 'Department updated successfully', department: updatedDept[0] });
    } catch (err: any) { // Consistent naming: err
        console.error('Departments PUT Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- DELETE DEPARTMENT (DELETE) ---
router.delete('/departments/:id', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const departmentId = req.params.id;

        const { error } = await supabase
            .from('Departments')
            .delete()
            .eq('department_id', departmentId);

        if (error) throw error;
        
        res.status(200).json({ message: 'Department deleted successfully.' });
    } catch (err: any) { // Consistent naming: err
        console.error('Departments DELETE Error:', err);
        // A common error here is a Foreign Key constraint violation
        if (err.code === '23503') { 
            return res.status(400).json({ message: 'Cannot delete: Doctors or staff are still assigned to this department.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;