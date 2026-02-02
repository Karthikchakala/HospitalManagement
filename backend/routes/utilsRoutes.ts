// backend/routes/utilsRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../middleware/authMiddleware';
import { supabase } from '../db';

const router = Router();

interface AuthRequest extends Request { user?: { id: string; role: string; }; }

// Middleware to ensure all submitted requests are from a logged-in user
const restrictToAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
        return res.status(401).json({ message: 'Authentication required for submission.' });
    }
    next();
};

// @route   POST /api/utils/feedback
// @desc    Submits general feedback/suggestions
// @access  Private (All Users)
router.post('/feedback', protect, restrictToAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { subject, comments } = req.body;
        
        // CRITICAL: Insert into the Feedback table
        const { error } = await supabase
            .from('Feedback')
            .insert([{ user_id: userId, subject, comments }]);

        if (error) throw error;
        res.status(201).json({ message: 'Feedback submitted successfully.' });

    } catch (err: any) {
        console.error('Feedback Submission Error:', err);
        res.status(500).json({ message: 'Failed to submit feedback.' });
    }
});

// @route   POST /api/utils/support
// @desc    Submits a support ticket/bug report
// @access  Private (All Users)
router.post('/support', protect, restrictToAuthenticated, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { type, description } = req.body;
        
        // CRITICAL: Insert into the SupportTickets table
        const { error } = await supabase
            .from('SupportTickets')
            .insert([{ user_id: userId, type, description, status: 'Open' }]);

        if (error) throw error;
        res.status(201).json({ message: 'Support ticket submitted successfully.' });

    } catch (err: any) {
        console.error('Support Ticket Submission Error:', err);
        res.status(500).json({ message: 'Failed to submit support ticket.' });
    }
});

export default router;