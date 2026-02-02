// // backend/routes/doctor/emrRoutes.ts
// import { Router, Request, Response } from 'express';
// import { protect } from '../../middleware/authMiddleware';
// import { supabase } from '../../db';
import { sendMail } from '../../mailer/transport';

// const router = Router();

// interface AuthRequest extends Request { user?: { id: string; role: string; }; }

// // Helper to look up ID
// const getDoctorId = async (userId: string) => {
//     const numericUserId = parseInt(userId);
//     const { data } = await supabase.from('Doctor').select('doctor_id').eq('user_id', numericUserId).single();
//     return data?.doctor_id;
// };

// // @route   POST /api/doctor/emr
// // @desc    Creates a new EMR record and links the uploaded document(s)
// // @access  Private (Doctor Only)
// router.post('/emr', protect, async (req: AuthRequest, res: Response) => {
//     const { 
//         patientId, diagnosis, prescriptions, notes, 
//         uploadedDocument // Metadata from the successful Cloudinary upload
//     } = req.body;
    
//     try {
//         const userId = req.user?.id;
//         const doctorId = userId ? await getDoctorId(userId) : null;

//         if (!doctorId) {
//             return res.status(403).json({ message: 'Doctor ID not found. Cannot create EMR.' });
//         }

//         // Construct the file_links JSONB object
//         const file_links = uploadedDocument ? [
//             {
//                 type: 'DoctorNote',
//                 url: uploadedDocument.url,
//                 public_id: uploadedDocument.public_id,
//                 uploaded_at: new Date().toISOString()
//             }
//         ] : [];
        
//         // Insert data into the EMR table
//         const { data: newEMR, error } = await supabase
//             .from('EMR')
//             .insert([{
//                 patient_id: patientId,
//                 doctor_id: doctorId,
//                 visit_date: new Date().toISOString(),
//                 diagnosis,
//                 prescriptions,
//                 notes,
//                 file_links: file_links, // Insert the JSONB array
//             }])
//             .select();

//         if (error) throw error;
//         res.status(201).json({ message: 'EMR created and document linked successfully', record: newEMR[0] });

//     } catch (err: any) {
//         console.error('EMR Post Error:', err);
//         res.status(500).json({ message: 'Failed to create EMR. Check database and input fields.' });
//     }
// });

// export default router;

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

// --- EMR Record Interfaces (For Type Assertion) ---
interface DoctorUser { name: string; }
interface DoctorData { User: DoctorUser[]; }
interface RawEMRRecord {
    record_id: number;
    visit_date: string;
    diagnosis: string;
    prescriptions: string;
    notes: string;
    file_links: any; 
    Doctor: DoctorData;
    Patient: { name: string };
}
// ----------------------------------------------------


// @route   POST /api/doctor/emr
// @desc    Creates a new EMR record and links the uploaded document(s)
// @access  Private (Doctor Only)

interface AuthRequest extends Request { user?: { id: string; role: string; }; }

// @route   POST /api/doctor/emr
// @desc    Creates a new EMR record and links the uploaded document(s)
// @access  Private (Doctor Only)
router.post('/emr', protect, async (req: AuthRequest, res: Response) => {
    const { 
        patientId, diagnosis, prescriptions, notes, 
        fileMetadata // <-- metadata from frontend Cloudinary upload
    } = req.body;
    
    try {
        const userId = req.user?.id;
        const doctorId = userId ? await getDoctorId(userId) : null;

        if (!doctorId) {
            return res.status(403).json({ message: 'Doctor ID not found. Cannot create EMR.' });
        }

        // Construct the file_links JSONB object
        const file_links = fileMetadata ? [
            {
                type: 'DoctorNote',
                url: fileMetadata.url,
                public_id: fileMetadata.public_id,
                uploaded_at: new Date().toISOString()
            }
        ] : [];

        // Insert data into Supabase EMR table
        const { data: newEMR, error } = await supabase
            .from('EMR')
            .insert([{
                patient_id: patientId,
                doctor_id: doctorId,
                visit_date: new Date().toISOString(),
                diagnosis,
                prescriptions,
                notes,
                file_links: file_links,
            }])
            .select();

        if (error) throw error;

        // Fire-and-forget EMR summary email to patient
        try {
            const { data: patientJoin } = await supabase
                .from('Patient')
                .select('patient_id, User(name,email)')
                .eq('patient_id', patientId)
                .single();
            const { data: doctorJoin } = await supabase
                .from('Doctor')
                .select('doctor_id, User(name)')
                .eq('doctor_id', doctorId)
                .single();
            const to = (patientJoin as any)?.User?.[0]?.email;
            const patientName = (patientJoin as any)?.User?.[0]?.name || 'Patient';
            const doctorName = (doctorJoin as any)?.User?.[0]?.name || 'Doctor';
            if (to) {
                const html = `
                  <div style="font-family:Arial,Helvetica,sans-serif">
                    <h2>Your Visit Summary</h2>
                    <p>Dear ${patientName},</p>
                    <p>Here is the summary from your recent consultation.</p>
                    <ul>
                      <li><b>Doctor:</b> ${doctorName}</li>
                      <li><b>Diagnosis:</b> ${diagnosis || '—'}</li>
                      <li><b>Prescriptions:</b> ${prescriptions || '—'}</li>
                    </ul>
                    <p><b>Notes:</b></p>
                    <p>${(notes || '').toString()}</p>
                    ${fileMetadata?.url ? `<p><a href="${fileMetadata.url}">Attached document</a></p>` : ''}
                    <p>— Hospify</p>
                  </div>`;
                await sendMail({ to, subject: 'Visit Summary', html });
            }
        } catch (e) {
            console.error('[EMR] Summary email failed:', (e as any)?.message || e);
        }

        res.status(201).json({ 
            message: 'EMR created and document linked successfully', 
            record: newEMR[0] 
        });

    } catch (err: any) {
        console.error('EMR Post Error:', err);
        res.status(500).json({ message: 'Failed to create EMR. Check database and input fields.' });
    }
});


// --- NEW: FETCH SINGLE PATIENT'S EMR RECORDS ---
// @route   GET /api/doctor/patient-emrs/:patientId
// @desc    Get all EMR records for a specific patient, limited to the logged-in doctor
// @access  Private (Doctor Only)
router.get('/patient-emrs/:patientId', protect, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const patientId = req.params.patientId; // Patient ID from URL parameter
        
        if (!userId || !patientId) return res.status(400).json({ message: 'Missing user or patient ID.' });

        const doctorId = await getDoctorId(userId);

        if (!doctorId) {
            return res.status(403).json({ message: 'Doctor ID not found.' });
        }

        // Fetch EMRs: Select records only if the patient and doctor IDs match (for security)
        const { data: records, error } = await supabase
            .from('EMR')
            .select(`
                record_id,
                visit_date,
                diagnosis,
                prescriptions,
                notes,
                file_links,
                Doctor(User(name)),
                Patient(name, patient_id)
            `)
            .eq('patient_id', patientId)
            .eq('doctor_id', doctorId) // CRITICAL: Restricts visibility to this doctor
            .order('visit_date', { ascending: false }) as { data: RawEMRRecord[] | null, error: any };

        if (error) throw error;
        
        // Format the data for the frontend
        const formattedRecords = (records || []).map((record: any) => ({
            ...record,
            // Safely extract names from nested joins
            doctor_name: record.Doctor?.User[0]?.name || 'N/A',
            patient_name: record.Patient?.name,
            file_links: record.file_links || [], 
        }));

        res.status(200).json(formattedRecords);

    } catch (err: any) {
        console.error('Doctor Patient EMRs GET Error:', err);
        res.status(500).json({ message: 'Failed to fetch patient records.' });
    }
});


export default router;