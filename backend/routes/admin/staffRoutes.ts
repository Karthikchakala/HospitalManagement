// backend/routes/admin/staffRoutes.ts
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
        console.warn(`ACCESS DENIED: User ID ${req.user?.id} attempted to access Admin Staff routes with role: ${req.user?.role}`);
        return res.status(403).json({ message: 'Access denied: Must be an Admin' });
    }
    next();
};

// --- GET ALL STAFF (for the list view) ---
// @route   GET /api/admin/staff
// @desc    Get a list of all staff members
// @access  Private (Admin Only)
router.get('/staff', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { data: staffRecords, error } = await supabase
      .from('Staff')
      .select(`
        staff_id,
        designation,
        user_id,
        userData:User(user_id,name, email) 
      `)
      .order('staff_id', { ascending: true });

    if (error) {
      console.error("Supabase Admin Staff Fetch Error:", error);
      throw error;
    }
    // console.log("Raw staff data:", JSON.stringify(staffRecords, null, 2));


    // Transform the data to safely extract the renamed User info
    // const formattedStaff = (staffRecords || []).map(staff => {
    //     const user = staff.userData && Array.isArray(staff.userData) && staff.userData.length > 0
    //                  ? staff.userData[0] 
    //                  : { name: 'N/A', email: 'N/A' };
        
    //     return {
    //         id: staff.staff_id,
    //         name: user.name,
    //         email: user.email,
    //         designation: staff.designation || 'Unassigned',
    //         user_id: staff.user_id, // CRITICAL: Include user_id for PUT operations
    //     };
    // });

const formattedStaff = (staffRecords || []).map(staff => {
    // CRITICAL FIX: Access the renamed 'userData' array and extract the first element.
    // We check if staff.userData exists, is an array, and has data.
    const rawUserData = staff.userData;

    const user = rawUserData 
                 ? (Array.isArray(rawUserData) ? rawUserData[0] : rawUserData)
                 : { name: 'N/A', email: 'N/A' };
    
    // Ensure the final user object is not null/undefined before accessing properties
    const finalUser = user || { name: 'N/A', email: 'N/A' };
    
    return {
        id: staff.staff_id,
        name: finalUser.name, // Will now contain the fetched name ("Sameer")
        email: finalUser.email, // Will now contain the fetched email
        designation: staff.designation || 'Unassigned',
        user_id: staff.user_id,
    };
});

// const formattedStaff = (staffRecords || []).map(staff => {
//   const user = staff.userData
//     ? staff.userData
//     : { name: 'N/A', email: 'N/A', user_id: null };

//   return {
//     id: staff.staff_id,
//     name: user.name,
//     email: user.email,
//     designation: staff.designation || 'Unassigned',
//     user_id: staff.user_id, // Include for PUT operations
//   };
// });

      // const formattedStaff = (staffRecords || []).map((staff) => ({
      //   id: staff.staff_id,
      //   name: staff.userData?.name || "N/A",
      //   email: staff.userData?.email || "N/A",
      //   designation: staff.designation || "Unassigned",
      //   user_id: staff.user_id,
      // }));

    res.status(200).json(formattedStaff);
  } catch (err: any) {
    console.error('Admin Staff Fetch Request Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- GET SINGLE STAFF MEMBER (for the View/Edit form) ---
// @route   GET /api/admin/staff/:staffId
// @desc    Get detailed profile of a single staff member
// @access  Private (Admin Only)
router.get('/staff/:staffId', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const staffId = req.params.staffId;

    const { data: staffRecord, error } = await supabase
      .from('Staff')
      .select(`
        staff_id,
        designation,
        User!inner(user_id, name, email, role)
      `)
      .eq('staff_id', staffId)
      .single();

    if (error) throw error;
    if (!staffRecord) {
      return res.status(404).json({ message: 'Staff member not found.' });
    }

    // Flatten and format data
    const user = staffRecord.User && Array.isArray(staffRecord.User) && staffRecord.User.length > 0
               ? staffRecord.User[0] 
               : { name: 'N/A', email: 'N/A', role: 'N/A', user_id: null };

    const formattedStaff = {
        id: staffRecord.staff_id,
        name: user.name,
        email: user.email,
        designation: staffRecord.designation,
        user_id: user.user_id,
    };

    res.status(200).json(formattedStaff);
  } catch (err: any) {
    console.error('Admin Single Staff Fetch Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- UPDATE SINGLE STAFF MEMBER (PUT) ---
// @route   PUT /api/admin/staff/:staffId
// @desc    Update a staff member's Name, Email (User table) and Designation (Staff table)
// @access  Private (Admin Only)
router.put('/staff/:staffId', protect, restrictToAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const staffId = req.params.staffId;
    // CRITICAL: Extract ALL fields, including user_id for the User table update
    const { name, email, designation, user_id } = req.body; 

    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required for update.' });
    }

    // 1. UPDATE USER TABLE (Name and Email)
    const { data: updatedUser, error: userUpdateError } = await supabase
      .from('User')
      .update({ name, email })
      .eq('user_id', user_id) 
      .select('name, email');

    if (userUpdateError) {
        console.error("Supabase User PUT Error:", userUpdateError);
        throw userUpdateError;
    }

    // 2. UPDATE STAFF TABLE (Designation)
    const { data: updatedStaff, error: staffUpdateError } = await supabase
      .from('Staff')
      .update({ designation })
      .eq('staff_id', staffId) 
      .select('designation');

    if (staffUpdateError) {
        console.error("Supabase Staff PUT Error:", staffUpdateError);
        throw staffUpdateError;
    }

    // 3. Success Response (Combine data for frontend state refresh)
    res.status(200).json({
        message: 'Staff profile updated successfully.',
        name: updatedUser[0].name,
        email: updatedUser[0].email,
        designation: updatedStaff[0].designation
    });
  } catch (err: any) {
    console.error('Admin Staff PUT Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

