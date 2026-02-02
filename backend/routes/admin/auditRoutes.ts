// backend/routes/admin/auditRoutes.ts
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
    const userRole = req.user?.role?.toLowerCase();

    if (userRole !== 'admin') {
        console.warn(`ACCESS DENIED: User ID ${req.user?.id} attempted to access Audit Logs with role: ${req.user?.role}`);
        return res.status(403).json({ message: 'Access denied: Must be an Admin' });
    }
    next();
};

// @route   GET /api/admin/logs
// @desc    Get all audit/login logs for review
// @access  Private (Admin Only)
router.get('/logs', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const hasParams = Object.keys(req.query).length > 0;
        const { startDate, endDate, action, page, pageSize, format } = req.query as Record<string, string>;

        let query = supabase
            .from('AuditLogs')
            .select(`*`)
            .order('timestamp', { ascending: false });

        if (startDate) query = query.gte('timestamp', startDate);
        if (endDate) query = query.lte('timestamp', endDate);
        if (action && action !== 'All') query = query.ilike('action', `%${action}%`);

        if (!hasParams) {
            const { data: logs, error } = await query;
            if (error) throw error;
            return res.status(200).json(logs);
        }

        const pageNum = Math.max(parseInt(String(page || '1'), 10) || 1, 1);
        const sizeNum = Math.min(Math.max(parseInt(String(pageSize || '10'), 10) || 10, 1), 100);
        const from = (pageNum - 1) * sizeNum;
        const to = from + sizeNum - 1;

        const { data: pageData, error: pageError } = await query.range(from, to);
        if (pageError) throw pageError;

        // Count total
        let countQ = supabase
            .from('AuditLogs')
            .select('log_id', { count: 'exact', head: true });
        if (startDate) countQ = countQ.gte('timestamp', startDate);
        if (endDate) countQ = countQ.lte('timestamp', endDate);
        if (action && action !== 'All') countQ = countQ.ilike('action', `%${action}%`);
        const { count, error: countError } = await countQ;
        if (countError) throw countError;

        if (format === 'csv') {
            const header = 'log_id,user_id,action,timestamp,ip_address';
            const rows = (pageData || []).map((l: any) => [l.log_id, l.user_id ?? '', l.action, l.timestamp, l.ip_address]
                .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            const csv = [header, ...rows].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
            return res.status(200).send(csv);
        }

        return res.status(200).json({
            data: pageData || [],
            meta: {
                total: count || 0,
                page: pageNum,
                pageSize: sizeNum,
                totalPages: Math.ceil((count || 0) / sizeNum),
                startDate: startDate || null,
                endDate: endDate || null,
                action: action || 'All',
            }
        });
    } catch (err: any) {
        console.error('Audit Logs GET Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/tickets
// @desc    Get all support tickets and feedback from all users
// @access  Private (Admin Only)

router.get('/tickets', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
    try {

        const { data: tickets, error: ticketError } = await supabase
            .from('SupportTickets')
            .select(`
                ticket_id,
                type,
                description,
                status,
                timestamp,
                User!inner(name, email)
            `)
            .order('timestamp', { ascending: false });

        if (ticketError) throw ticketError;


        const { data: feedback, error: feedbackError } = await supabase
            .from('Feedback')
            .select(`
                feedback_id,
                subject,
                comments,
                timestamp,
                User!inner(name, email)
            `)
            .order('timestamp', { ascending: false });

        if (feedbackError) throw feedbackError;

        const combinedData = [

            ...(tickets || []).map((t: any) => {
                const user = Array.isArray(t.User) ? t.User[0] : t.User;
                const submitterName = user?.name || 'Deleted User';
                const submitterEmail = user?.email || 'N/A';

                return {
                    id: t.ticket_id,
                    type: 'Support Ticket',
                    subject: `${t.type} (Status: ${t.status})`,
                    content: t.description,
                    submitter: submitterName,
                    email: submitterEmail,
                    timestamp: t.timestamp,
                    status: t.status,
                    isUrgent: true,
                };
            }),
            ...(feedback || []).map((f: any) => {
                const user = Array.isArray(f.User) ? f.User[0] : f.User;
                const submitterName = user?.name || 'Deleted User';
                const submitterEmail = user?.email || 'N/A';

                return {
                    id: f.feedback_id,
                    type: 'Feedback',
                    subject: f.subject,
                    content: f.comments,
                    submitter: submitterName,
                    email: submitterEmail,
                    timestamp: f.timestamp,
                    status: 'Closed',
                    isUrgent: false,
                };
            }),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by newest first

        res.status(200).json(combinedData);

    } catch (err: any) {
        console.error('Admin Ticket/Feedback Fetch Error:', err);
        res.status(500).json({ message: 'Failed to fetch tickets/feedback.' });
    }
});

// @route   GET /api/admin/stats
// @desc    Get key hospital statistics for the Admin dashboard
// @access  Private (Admin Only)
router.get('/stats', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
    try {

        const { data: doctors, error: docError } = await supabase
        .from('User')
        .select('user_id')
        .eq('role', 'doctor');
        if (docError) throw docError;
        const totalDoctors = doctors?.length || 0;

        const { data: patients, error: patientError } = await supabase
        .from('User')
        .select('user_id')
        .eq('role', 'patient');
        if (patientError) throw patientError;
        const totalPatients = patients?.length || 0;

        const { data: staff, error: staffError } = await supabase
        .from('User')
        .select('user_id')
        .in('role', ['admin', 'staff']);
        if (staffError) throw staffError;
        const totalStaff = staff?.length || 0;

        const { data: incomeData, error: incomeError } = await supabase
            .from('Billing')   
            .select('total_amount,status')
            .eq('status', 'Paid'); 
        
        if (incomeError) throw incomeError;

        const incomeGenerated = incomeData.reduce((sum, payment) => sum + (payment.total_amount || 0), 0);

        res.status(200).json({
            totalDoctors: totalDoctors || 0,
            totalPatients: totalPatients || 0,
            totalStaff: totalStaff || 0, 
            incomeGenerated: parseFloat(incomeGenerated.toFixed(2)),
        });

    } catch (err: any) {
        console.error('Admin Stats Fetch Error:', err);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics.' });
    }
});

export default router;