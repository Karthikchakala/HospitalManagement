import express from 'express';
import { supabase } from '../../db';

const router = express.Router();

// GET /api/staff/inventory
router.get('/inventory', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('Pharmacy')
      .select('*')
      .order('pharmacy_id', { ascending: true });
    if (error) throw error;
    return res.status(200).json({ success: true, message: 'Fetched inventory', data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch inventory' });
  }
});

// POST /api/staff/inventory
router.post('/inventory', async (req, res) => {
  try {
    const body = req.body || {};
    const name = (body?.name ?? '').toString().trim();
    const details = (body?.details ?? '').toString().trim();
    const batch_number = (body?.batch_number ?? '').toString().trim();
    const expiry_date = body?.expiry_date ? new Date(body.expiry_date) : null;
    const category = (body?.category ?? '').toString().trim();
    const rawDetails = (body?.medicine_details ?? '').toString().trim();

    if (expiry_date && isNaN(expiry_date.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid expiry_date' });
    }

    let medicine_details: string = rawDetails;
    const hasAnyStructured = Boolean(name || details || batch_number || expiry_date || category);
    if (hasAnyStructured) {
      const onlyName = Boolean(name) && !details && !batch_number && !expiry_date && !category;
      if (onlyName) {
        medicine_details = name;
      } else {
        const detailsObj: any = {};
        if (name) detailsObj.name = name;
        if (details) detailsObj.details = details;
        if (batch_number) detailsObj.batch_number = batch_number;
        if (expiry_date) detailsObj.expiry_date = expiry_date.toISOString().slice(0, 10);
        if (category) detailsObj.category = category;
        medicine_details = JSON.stringify(detailsObj);
      }
    }

    const quantity = Number(body?.quantity ?? 0);
    const price = Number(body?.price ?? 0);

    if (!medicine_details) {
      return res.status(400).json({ success: false, message: 'medicine_details is required' });
    }
    if (quantity < 0 || price < 0 || Number.isNaN(quantity) || Number.isNaN(price)) {
      return res.status(400).json({ success: false, message: 'quantity and price must be non-negative numbers' });
    }

    const { data, error } = await supabase
      .from('Pharmacy')
      .insert([{ medicine_details, quantity, price }])
      .select('*')
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, message: 'Medicine added', data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to add medicine' });
  }
});

// PUT /api/staff/inventory/:id
router.put('/inventory/:id', async (req, res) => {
  try {
    const idNum = Number(req.params.id);
    if (!idNum || Number.isNaN(idNum)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const body = req.body || {};
    const updates: Record<string, any> = {};

    if (body.quantity !== undefined) {
      const q = Number(body.quantity);
      if (Number.isNaN(q) || q < 0) {
        return res.status(400).json({ success: false, message: 'quantity must be a non-negative number' });
      }
      updates.quantity = q;
    }
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (Number.isNaN(p) || p < 0) {
        return res.status(400).json({ success: false, message: 'price must be a non-negative number' });
      }
      updates.price = p;
    }

    const hasStructured = ['name','details','batch_number','expiry_date','category','medicine_details'].some(k => body[k] !== undefined);
    if (hasStructured) {
      const { data: existing, error: getErr } = await supabase
        .from('Pharmacy')
        .select('medicine_details')
        .eq('pharmacy_id', idNum)
        .single();
      if (getErr) {
        return res.status(500).json({ success: false, message: getErr.message || 'Failed to load existing item' });
      }
      let currentObj: any = {};
      const raw = (existing as any)?.medicine_details as string | null;
      if (raw) {
        try { currentObj = JSON.parse(raw); } catch { currentObj = { text: raw }; }
      }
      const nextObj: any = { ...currentObj };
      if (body.name !== undefined) nextObj.name = String(body.name || '').trim();
      if (body.details !== undefined) nextObj.details = String(body.details || '').trim();
      if (body.batch_number !== undefined) nextObj.batch_number = String(body.batch_number || '').trim();
      if (body.category !== undefined) nextObj.category = String(body.category || '').trim();
      if (body.expiry_date !== undefined) {
        if (body.expiry_date) {
          const d = new Date(body.expiry_date);
          if (isNaN(d.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid expiry_date' });
          }
          nextObj.expiry_date = d.toISOString().slice(0, 10);
        } else {
          delete nextObj.expiry_date;
        }
      }
      if (body.medicine_details !== undefined && !Object.keys(body).some(k => ['name','details','batch_number','expiry_date','category'].includes(k))) {
        updates.medicine_details = String(body.medicine_details || '').trim();
      } else {
        updates.medicine_details = JSON.stringify(nextObj);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update (quantity, price)' });
    }

    const { data, error } = await supabase
      .from('Pharmacy')
      .update(updates)
      .eq('pharmacy_id', idNum)
      .select('*')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Medicine updated', data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to update medicine' });
  }
});

// DELETE /api/staff/inventory/:id
router.delete('/inventory/:id', async (req, res) => {
  try {
    const idNum = Number(req.params.id);
    if (!idNum || Number.isNaN(idNum)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const { error } = await supabase
      .from('Pharmacy')
      .delete()
      .eq('pharmacy_id', idNum);

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Medicine deleted', data: { id: idNum } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Failed to delete medicine' });
  }
});

export default router;
