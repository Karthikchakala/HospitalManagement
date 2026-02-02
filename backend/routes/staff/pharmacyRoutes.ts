// backend/routes/staff/pharmacyRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

interface AuthRequest extends Request { user?: { id: string; role: string; }; }
const restrictToPharmacy = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'staff') { 
        return res.status(403).json({ message: 'Access denied.' });
    }
    next();
};

// Helper to get Staff ID (needed for updating staff_id in the bill)
const getStaffId = async (userId: string) => {
    const numericUserId = parseInt(userId);
    const { data } = await supabase.from('Staff').select('staff_id').eq('user_id', numericUserId).single();
    return data?.staff_id;
};

// @route   GET /api/staff/pharmacy/pending
// @desc    Get all appointments that are pending dispensing (and fetch the prescription from EMR)
// @access  Private (Pharmacist Only)
router.get('/pharmacy/pending', protect, restrictToPharmacy, async (req: AuthRequest, res: Response) => {
    try {
        // 1. Fetch appointments that need dispensing
        const { data: pendingAppointments, error: apptError } = await supabase
            .from('Appointments')
            .select(`
                appointment_id,
                appointment_date,
                patient_id, 
                Patient!inner(name, patient_id)
            `)
            .eq('dispense_status', 'Pending')
            .order('appointment_date', { ascending: true });

        if (apptError) throw apptError;
        
        if (!pendingAppointments || pendingAppointments.length === 0) {
             return res.status(200).json([]);
        }

        // 2. Map through appointments and fetch the LATEST EMR/prescription for each patient
        const appointmentsWithPrescriptions = await Promise.all(
            pendingAppointments.map(async (appt: any) => {
                
                // Fetch the latest EMR for the patient of this appointment
                const { data: emrRecords, error: emrError } = await supabase
                    .from('EMR')
                    .select('diagnosis, prescriptions, doctor_id')
                    .eq('patient_id', appt.patient_id)
                    .order('visit_date', { ascending: false }) // Get the latest record
                    .limit(1);

                if (emrError) {
                    console.error('EMR Lookup Failed for patient:', appt.patient_id, emrError);
                }

                // Get Doctor's name for context
                const doctorName = emrRecords?.[0]?.doctor_id 
                    ? (await supabase.from('Doctor').select('User(name)').eq('doctor_id', emrRecords[0].doctor_id).single()).data?.User[0]?.name
                    : 'N/A';

                return {
                    appointment_id: appt.appointment_id,
                    patient_id: appt.patient_id,
                    patient_name: appt.Patient.name,
                    appointment_date: appt.appointment_date,
                    // Attach the prescription text
                    prescription_text: emrRecords?.[0]?.prescriptions || 'Prescription not found/logged in EMR.',
                    doctor_name: doctorName || 'N/A',
                };
            })
        );

        res.status(200).json(appointmentsWithPrescriptions);
    } catch (err: any) {
        console.error('Pending Dispensing Fetch Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
// @route   PUT /api/staff/pharmacy/dispense/:appointmentId
// @desc    Marks appointment as dispensed and generates a bill
// @access  Private (Pharmacist Only)
router.put('/pharmacy/dispense/:appointmentId', protect, restrictToPharmacy, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const appointmentId = req.params.appointmentId;
        const { patientId, medicineCost, totalBillAmount } = req.body; // Expecting calculated costs from frontend

        const pharmacistStaffId = userId ? await getStaffId(userId) : null; 
        if (!pharmacistStaffId) { return res.status(403).json({ message: 'Pharmacist staff ID not found.' }); }
        if (!patientId || !medicineCost || !totalBillAmount) { return res.status(400).json({ message: 'Missing billing details.' }); }

        // 1. Update appointment dispense status
        const { error: updateError } = await supabase
            .from('Appointments')
            .update({ dispense_status: 'Dispensed' })
            .eq('appointment_id', appointmentId);

        if (updateError) throw updateError;
        
        // 2. Insert Bill Record
        const { data: newBill, error: billError } = await supabase
            .from('Billing')
            .insert([
                {
                    patient_id: patientId, 
                    services: 'Pharmacy Dispensing',
                    medicine_costs: medicineCost,
                    total_amount: totalBillAmount,
                    status: 'Unpaid',
                    appointment_id: appointmentId, // CRITICAL LINK: Link Bill to Appointment
                }
            ])
            .select();

        if (billError) throw billError;

        res.status(200).json({ message: 'Medicines dispensed and bill generated.', bill: newBill[0] });
    } catch (err: any) {
        console.error('Dispensing and Billing Error:', err);
        res.status(500).json({ message: 'Failed to dispense and generate bill.' });
    }
});

// @route   GET /api/staff/pharmacy/medicines
// @desc    Get the list of all available medicines and prices
// @access  Private (Pharmacist Only)
router.get('/pharmacy/medicines', protect, restrictToPharmacy, async (req: AuthRequest, res: Response) => {
    try {
        const { data: medicines, error } = await supabase
            .from('Pharmacy')
            .select('pharmacy_id, medicine_details, price'); // Fetch ID, Name, and Price

        if (error) throw error;
        res.status(200).json(medicines);
    } catch (err: any) {
        console.error('Medicines GET Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;