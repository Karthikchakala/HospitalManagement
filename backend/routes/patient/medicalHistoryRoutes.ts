// backend/routes/patient/medicalHistoryRoutes.ts
import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// --- INTERFACE DEFINITIONS ---
interface DoctorUser {
  name: string;
}

interface DoctorData {
  User?: DoctorUser[]; // optional because join can return null
}

interface RawEMRRecord {
  record_id: number;
  visit_date: string;
  diagnosis: string;
  prescriptions: string;
  notes: string;
  file_links: any; // JSONB field
  Doctor?: DoctorData; // optional because join can return null
}
// ----------------------------------------------------

// --- Helper function to safely extract Doctor Name ---
const extractDoctorName = (doctorData?: DoctorData): string => {
  const doctorUserArray = doctorData?.User;
  if (doctorUserArray && doctorUserArray.length > 0) {
    return doctorUserArray[0].name;
  }
  return 'N/A';
};

// Helper to look up Patient ID (assuming this is already defined)
const getPatientId = async (userId: string) => {
    const numericUserId = parseInt(userId);
    const { data } = await supabase.from('Patient').select('patient_id').eq('user_id', numericUserId).single();
    return data?.patient_id;
};

// @route   GET /api/patient/history
// @desc    Get all EMR records for the authenticated patient
// @access  Private
router.get('/history', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    // 1. Get the patient_id
    const numericUserId = parseInt(userId);
    const { data: patientRecord, error: patientError } = await supabase
      .from('Patient')
      .select('patient_id')
      .eq('user_id', numericUserId)
      .single();

    if (patientError || !patientRecord) {
      return res.status(404).json({ message: 'Patient record not found.' });
    }

    const patientId = patientRecord.patient_id;

    // 2. Fetch all EMRs
const { data: records, error } = (await supabase
  .from('EMR')
  .select(`
      record_id,
      visit_date,
      diagnosis,
      prescriptions,
      notes,
      file_links,
      Doctor(User(name))
  `)
  .eq('patient_id', patientId)
  .order('visit_date', { ascending: false })) as {
    data: RawEMRRecord[] | null;
    error: any;
  };


    if (error) throw error;

    // 3. Flatten the doctor's name into the main record object
    // const formattedRecords = (records || []).map((record) => ({
    //   ...record,
    //   doctor_name: extractDoctorName(record.Doctor),
    // }));

    const formattedRecords = (records || []).map((record: any) => {
    
    // CRITICAL FIX: Safely access the deeply nested name using optional chaining.
    // The data structure is record.Doctor -> User -> name
    const doctorName = record.Doctor?.User?.name || 'N/A';
    
    // Process file links safely (assuming they are nested under 'file_links')
    const fileLinks = (typeof record.file_links === 'string' ? JSON.parse(record.file_links) : record.file_links) || [];

    return {
        ...record,
        doctor_name: doctorName, // This now correctly extracts "karthik"
        file_links: fileLinks,   // Pass the processed file links
    };
});

    res.status(200).json(formattedRecords);
  } catch (err: any) {
    console.error('EMR GET Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patient/lab-results
// @desc    Get all COMPLETED lab results for the authenticated patient
// @access  Private
router.get('/lab-results', protect, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'User not authenticated' });

        const patientId = await getPatientId(userId);

        if (!patientId) {
            return res.status(404).json({ message: 'Patient record not found.' });
        }

        // Fetch completed lab test records
        // const { data: labResults, error } = await supabase
        //     .from('LabTests')
        //     .select(`
        //         lab_test_id,
        //         result_value,
        //         unit,
        //         status,
        //         created_at,
        //         TestCatalog:TestsCatalog!inner(test_name, normal_range)
        //     `)
        //     .eq('patient_id', patientId)
        //     .eq('status', 'Completed')
        //     .order('created_at', { ascending: false });

        // if (error) throw error;
        
        // // Format the data for display
        // const formattedResults = (labResults as any[] || []).map(result => ({
        //     lab_test_id: result.lab_test_id,
        //     // FIX: Safely access the joined data from the TestCatalog object
        //     test_name: result.TestCatalog[0]?.test_name || 'N/A',
        //     result_value: result.result_value,
        //     unit: result.unit,
        //     normal_range: result.TestCatalog[0]?.normal_range || 'N/A',
        //     test_date: new Date(result.created_at).toLocaleDateString()
        // }));
        const { data: labResults, error } = await supabase
    .from('LabTests')
    .select(`
        lab_test_id,
        result_value,
        unit,
        created_at,
        
        
        test_catalog_data:TestsCatalog!inner(test_name, normal_range) 
    `)
    .eq('patient_id', patientId)
    .eq('status', 'Completed')
    .order('created_at', { ascending: false });

if (error) throw error;

// Format the data for display
const formattedResults = (labResults as any[] || []).map(result => {
    // FIX 2: Safely extract the test details object from the renamed joined data
    const testDetails = result.test_catalog_data && Array.isArray(result.test_catalog_data)
        ? result.test_catalog_data[0] 
        : result.test_catalog_data || {}; // Ensure it's an object or empty object
        
    return {
        lab_test_id: result.lab_test_id,
        // Access properties from the safely extracted object
        test_name: testDetails.test_name || 'N/A',
        result_value: result.result_value,
        unit: result.unit,
        normal_range: testDetails.normal_range || 'N/A',
        test_date: new Date(result.created_at).toLocaleDateString()
    };
});

        res.status(200).json(formattedResults);
    } catch (err: any) {
        console.error('Lab Results GET Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
