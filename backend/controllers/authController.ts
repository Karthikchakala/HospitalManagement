// import { Request, Response } from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { supabase } from '../db';
// import { logAuditAction, getIpAddress } from '../utils/logger';

// const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// // User Registration
// export const registerUser = async (req: Request, res: Response) => {
//   // CRITICAL: Extract designation from the payload for staff/admin roles
//   const { name, email, password, role, designation } = req.body;

//   try {
//     // 1. Check if user already exists
//     const { data: userExists, error: userExistsError } = await supabase
//       .from('User')
//       .select('*')
//       .eq('email', email);

//     if (userExistsError) {
//       throw userExistsError;
//     }

//     if (userExists && userExists.length > 0) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // 2. Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // 3. Save the new user to the User table
//     const { data: newUser, error: newUserError } = await supabase
//       .from('User')
//       .insert([
//         { name, email, password: hashedPassword, role },
//       ])
//       .select();

//     if (newUserError) {
//       throw newUserError;
//     }

//     const newUserId = newUser[0].user_id;

//     // 4. Conditionally create a record in the auxiliary table based on role
//     if (role === 'doctor') {
//       const { error: doctorInsertError } = await supabase
//         .from('Doctor')
//         .insert([
//           { user_id: newUserId }
//         ]);

//       if (doctorInsertError) {
//         throw doctorInsertError;
//       }
//     } else if (role === 'patient') {
//       const { error: patientInsertError } = await supabase
//         .from('Patient')
//         .insert([
//           { user_id: newUserId }
//         ]);

//       if (patientInsertError) {
//         throw patientInsertError;
//       }
//     } else if (role === 'staff') {
//       // CRITICAL FIX: Insert designation for staff
//       const { error: staffInsertError } = await supabase
//         .from('Staff')
//         .insert([
//           { 
//             user_id: newUserId,
//             designation: designation || 'Unassigned' // Use submitted designation
//           }
//         ]);

//       if (staffInsertError) {
//         throw staffInsertError;
//       }
//     }

//     // 5. Generate a token
//     const token = jwt.sign({ id: newUserId, role: newUser[0].role }, JWT_SECRET, { expiresIn: '1h' });

//     res.status(201).json({ message: 'User registered successfully', token, role: newUser[0].role });
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // User Login
// export const loginUser = async (req: Request, res: Response) => {
//   const { email, password } = req.body;

//   try {
//     // 1. Check if user exists
//     const { data: user, error: userError } = await supabase
//       .from('User')
//       .select('*')
//       .eq('email', email);

//     if (userError) {
//       throw userError;
//     }

//     if (!user || user.length === 0) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // 2. Compare passwords
//     const isMatch = await bcrypt.compare(password, user[0].password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // 3. Generate and return a token
//     const token = jwt.sign({ id: user[0].user_id, role: user[0].role }, JWT_SECRET, { expiresIn: '1h' });

//     res.status(200).json({ message: 'Logged in successfully', token, role: user[0].role });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// backend/controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db'; 
import { logAuditAction, getIpAddress } from '../utils/logger'; // CRITICAL: New Import

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// User Registration (Logic remains the same as it was previously finalized)
export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password, role, designation } = req.body;

  try {
    // 1. Check user existence
    const { data: userExists } = await supabase
      .from('User').select('*').eq('email', email);
    if (userExists && userExists.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash password and save new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const { data: newUser, error: newUserError } = await supabase
      .from('User').insert([{ name, email, password: hashedPassword, role }]).select();
    if (newUserError) throw newUserError;
    const newUserId = newUser[0].user_id;

    // 3. Conditionally create record in auxiliary table
    if (role === 'doctor') {
      const { error: doctorInsertError } = await supabase.from('Doctor').insert([{ user_id: newUserId }]);
      if (doctorInsertError) throw doctorInsertError;
    } else if (role === 'patient') {
      const { error: patientInsertError } = await supabase.from('Patient').insert([{ user_id: newUserId }]);
      if (patientInsertError) throw patientInsertError;
    } else if (role === 'staff') {
      const { error: staffInsertError } = await supabase.from('Staff').insert([{ user_id: newUserId, designation: designation || 'Unassigned' }]);
      if (staffInsertError) throw staffInsertError;
    }

    // 4. Generate token and return success
    const token = jwt.sign({ id: newUserId, role: newUser[0].role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'User registered successfully', token, role: newUser[0].role });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User Login (UPDATED FOR AUDIT LOGGING)
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const ipAddress = getIpAddress(req); // Get IP from the utility

  try {
    // 1. Check if user exists
    const { data: user, error: userError } = await supabase
      .from('User').select('*').eq('email', email);

    if (userError) throw userError;

    if (!user || user.length === 0) {
      // Log failure: User not found
      logAuditAction({ userId: null, action: 'LOGIN_FAILED: USER NOT FOUND', ipAddress }); 
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user[0].password);
    const userId = user[0].user_id; // Get ID for logging

    if (!isMatch) {
      // Log failure: Password Mismatch
      logAuditAction({ userId, action: 'LOGIN_FAILED: PASSWORD MISMATCH', ipAddress }); 
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Log SUCCESS
    logAuditAction({ userId, action: 'LOGIN_SUCCESS', ipAddress }); 

    // 4. Generate and return a token
    const token = jwt.sign({ id: userId, role: user[0].role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Logged in successfully', token, role: user[0].role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};