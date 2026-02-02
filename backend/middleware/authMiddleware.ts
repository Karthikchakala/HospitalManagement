// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';

// // Extend the Express Request type to include a user property
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//         role: string;
//       };
//     }
//   }
// }

// const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// export const protect = (req: Request, res: Response, next: NextFunction) => {
//   let token;

//   // 1. Check if the Authorization header exists and is in the correct format
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     try {
//       // 2. Extract the token
//       token = req.headers.authorization.split(' ')[1];
      
//       // 3. Verify the token using your JWT secret
//       const decoded: any = jwt.verify(token, JWT_SECRET);

//       // 4. Attach the decoded user payload to the request object
//       req.user = { id: decoded.id, role: decoded.role };

//       // 5. Call the next middleware/route handler
//       next();
//     } catch (error) {
//       // If verification fails, send a 401 error
//       console.error('Token verification failed:', error);
//       res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   } else {
//     // If no token is found in the headers, send a 401 error
//     res.status(401).json({ message: 'Not authorized, no token' });
//   }
// };

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request type to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

// Use environment variable or fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

interface JwtPayload {
  id: string;      // user ID
  role: string;    // user role: doctor/admin/patient
  iat?: number;
  exp?: number;
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1️⃣ Get Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // 2️⃣ Extract token
    const token = authHeader.split(' ')[1];

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // 4️⃣ Attach decoded user info to req.user
    req.user = { id: decoded.id, role: decoded.role };

    // ✅ Move to next middleware / route
    next();
  } catch (err: any) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
