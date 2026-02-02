// backend/routes/dashboardRoutes.ts
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/dashboard', protect, (req, res) => {
  // This route is now protected and can only be accessed with a valid JWT
  res.json({ message: 'Welcome to your dashboard!' });
});

export default router;