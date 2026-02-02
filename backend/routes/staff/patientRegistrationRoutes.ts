// backend/routes/staff/patientRegistrationRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

// Extend the Request type for the user property (from authMiddleware)
interface AuthRequest extends Request { 
    user?: { id: string; role: string; }; 
}

// Function to generate a random 10-character password
const generateTempPassword = () => Math.random().toString(36).slice(-10);

// Middleware to restrict access to Staff roles (Receptionists)
const restrictToStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'staff') {
        return res.status(403).json({ message: 'Access denied: Must be Staff.' });
    }
    next();
};

// @route   POST /api/staff/register-patient
// @desc    Staff registers a new patient with full profile details (System generates password)
// @access  Private (Staff Only)
router.post('/register-patient', protect, restrictToStaff, async (req: Request, res: Response) => {
    // CRITICAL: Extract all required and optional fields from the payload
    const { 
        name, email, 
        aadhaar_number, father_name, mother_name,
        additional_phone_number, blood_group, age, gender,
        street, city, district, state, country,
        // Appointment fields are also expected, but not used in the initial insert logic below
        doctorId, appointmentDate, appointmentTime, reason
    } = req.body;

    // Convert age to null if empty, or ensure it's an integer
    const patientAge = req.body.age ? parseInt(req.body.age) : null;
    
    try {
        // --- 1. Check if User Already Exists ---
        const { data: userExists } = await supabase
            .from('User')
            .select('user_id')
            .eq('email', email);

        if (userExists && userExists.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }
        
        // --- 2. Generate and Hash Temporary Password ---
        const salt = await bcrypt.genSalt(10);
        const tempPassword = generateTempPassword(); 
        const hashedPassword = await bcrypt.hash(tempPassword, salt);
        
        // --- 3. Create Basic User Account (Role: Patient) ---
        const { data: newUser, error: userError } = await supabase
            .from('User')
            .insert([{ name, email, password: hashedPassword, role: 'patient' }])
            .select();

        if (userError) throw userError;
        const newUserId = newUser[0].user_id;

        // --- 4. Create Detailed Patient Profile ---
        const { data: newPatient, error: patientError } = await supabase
            .from('Patient')
            .insert([{ 
                user_id: newUserId,
                aadhaar_number, father_name, mother_name, additional_phone_number,
                blood_group, age: patientAge, gender, street, city, district, state, country
            }])
            .select(); // Select is needed to get the patient_id for the appointment
        
        if (patientError) {
            console.error('Patient Profile Detailed Insert FAILED:', patientError);
            throw patientError; 
        }
        const newPatientId = newPatient[0].patient_id;

        // --- 5. Book Appointment (If required fields are present) ---
        if (doctorId && appointmentDate && appointmentTime) {
            const { error: apptError } = await supabase
                .from('Appointments')
                .insert([{
                    patient_id: newPatientId,
                    doctor_id: doctorId,
                    appointment_date: appointmentDate,
                    appointment_time: appointmentTime,
                    reason: reason || 'Initial registration/consultation.',
                    status: 'Scheduled',
                }]);

            if (apptError) throw apptError;
        }

        // --- 6. Final Response ---
        res.status(201).json({ 
            message: `Patient ${name} registered successfully.`,
            tempPassword: tempPassword 
        });

    } catch (error) {
        console.error('Receptionist Patient Reg/Appt Error:', error);
        res.status(500).json({ message: 'Registration failed. Check server logs.' });
    }
});

export default router;