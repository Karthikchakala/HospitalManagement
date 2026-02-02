// backend/routes/patient/billingRoutes.ts
import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { supabase } from '../../db';
import Razorpay from 'razorpay';
import { sendMail } from '../../mailer/transport';

const router = Router();

// Environment variables (ensure these exist in your .env)
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
const RAZORPAY_CURRENCY = 'INR';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID!,
  key_secret: RAZORPAY_KEY_SECRET!,
});

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// Helper to fetch Patient ID
const getPatientId = async (userId: string) => {
  const numericUserId = parseInt(userId);
  if (isNaN(numericUserId)) return null;
  const { data } = await supabase.from('Patient').select('patient_id').eq('user_id', numericUserId).single();
  return data?.patient_id;
};

// =====================
// GET /api/patient/bills
// =====================
router.get('/bills', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'User not authenticated.' });

    const patientId = await getPatientId(userId);
    if (!patientId) return res.status(404).json({ message: 'Patient record not found.' });

    const { data: bills, error } = await supabase
      .from('Billing')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(bills);
  } catch (err: any) {
    console.error('Billing GET Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// =====================
// PUT /api/patient/bills/:billId/pay
// =====================
router.put('/bills/:billId/pay', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const billId = req.params.billId;
    const { transactionId, paymentMethod = 'Online' } = req.body;

    const patientId = await getPatientId(userId!);
    if (!patientId) return res.status(404).json({ message: 'Patient record not found.' });

    const { data: updatedBill, error } = await supabase
      .from('Billing')
      .update({
        status: 'Paid',
        payment_date: new Date().toISOString(),
        payment_method: paymentMethod
      })
      .eq('bill_id', billId)
      .eq('patient_id', patientId)
      .select();

    if (error) throw error;
    if (!updatedBill || updatedBill.length === 0) return res.status(404).json({ message: 'Bill not found or already paid.' });

    // Send payment receipt email
    try {
      const { data: patientJoin } = await supabase
        .from('Patient')
        .select('patient_id, User(name,email)')
        .eq('patient_id', patientId)
        .single();

      const to = (patientJoin as any)?.User?.[0]?.email;
      const patientName = (patientJoin as any)?.User?.[0]?.name || 'Patient';
      const bill = (updatedBill as any)[0];
      if (to && bill) {
        const amount = bill.total_amount ?? 0;
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif">
            <h2>Payment Receipt</h2>
            <p>Dear ${patientName},</p>
            <p>Your payment has been received successfully.</p>
            <ul>
              <li><b>Bill ID:</b> ${bill.bill_id}</li>
              <li><b>Services:</b> ${bill.services || '—'}</li>
              <li><b>Total Amount:</b> ₹${amount}</li>
              <li><b>Method:</b> ${bill.payment_method || paymentMethod}</li>
              <li><b>Date:</b> ${bill.payment_date}</li>
              <li><b>Txn ID:</b> ${transactionId || 'N/A'}</li>
            </ul>
            <p>— Hospify</p>
          </div>`;
        await sendMail({ to, subject: 'Payment Receipt', html });
      }
    } catch (e) {
      console.error('[Billing] Receipt email failed:', (e as any)?.message || e);
    }

    res.status(200).json({ message: 'Bill status updated to Paid.', transactionId });
  } catch (err: any) {
    console.error('Bill Update Error:', err);
    res.status(500).json({ message: 'Failed to update bill status.' });
  }
});

// Helper to look up User Email (required for payment modal)
const getUserEmail = async (userId: string) => {
    const { data } = await supabase.from('User').select('email').eq('user_id', userId).single();
    return data?.email;
};

// @route   POST /api/patient/payment/generate-txn
// @desc    Generates a Razorpay Order ID for appointment payment
// @access  Private (Patient Only)
router.post('/payment/generate-txn', protect, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { amount } = req.body; // Only expect 'amount' from frontend

        if (!userId) { return res.status(401).json({ message: 'User not authenticated.' }); }
        if (!amount || amount <= 0) { return res.status(400).json({ message: 'Valid amount is required.' }); }

        // 1. Fetch user email for the payment modal
        const userEmail = await getUserEmail(userId as string); 
        if (!userEmail) { return res.status(404).json({ message: 'User email not found.' }); }

        // 2. Convert amount to the smallest currency unit (paise) and ensure it's an integer
        // This is mandatory for Razorpay
        const amountInPaise = Math.round(amount * 100); 

        // 3. Generate a unique Order ID based on User and Timestamp
        const orderId = `HMS_TXN_${userId}_${Date.now()}`;
        
        // 4. Prepare Razorpay Order Creation Options
        const options = {
            amount: amountInPaise,
            currency: RAZORPAY_CURRENCY,
            receipt: orderId, // Use the generated order ID as receipt
            payment_capture: 1, 
            notes: {
                user_id: userId // Embed the user ID for security/reference
            }
        };

        // 5. Create Order via Razorpay SDK
        const order = await razorpay.orders.create(options);

        // 6. Send back the Order ID and Key ID (from .env) to the frontend
        res.status(200).json({
            orderId: order.id,
            keyId: RAZORPAY_KEY_ID,
            amount: options.amount, // Amount in paise
            currency: options.currency,
            userEmail: userEmail
        });

    } catch (err: any) {
        console.error('Razorpay Order Creation Error:', err);
        res.status(500).json({ message: err?.error?.description || 'Failed to generate payment order.' });
    }
});

export default router;

// =====================
// GET /api/patient/bills/:billId/invoice
// =====================
router.get('/bills/:billId/invoice', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const billId = req.params.billId;
    if (!userId) return res.status(401).json({ message: 'User not authenticated.' });

    const patientId = await getPatientId(userId);
    if (!patientId) return res.status(404).json({ message: 'Patient record not found.' });

    const { data: rows, error } = await supabase
      .from('Billing')
      .select('*')
      .eq('bill_id', billId)
      .eq('patient_id', patientId)
      .limit(1);

    if (error) throw error;
    const bill = rows?.[0];
    if (!bill) return res.status(404).json({ message: 'Bill not found.' });

    const header = 'bill_id,date,services,total_amount,status,payment_date,method';
    const date = bill.created_at;
    const row = [bill.bill_id, date, (bill.services||'').toString().replace(/"/g,'""'), bill.total_amount, bill.status, bill.payment_date||'', bill.payment_method||'']
      .map(v => `"${String(v??'')}"`).join(',');
    const csv = [header, row].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${bill.bill_id}.csv"`);
    return res.status(200).send(csv);
  } catch (e:any) {
    console.error('Invoice download error:', e?.message || e);
    return res.status(500).json({ message: 'Failed to generate invoice.' });
  }
});

 
