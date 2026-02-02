// backend/routes/doctor/appointmentRoutes.ts
import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

// Define a type for the authenticated request user
// Assuming this is defined globally or imported, but repeated here for clarity
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// @route   GET /api/doctor/appointments
// @desc    Get all appointments for the authenticated doctor
// @access  Private
router.get('/appointments', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) { return res.status(400).json({ message: 'Invalid User ID format.' }); }

    // 1. Find the doctor_id from the Doctor table using the user_id
    const { data: doctorRecord, error: doctorError } = await supabase
      .from('Doctor')
      .select('doctor_id')
      .eq('user_id', numericUserId)
      .single();

    if (doctorError || !doctorRecord) {
    console.log(doctorError)
    console.log(doctorRecord)
      return res.status(404).json({ message: 'Doctor record not found. Please complete your profile.' });
    }
    
    const doctorId = doctorRecord.doctor_id;

    // 2. Fetch appointments using the doctor_id and join with Patient table to get the name
//     const { data: appointments, error } = await supabase
//       .from('Appointments')
//       .select(`
//         appointment_id,
//         appointment_date,
//         appointment_time,
//         reason,
//         status,
//         Patient!inner (name,id) 
//       `)
//       .eq('doctor_id', doctorId)
//       .order('appointment_date', { ascending: true });

//     if (error) {
//       console.error("Supabase Appointment Fetch Error:", error);
//       throw error;
//     }

//     res.status(200).json(appointments);
const { data: appointments, error } = await supabase
  .from('Appointments')
  .select(`
    appointment_id,
    appointment_date,
    appointment_time,
    reason,
    status,
    Patient!inner(patient_id, User(name)) 
  `) // Use the query above
  .eq('doctor_id', doctorId)
  .order('appointment_date', { ascending: true });


// Final Data Transformation (Must be applied after the query)
const formattedAppointments = (appointments as any[] || []).map((appt: any) => ({
    appointment_id: appt.appointment_id,
    appointment_date: appt.appointment_date,
    appointment_time: appt.appointment_time,
    reason: appt.reason,
    status: appt.status,
    
    // CRITICAL EXTRACTION: Patient is a nested object, User is a nested object/array
    patient_name: appt.Patient?.User?.name || 'N/A', 
    patient_id: appt.Patient?.patient_id || 'N/A' 
}));

res.status(200).json(formattedAppointments);
  } catch (err) {
    console.error('Doctor Appointments Request Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/doctor/patients
// @desc    Get all patients assigned to the authenticated doctor
// @access  Private
// router.get('/patients', protect, async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ message: 'User not authenticated' });
//     }

//     // 1. Find the doctor_id from the Doctor table
//     const { data: doctorRecord, error: doctorError } = await supabase
//       .from('Doctor')
//       .select('doctor_id')
//       .eq('user_id', userId)
//       .single();

//     if (doctorError || !doctorRecord) {
//       return res.status(404).json({ message: 'Doctor record not found.' });
//     }
//     
//     const doctorId = doctorRecord.doctor_id;

//     // 2. Fetch all unique patients associated with this doctor's appointments
//     const { data: patientAppointments, error: apptError } = await supabase
//       .from('Appointments')
//       .select(`
//         patient_id,
//         Patient!inner (name, blood_group, age)
//       `)
//       .eq('doctor_id', doctorId)
//       .not('status', 'eq', 'Canceled');

//     if (apptError) {
//       console.error("Supabase Patient Fetch Error:", apptError);
//       throw apptError;
//     }

//     // 3. Extract unique patient records
//     const uniquePatientsMap = new Map();
//     patientAppointments.forEach((appt: any) => {
//       if (appt.Patient) {
//         // const patientData = appt.Patient;
//         uniquePatientsMap.set(appt.patient_id, {
//             patient_id: appt.patient_id,
//             name: appt.Patient.name,
//             blood_group: appt.Patient.blood_group,
//             age: appt.Patient.age
//         });
//       }
//     });
//     
//     const patients = Array.from(uniquePatientsMap.values());

//     res.status(200).json(patients);
//   } catch (err) {
//     console.error('Doctor Patients List Request Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Assuming this is in backend/routes/doctor/appointmentRoutes.ts

router.get('/patients', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // CRITICAL: Convert userId to numeric type
    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    // 1. Find the doctor_id from the Doctor table
    const { data: doctorRecord, error: doctorError } = await supabase
      .from('Doctor')
      .select('doctor_id')
      .eq('user_id', numericUserId)
      .single();

    if (doctorError || !doctorRecord) {
      return res.status(404).json({ message: 'Doctor record not found.' });
    }
    
    const doctorId = doctorRecord.doctor_id;

    // 2. CRITICAL FIX: Fetch patient details by joining Patient and then the User table
    const { data: patientAppointments, error: apptError } = await supabase
      .from('Appointments')
      .select(`
        patient_id,
        Patient!inner(
            name, 
            blood_group, 
            age, 
            User!inner(name)
        )
      `)
      .eq('doctor_id', doctorId)
      .not('status', 'eq', 'Canceled');

    if (apptError) {
      console.error("Supabase Patient Fetch Error:", apptError);
      throw apptError;
    }

    // 3. Extract unique patient records and handle nested array structure
    const uniquePatientsMap = new Map();
    patientAppointments.forEach((appt: any) => {
      if (appt.Patient) {
            // Patient is a single object in this join, but User is an array
            const patientData = appt.Patient;
            const user = patientData.User && Array.isArray(patientData.User) ? patientData.User[0] : patientData.User;

        uniquePatientsMap.set(appt.patient_id, {
            patient_id: appt.patient_id,
            name: user?.name || 'N/A', // Access name from the User object
            blood_group: patientData.blood_group || 'N/A',
            age: patientData.age
        });
      }
    });
    
    const patients = Array.from(uniquePatientsMap.values());

    res.status(200).json(patients);
  } catch (err: any) {
    console.error('Doctor Patients List Request Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const getDoctorId = async (userId: string) => {
    // CRITICAL: Ensure the conversion to number is done for the DB query
    const numericUserId = parseInt(userId); 
    
    // Assuming 'supabase' is correctly imported from '../db'
    const { data } = await supabase
        .from('Doctor')
        .select('doctor_id')
        .eq('user_id', numericUserId)
        .single();
    
    return data?.doctor_id;
};

// @route   PUT /api/doctor/appointments/:appointmentId/complete
// @desc    Marks a specific appointment as 'Completed'
// @access  Private (Doctor Only)
router.put('/appointments/:appointmentId/complete', protect, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const appointmentId = req.params.appointmentId;

        // CRITICAL: Ensure the doctor is only updating their OWN appointment
        const doctorId = await getDoctorId(userId as string);
        if (!doctorId) {
            return res.status(403).json({ message: 'Doctor ID not found or unauthorized.' });
        }

        const { data: updatedAppt, error } = await supabase
            .from('Appointments')
            .update({ status: 'Completed' })
            .eq('appointment_id', appointmentId)
            .eq('doctor_id', doctorId) // Security filter: Must belong to this doctor
            .select();

        if (error) throw error;

        if (!updatedAppt || updatedAppt.length === 0) {
            return res.status(404).json({ message: 'Appointment not found or not assigned to this doctor.' });
        }

        res.status(200).json({ message: 'Appointment marked as completed.', appointment: updatedAppt[0] });

    } catch (err: any) {
        console.error('Appointment Completion Error:', err);
        res.status(500).json({ message: 'Failed to complete appointment.' });
    }
});

export default router;