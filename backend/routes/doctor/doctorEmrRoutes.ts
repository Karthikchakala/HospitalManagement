// backend/routes/doctor/doctorEmrRoutes.ts
import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

interface AuthRequest extends Request { user?: { id: string; role: string; }; }

// Helper to look up Doctor ID
const getDoctorId = async (userId: string) => {
    const numericUserId = parseInt(userId);
    const { data } = await supabase.from('Doctor').select('doctor_id').eq('user_id', numericUserId).single();
    return data?.doctor_id;
};

// @route   POST /api/doctor/emr
// @desc    Creates a new EMR record and links the uploaded document(s)
// @access  Private (Doctor Only)
// router.post('/emr', protect, async (req: Request, res: Response) => {
//     const { 
//         patientId, diagnosis, prescriptions, notes, 
//         uploadedDocument 
//     } = req.body;
    
//     try {
//         const userId = req.user?.id;
//         const doctorId = userId ? await getDoctorId(userId) : null;

//         if (!doctorId) {
//             return res.status(403).json({ message: 'Doctor ID not found. Cannot create EMR.' });
//         }
//         if (!patientId) {
//             return res.status(400).json({ message: 'Patient ID is required.' });
//         }

//         // 1. Construct the file_links JSONB object
//         const file_links = uploadedDocument ? [
//             {
//                 type: 'DoctorNote',
//                 url: uploadedDocument.url,
//                 public_id: uploadedDocument.public_id,
//                 uploaded_at: new Date().toISOString()
//             }
//         ] : [];
        
//         // 2. Insert data into the EMR table
//         const { data: newEMR, error } = await supabase
//             .from('EMR')
//             .insert([{
//                 patient_id: patientId,
//                 doctor_id: doctorId,
//                 visit_date: new Date().toISOString(),
//                 diagnosis,
//                 prescriptions,
//                 notes,
//                 file_links: file_links,
//             }])
//             .select();

//         if (error) throw error;
//         res.status(201).json({ message: 'EMR created and document linked successfully', record: newEMR[0] });

//     } catch (err: any) {
//         console.error('EMR Post Error:', err);
//         res.status(500).json({ message: 'Failed to create EMR. Check database and input fields.' });
//     }
// });

export default router;