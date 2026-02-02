// // backend/routes/staff/labRoutes.ts
// import { Router, Request, Response, NextFunction } from 'express';
// import { protect } from '../../middleware/authMiddleware';
// import { supabase } from '../../db';
import { sendMail } from '../../mailer/transport';

// const router = Router();

// // Extend the Request type for the user property (from authMiddleware)
// interface AuthRequest extends Request {
//   user?: { id: string; role: string; };
// }

// // --- INTERFACE DEFINITIONS (Used for Type Assertion) ---
// interface PatientData {
//     patient_id: number;
//     name: string;
//     blood_group: string;
// }

// interface TestRecord {
//     test_id: number;
//     test_name: string;
//     normal_range: string;
//     requested_by_doctor_id: number;
//     Patient: PatientData[]; // Defined as an array to correctly type the Supabase join result
// }

// // Middleware to restrict access to only Staff (Lab Technician)
// const restrictToLab = (req: AuthRequest, res: Response, next: NextFunction) => {
//     const userRole = req.user?.role?.toLowerCase();
//     if (userRole !== 'staff') { 
//         return res.status(403).json({ message: 'Access denied.' });
//     }
//     next();
// };

// // --- Helper function to safely extract Patient data from Supabase join result ---
// const extractPatientData = (patientArray: PatientData[] | null) => {
//     // Check if array exists, is an array, and has at least one element.
//     if (patientArray && Array.isArray(patientArray) && patientArray.length > 0) {
//         return patientArray[0];
//     }
//     return { patient_id: null, name: 'N/A', blood_group: 'N/A' };
// };


// // @route   GET /api/staff/lab/pending
// // @desc    Get all lab tests that are still pending (for results submission)
// // @access  Private (Staff Only)
// router.get('/lab/pending', protect, restrictToLab, async (req: AuthRequest, res: Response) => {
//     try {
//         // Fetch pending tests and join with Patient table
//         const { data: pendingTests, error } = await supabase
//             .from('LabTests')
//             .select(`
//                 test_id,
//                 test_name,
//                 normal_range,
//                 requested_by_doctor_id,
//                 Patient!inner(patient_id, name, blood_group)
//             `)
//             .eq('status', 'Pending')
//             .order('test_id', { ascending: true }) as { data: TestRecord[] | null, error: any };

//         if (error) throw error;

//         // Flatten data for the frontend
//         const formattedTests = (pendingTests || []).map(test => {
//             const patient = extractPatientData(test.Patient);
//             return {
//                 test_id: test.test_id,
//                 test_name: test.test_name,
//                 normal_range: test.normal_range,
//                 patient_name: patient.name,
//                 patient_id: patient.patient_id,
//             };
//         });

//         res.status(200).json(formattedTests);
//     } catch (err) {
//         console.error('Pending Tests Fetch Error:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// // @route   PUT /api/staff/lab/result/:testId
// // @desc    Update a lab test with the result and mark as completed
// // @access  Private (Staff Only)
// router.put('/lab/result/:testId', protect, restrictToLab, async (req: AuthRequest, res: Response) => {
//     try {
//         const testId = req.params.testId;
//         const { resultValue, unit } = req.body;
//         // In a real app, you would fetch staff_id from the Staff table using req.user.id
//         const technicianId = 1; // Placeholder for logged-in technician ID

//         const { data: updatedTest, error } = await supabase
//             .from('LabTests')
//             .update({
//                 result_value: resultValue,
//                 unit: unit,
//                 status: 'Completed',
//                 technician_id: technicianId,
//             })
//             .eq('test_id', testId)
//             .select();

//         if (error) throw error;

//         res.status(200).json({ message: 'Test result submitted successfully', test: updatedTest[0] });
//     } catch (err) {
//         console.error('Test Result Update Error:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// });


// // @route   GET /api/staff/lab/samples (For Sample Tracking Portal)
// // @desc    Get all lab tests that are currently awaiting sample collection or processing
// // @access  Private (Staff Only)
// router.get('/lab/samples', protect, restrictToLab, async (req: AuthRequest, res: Response) => {
//     try {
//         const { data: pendingTests, error } = await supabase
//             .from('LabTests')
//             .select(`
//                 test_id,
//                 test_name,
//                 requested_by_doctor_id,
//                 Patient!inner(patient_id, name, blood_group)
//             `)
//             // Filters for 'Pending' status to show samples that need action
//             .eq('status', 'Pending') 
//             .order('test_id', { ascending: true }) as { data: TestRecord[] | null, error: any }; // Use TestRecord[] type

//         if (error) throw error;

//         // Flatten data for the frontend
//         const formattedTests = (pendingTests || []).map(test => {
//             const patient = extractPatientData(test.Patient);
//             return {
//                 test_id: test.test_id,
//                 test_name: test.test_name,
//                 patient_name: patient.name,
//                 patient_id: patient.patient_id,
//             };
//         });

//         res.status(200).json(formattedTests);
//     } catch (err) {
//         console.error('Pending Samples Fetch Error:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// });


// export default router;

// backend/routes/staff/labRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

// Extend the Request type for the user property (from authMiddleware)
interface AuthRequest extends Request { 
  user?: { id: string; role: string; }; 
}

// --- INTERFACE DEFINITIONS ---
interface PatientData {
    patient_id: number | null; 
    name: string;
    blood_group: string;
}

interface TestCatalogDetails {
    test_name: string;
    normal_range: string;
}

interface TestRecord {
    lab_test_id: number;
    requested_by_doctor_id: number;
    // CRITICAL: The TestDetails object is returned via join
    Patient: PatientData[]; 
    TestDetails: TestCatalogDetails[];
}

// Helper to look up Staff ID (needed for updating technician_id in the result submission)
const getStaffId = async (userId: string) => {
    const numericUserId = parseInt(userId);
    const { data } = await supabase.from('Staff').select('staff_id').eq('user_id', numericUserId).single();
    return data?.staff_id;
};


// Middleware to restrict access to only Staff (Lab Technician)
const restrictToLab = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role?.toLowerCase();
    if (userRole !== 'staff') { 
        return res.status(403).json({ message: 'Access denied.' });
    }
    next();
};

// --- Helper function to safely extract Patient data from Supabase join result ---
const extractPatientData = (patientArray: PatientData[] | null): PatientData => { 
    if (patientArray && Array.isArray(patientArray) && patientArray.length > 0) {
        return patientArray[0] as PatientData; 
    }
    return { patient_id: null, name: 'N/A', blood_group: 'N/A' };
};

const extractTestDetails = (testArray: TestCatalogDetails[] | null): TestCatalogDetails => {
    if (testArray && Array.isArray(testArray) && testArray.length > 0) {
        return testArray[0] as TestCatalogDetails;
    }
    return { test_name: 'N/A', normal_range: 'N/A' };
}


// @route   GET /api/staff/lab/pending
// @desc    Get all lab tests that are still pending (for results submission)
// @access  Private (Staff Only)
// router.get('/lab/pending', protect, restrictToLab, async (req: AuthRequest, res: Response) => {
//     try {
//         // Fetch pending tests and join with Patient table
//         const { data: pendingTests, error } = await supabase
//             .from('LabTests')
//             .select(`
//                 lab_test_id,
//                 requested_by_doctor_id,
//                 TestDetails:TestsCatalog!inner(test_name, normal_range), 
//                 Patient!inner(patient_id, name, blood_group)
//             `) // CRITICAL FIX: Removed direct test_name and normal_range selects
//             .eq('status', 'Pending')
//             .order('lab_test_id', { ascending: true }) as { data: TestRecord[] | null, error: any };

//         if (error) {
//             console.error('Supabase Error during /lab/pending:', error);
//             throw error;
//         }

//         // Flatten data for the frontend
//         const formattedTests = (pendingTests || []).map(test => {
//             const patient = extractPatientData(test.Patient);
//             const testDetails = extractTestDetails(test.TestDetails);
            
//             return {
//                 test_id: test.lab_test_id, 
//                 test_name: testDetails.test_name, // Access name from joined TestDetails
//                 normal_range: testDetails.normal_range, // Access range from joined TestDetails
//                 patient_name: patient.name,
//                 patient_id: patient.patient_id,
//             };
//         });

//         res.status(200).json(formattedTests);
//     } catch (err: any) {
//         console.error('Pending Tests Fetch Error:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

// @route   PUT /api/staff/lab/result/:testId
// ... (The PUT logic remains the same, using lab_test_id)

// @route   GET /api/staff/lab/samples (For Sample Tracking Portal)
// router.get('/lab/samples', protect, restrictToLab, async (req: AuthRequest, res: Response) => {
//     try {
//         const { data: pendingTests, error } = await supabase
//             .from('LabTests')
//             .select(`
//                 lab_test_id,
//                 requested_by_doctor_id,
//                 TestDetails:test_id ( test_name, normal_range )
//                 Patient!inner(patient_id, name, blood_group)
//             `)
//             .eq('status', 'Pending') 
//             .order('lab_test_id', { ascending: true }) as { data: TestRecord[] | null, error: any };

//         if (error) throw error;

//         const formattedTests = (pendingTests || []).map(test => {
//             const patient = extractPatientData(test.Patient);
//             const testDetails = extractTestDetails(test.TestDetails);
//             return {
//                 test_id: test.lab_test_id, 
//                 test_name: testDetails.test_name,
//                 patient_name: patient.name,
//                 patient_id: patient.patient_id,
//             };
//         });

//         res.status(200).json(formattedTests);
//     } catch (err: any) {
//         console.error('Pending Samples Fetch Error:', err);
//         res.status(500).json({ message: 'Server error' });
//     }
// });

router.get('/lab/pending', protect, restrictToLab, async (req: AuthRequest, res: Response) => {
  try {
    const { data: pendingTests, error } = await supabase
  .from('LabTests')
  .select(`
    lab_test_id,
    requested_by_doctor_id,
    Patient:patient_id (
      patient_id,
      user_id,
      User:user_id (
        name
      )
    ),
    TestDetails:test_catalog_id (
      test_name,
      normal_range
    )
  `)
  .eq('status', 'Pending')
  .order('lab_test_id', { ascending: true });

    if (error) {
      console.error('Supabase Error during /lab/pending:', error);
      throw error;
    }

    console.log("=== Raw Supabase pendingTests result ===");
console.log(JSON.stringify(pendingTests, null, 2));
console.log("=========================================");

    const formattedTests = (pendingTests || []).map((test: any) => ({
      test_id: test.lab_test_id,
      test_name: test.TestDetails?.test_name || 'N/A',
      normal_range: test.TestDetails?.normal_range || 'N/A',
      patient_name: test.Patient?.User?.name || 'N/A',
      patient_id: test.Patient?.patient_id || null,
    }));

    res.status(200).json(formattedTests);
  } catch (err: any) {
    console.error('Pending Tests Fetch Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/staff/lab/result/:testId
// @desc    Update a lab test with the result, mark as completed, and email the patient
// @access  Private (Staff Only)
router.put('/lab/result/:testId', protect, restrictToLab, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const testId = req.params.testId;
    const { resultValue, unit } = req.body;

    const technicianId = userId ? await getStaffId(userId) : null;
    if (!technicianId) return res.status(403).json({ message: 'Technician ID not found.' });

    const numericTestId = parseInt(testId);
    if (isNaN(numericTestId)) return res.status(400).json({ message: 'Invalid Test ID format.' });

    // Update test to Completed with result
    const { data: updatedTest, error } = await supabase
      .from('LabTests')
      .update({
        result_value: resultValue,
        unit: unit,
        status: 'Completed',
        technician_id: technicianId,
      })
      .eq('lab_test_id', numericTestId)
      .select('*');

    if (error) throw error;
    if (!updatedTest || updatedTest.length === 0) return res.status(404).json({ message: 'Test not found or already completed.' });

    // Fetch joins for email details (patient email, test name, normal range)
    const { data: joined } = await supabase
      .from('LabTests')
      .select(`
        lab_test_id,
        result_value,
        unit,
        Patient:patient_id (
          patient_id,
          user_id,
          User:user_id ( name, email )
        ),
        TestDetails:test_catalog_id ( test_name, normal_range )
      `)
      .eq('lab_test_id', numericTestId)
      .single();

    const to = (joined as any)?.Patient?.User?.email || (joined as any)?.Patient?.User?.[0]?.email;
    const patientName = (joined as any)?.Patient?.User?.name || (joined as any)?.Patient?.User?.[0]?.name || 'Patient';
    const testName = (joined as any)?.TestDetails?.test_name || 'Lab Test';
    const normalRange = (joined as any)?.TestDetails?.normal_range || '—';
    const valueStr = resultValue ? `${resultValue}${unit ? ' ' + unit : ''}` : '—';

    if (to) {
      const html = `
        <div style="font-family:Arial,Helvetica,sans-serif">
          <h2>Lab Report Ready</h2>
          <p>Dear ${patientName},</p>
          <p>Your lab test result is now available.</p>
          <ul>
            <li><b>Test:</b> ${testName}</li>
            <li><b>Result:</b> ${valueStr}</li>
            <li><b>Normal Range:</b> ${normalRange}</li>
          </ul>
          <p>— Hospify</p>
        </div>`;
      try {
        await sendMail({ to, subject: 'Your Lab Report is Ready', html });
      } catch (e:any) {
        console.error('[Lab] Failed to send lab report email:', e?.message || e);
      }
    }

    return res.status(200).json({ message: 'Test result submitted successfully', test: updatedTest[0] });
  } catch (err:any) {
    console.error('Test Result Update Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/lab/samples', protect, restrictToLab, async (req: AuthRequest, res: Response) => {
  try {
    const { data: pendingTests, error } = await supabase
      .from('LabTests')
      .select(`
        lab_test_id,
        requested_by_doctor_id,
        Patient:patient_id (
          patient_id,
          user_id,
          User:user_id (
            name
          )
        ),
        TestDetails:test_catalog_id (
          test_name,
          normal_range
        )
      `)
      .eq('status', 'Pending')
      .order('lab_test_id', { ascending: true });

    if (error) {
      console.error('Supabase Error during /lab/samples:', error);
      throw error;
    }


    const formattedTests = (pendingTests || []).map((test: any) => ({
      test_id: test.lab_test_id,
      test_name: test.TestDetails?.test_name || 'N/A',
      patient_name: test.Patient?.User?.name || 'N/A',
      patient_id: test.Patient?.patient_id || null,
    }));

    res.status(200).json(formattedTests);
  } catch (err: any) {
    console.error('Pending Samples Fetch Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;