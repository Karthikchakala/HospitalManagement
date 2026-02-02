// // backend/routes/doctor/profileRoutes.ts
// import { Router, Request, Response, NextFunction } from 'express';
// import { protect } from '../../middleware/authMiddleware';
// import { supabase } from '../../db';

// const router = Router();

// // Extend the Request type for the user property (assuming it's defined in middleware)
// interface AuthRequest extends Request {
//   user?: {
//     id: string;
//     role: string;
//   };
// }

// router.get('/test', (req, res) => {
//   res.json({ message: 'Doctor route working ✅' });
// });


// // --- GET PROFILE (READ) ---
// // @route   GET /api/doctor/profile
// // @desc    Get the profile of the authenticated doctor
// // @access  Private
// router.get('/profile', protect, async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ message: 'User not authenticated' });
//     }

//     // CRITICAL FIX: Convert the string userId to a number for the database comparison
//     const numericUserId = parseInt(userId);
//     if (isNaN(numericUserId)) {
//         return res.status(400).json({ message: 'Invalid User ID format.' });
//     }

//     // Fetch data from both User and Doctor tables using a nested select (join)
//     const { data: doctorProfile, error } = await supabase
//       .from('User')
//       .select(`
//         user_id,
//         name,
//         email,
//         role,
//         Doctor(
//           doctor_id,
//           specialization,
//           license_number,
//           phone_number,
//           bio,
//           profile_picture_url,
//           education,
//           languages_spoken,
//           experience_years,
//           department_id
//         )
//       `)
//       .eq('user_id', numericUserId) // Use the converted numeric ID
//       .single();

//     if (error) {
//       console.error("Supabase Doctor Fetch Error:", error);
//       throw error;
//     }

//     if (!doctorProfile) {
//       return res.status(404).json({ message: 'Doctor profile not found' });
//     }

//     res.status(200).json(doctorProfile);
//   } catch (err: any) {
//     console.error('Doctor Profile GET Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // --- UPDATE PROFILE (PUT) ---
// // @route   PUT /api/doctor/profile
// // @desc    Update the profile of the authenticated doctor (professional details only)
// // @access  Private
// router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
//   res.json({message:"put route hit!"})
//   // try {
//   //   const userId = req.user?.id;
//   //   if (!userId) {
//   //     return res.status(401).json({ message: 'User not authenticated' });
//   //   }

//   //   // CRITICAL FIX: Convert the string userId to a number for the database comparison
//   //   const numericUserId = parseInt(userId);
//   //   if (isNaN(numericUserId)) {
//   //       return res.status(400).json({ message: 'Invalid User ID format.' });
//   //   }

//   //   // The frontend sends the Doctor-specific data in the body
//   //   const updatedData = req.body;

//   //   // Use the `update` query on the Doctor table
//   //   const { data: updatedDoctor, error } = await supabase
//   //     .from('Doctor')
//   //     .update(updatedData)
//   //     .eq('user_id', numericUserId) // Use the converted numeric ID for update query
//   //     .select();

//   //   if (error) {
//   //     console.error("Supabase Doctor Update Error:", error);
//   //     throw error;
//   //   }

//   //   if (!updatedDoctor || updatedDoctor.length === 0) {
//   //     return res.status(404).json({ message: 'Doctor record not found or no changes made' });
//   //   }

//   //   // NOTE: The update query only returns the Doctor record; name/email update is not done here.
//   //   res.status(200).json({ message: 'Profile updated successfully', updatedDoctor: updatedDoctor[0] });
//   // } catch (err: any) {
//   //   console.error('Update request handler error:', err);
//   //   res.status(500).json({ message: 'Server error' });
//   // }
// });

// export default router;


// backend/routes/doctor/profileRoutes.ts
import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';

const router = Router();

// Extend the Request type for TypeScript
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// --- TEST ROUTE ---
router.get('/test', (req, res) => {
  res.json({ message: 'Doctor route working ✅' });
});

// @route   GET /api/doctor/departments
// @desc    Get all available departments
// @access  Private
router.get('/departments', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { data: departments, error } = await supabase
      .from('Departments')
      .select('department_id, name');

    if (error) {
      console.error("Supabase Departments Fetch Error:", error);
      throw error;
    }
    res.status(200).json(departments);
  } catch (err: any) {
    console.error('Departments GET Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- GET PROFILE (READ) ---
// @route   GET /api/doctor/profile
// @desc    Get the profile of the authenticated doctor
// @access  Private
router.get('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) return res.status(400).json({ message: 'Invalid User ID format' });

    // Fetch doctor profile from User + Doctor tables
    const { data: doctorProfile, error } = await supabase
      .from('User')
      .select(`
        user_id,
        name,
        email,
        role,
        Doctor(
          doctor_id,
          specialization,
          license_number,
          phone_number,
          bio,
          profile_picture_url,
          education,
          languages_spoken,
          experience_years,
          department_id
        )
      `)
      .eq('user_id', numericUserId)
      .single();

    if (error) {
      console.error('Supabase Doctor Fetch Error:', error);
      return res.status(500).json({ message: 'Failed to fetch profile', error });
    }

    if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

    res.status(200).json(doctorProfile);
  } catch (err: any) {
    console.error('Doctor Profile GET Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- UPDATE PROFILE (PUT / UPSERT) ---
// @route   PUT /api/doctor/profile
// @desc    Update the profile of the authenticated doctor
// @access  Private
// router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ message: 'User not authenticated' });

//     const numericUserId = parseInt(userId);
//     if (isNaN(numericUserId)) return res.status(400).json({ message: 'Invalid User ID format' });

//     const updatedData = req.body;

//     // console.log('PUT /profile hit');
//     // console.log('JWT userId:', numericUserId);
//     // console.log('Request body:', updatedData);

//     // UPSERT: creates row if not exists, updates if exists
//     const { data: updatedDoctor, error } = await supabase
//       .from('Doctor')
//       .upsert({ user_id: numericUserId, ...updatedData })
//       .select();

//     if (error) {
//       // console.error('Supabase Doctor Upsert Error:', error);
//       return res.status(500).json({ message: 'Failed to update profile', error });
//     }

//     if (!updatedDoctor || updatedDoctor.length === 0) {
//       return res.status(404).json({ message: 'Doctor record not found or no changes made' });
//     }

//     res.status(200).json({ message: 'Profile updated successfully', updatedDoctor: updatedDoctor[0] });
//   } catch (err: any) {
//     // console.error('Doctor Profile PUT Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// backend/routes/doctor/profileRoutes.ts (PUT /profile)

// router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ message: 'User not authenticated' });

//     const numericUserId = parseInt(userId);
//     if (isNaN(numericUserId)) return res.status(400).json({ message: 'Invalid User ID format' });

//     const updatedData = req.body;
    
//     // --- Prepare Payload ---
//     // Remove primary keys and foreign keys that shouldn't be updated by the form itself
//     delete updatedData.doctor_id;
//     delete updatedData.user_id; 
    
//     // Convert experience_years back to number if it came in as a string
//     if (updatedData.experience_years !== undefined && updatedData.experience_years !== null) {
//         updatedData.experience_years = parseInt(updatedData.experience_years) || null;
//     }
    
//     // The final payload to upsert (including the user_id for conflict detection)
//     const upsertPayload = { 
//         user_id: numericUserId, 
//         ...updatedData 
//     };

//     // CRITICAL FIX: Use onConflict to target the unique 'user_id' column
//     const { data: updatedDoctor, error } = await supabase
//       .from('Doctor')
//       .upsert(upsertPayload, { onConflict: 'user_id' }) // <-- FIX: Targets the unique user_id
//       .select();

//     if (error) {
//       return res.status(500).json({ message: 'Failed to update profile', error });
//     }

//     if (!updatedDoctor || updatedDoctor.length === 0) {
//       return res.status(404).json({ message: 'Doctor record not found or no changes made' });
//     }
    
//     // NOTE: The update response here is only the Doctor table data. 
//     // The frontend must update the User table fields (name, email) separately if they were sent.

//     res.status(200).json({ message: 'Profile updated successfully', updatedDoctor: updatedDoctor[0] });
//   } catch (err: any) {
//     // console.error('Doctor Profile PUT Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ message: 'User not authenticated' });

//     const numericUserId = parseInt(userId);
//     if (isNaN(numericUserId)) return res.status(400).json({ message: 'Invalid User ID format' });

//     // --- 1. Filter the Payload to ONLY include editable Doctor fields ---
//     const incomingData = req.body;
    
//     // Define the exact fields that belong to the Doctor table
//     const doctorFields = [
//         'specialization', 'license_number', 'phone_number', 'experience_years',
//         'education', 'bio', 'languages_spoken', 'profile_picture_url', 'department_id' // Added other Doctor fields for safety
//     ];
    
//     const updatePayload: { [key: string]: any } = {};

//     // Build the payload by only including valid and non-null values for Doctor table
//     for (const key of doctorFields) {
//         if (incomingData[key] !== undefined) {
//             let value = incomingData[key];
            
//             // Handle number conversion for 'experience_years'
//             if (key === 'experience_years') {
//                 value = parseInt(value) || null;
//             }
//             // Convert empty strings to null for the database
//             updatePayload[key] = (value === '' || value === undefined) ? null : value;
//         }
//     }
    
//     // CRITICAL: Ensure we have at least one field to update
//     if (Object.keys(updatePayload).length === 0) {
//         return res.status(400).json({ message: 'No fields provided for update.' });
//     }
    
//     // --- 2. Execute the UPDATE operation targeting the specific user's record ---
//     const { data: updatedDoctor, error } = await supabase
//       .from('Doctor')
//       .update(updatePayload)
//       .eq('user_id', numericUserId) // CRITICAL: Only updates the record linked to the authenticated user
//       .select();

//     if (error) {
//         console.error('Supabase Doctor Update Error:', error);
//        return res.status(500).json({ message: 'Failed to update profile', error });
//     }

//     if (!updatedDoctor || updatedDoctor.length === 0) {
//         // This should not happen if the record exists (user_id is unique)
//         return res.status(404).json({ message: 'Doctor record not found or no changes made' });
//     }
//     
//     // --- 3. Final Response ---
//     res.status(200).json({ message: 'Profile updated successfully', updatedDoctor: updatedDoctor[0] });
//   } catch (err: any) {
//     console.error('Doctor Profile PUT Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated' });

    const numericUserId = parseInt(userId);
    if (isNaN(numericUserId)) return res.status(400).json({ message: 'Invalid User ID format' });

    // --- 1. Filter and Prepare the Payload ---
    const incomingData = req.body;
    
    // List all potential editable fields in the Doctor table
    const doctorFields = [
        'specialization', 'license_number', 'phone_number', 'experience_years',
        'education', 'bio', 'languages_spoken', 'profile_picture_url', 'department_id'
    ];
    
    const updatePayload: { [key: string]: any } = {};

    // Build the payload by including ONLY fields sent by the frontend
    for (const key of doctorFields) {
        // Check if the key was present in the request body
        if (incomingData[key] !== undefined) {
            let value = incomingData[key];
            
            // Convert number fields (experience_years, department_id) to INT or NULL
            if (key === 'experience_years' || key === 'department_id') {
                // Convert to number, use null if zero, empty string, or NaN
                const num = parseInt(value);
                value = isNaN(num) || num === 0 ? null : num;
            }
            // Convert empty strings to null for text fields
            else if (value === '') {
                value = null;
            }

            // Only add if it's not strictly undefined
            updatePayload[key] = value;
        }
    }
    
    // CRITICAL: Ensure we have at least one field to update
    if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }
    
    // --- 2. Execute the UPDATE operation targeting the specific user's record ---
    const { data: updatedDoctor, error } = await supabase
      .from('Doctor')
      .update(updatePayload)
      .eq('user_id', numericUserId) // Find the record linked to the authenticated user
      .select();

    if (error) {
        console.error('Supabase Doctor Update Error:', error);
       return res.status(500).json({ message: 'Failed to update profile', error });
    }

    if (!updatedDoctor || updatedDoctor.length === 0) {
        return res.status(404).json({ message: 'Doctor record not found or no changes made' });
    }
    
    // --- 3. Final Response ---
    res.status(200).json({ message: 'Profile updated successfully', updatedDoctor: updatedDoctor[0] });
  } catch (err: any) {
    console.error('Doctor Profile PUT Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/lab-catalog', protect, async (req: AuthRequest, res: Response) => {
    try {
        // Fetch data from the new TestsCatalog table
        const { data: catalog, error } = await supabase
            .from('TestsCatalog') 
            .select('test_id, test_name, normal_range'); // Fetch ID, Name, and Range

        if (error) throw error;
        res.status(200).json(catalog);
    } catch (err: any) {
        console.error('Lab Catalog Fetch Error:', err);
        res.status(500).json({ message: 'Failed to fetch lab catalog.' });
    }
});

export default router;

