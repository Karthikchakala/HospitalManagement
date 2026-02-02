// backend/routes/authRoutes.ts
import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';
import { body } from 'express-validator';

const router = Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['patient', 'doctor', 'admin', 'staff']).withMessage('Invalid role'),
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginUser
);

export default router;