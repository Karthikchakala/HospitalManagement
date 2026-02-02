import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// PUT /api/staff/inventory/:id → update quantity or price
export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  try {
    const idNum = Number(params.id);
    if (!idNum || Number.isNaN(idNum)) {
      return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
    }

    const body = await _req.json();
    const updates: Record<string, unknown> = {};

    if (body.quantity !== undefined) {
      const q = Number(body.quantity);
      if (Number.isNaN(q) || q < 0) {
        return NextResponse.json({ success: false, message: 'quantity must be a non-negative number' }, { status: 400 });
      }
      updates.quantity = q;
    }
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (Number.isNaN(p) || p < 0) {
        return NextResponse.json({ success: false, message: 'price must be a non-negative number' }, { status: 400 });
      }
      updates.price = p;
    }

    // Handle structured fields to update medicine_details JSON stored in text column
    const hasStructured = ['name', 'details', 'batch_number', 'expiry_date', 'category', 'medicine_details'].some(k => body[k] !== undefined);
    if (hasStructured) {
      // Fetch existing to merge
      const { data: existing, error: getErr } = await supabaseServer
        .from('Pharmacy')
        .select('medicine_details')
        .eq('pharmacy_id', idNum)
        .single();
      if (getErr) {
        return NextResponse.json({ success: false, message: getErr.message || 'Failed to load existing item' }, { status: 500 });
      }
      let currentObj: Record<string, unknown> = {};
      const raw = (existing as { medicine_details: string | null })?.medicine_details;
      if (raw) {
        try { currentObj = JSON.parse(raw); } catch { currentObj = { text: raw }; }
      }
      const nextObj: Record<string, unknown> = { ...currentObj };
      if (body.name !== undefined) nextObj.name = String(body.name || '').trim();
      if (body.details !== undefined) nextObj.details = String(body.details || '').trim();
      if (body.batch_number !== undefined) nextObj.batch_number = String(body.batch_number || '').trim();
      if (body.category !== undefined) nextObj.category = String(body.category || '').trim();
      if (body.expiry_date !== undefined) {
        if (body.expiry_date) {
          const d = new Date(body.expiry_date);
          if (isNaN(d.getTime())) {
            return NextResponse.json({ success: false, message: 'Invalid expiry_date' }, { status: 400 });
          }
          nextObj.expiry_date = d.toISOString().slice(0, 10);
        } else {
          delete nextObj.expiry_date;
        }
      }
      if (body.medicine_details !== undefined && !Object.keys(body).some(k => ['name', 'details', 'batch_number', 'expiry_date', 'category'].includes(k))) {
        // If only raw medicine_details provided, use it directly
        updates.medicine_details = String(body.medicine_details || '').trim();
      } else {
        updates.medicine_details = JSON.stringify(nextObj);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: 'No valid fields to update (quantity, price)' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('Pharmacy')
      .update(updates)
      .eq('pharmacy_id', idNum)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Medicine updated', data }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update medicine';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// DELETE /api/staff/inventory/:id → delete a medicine
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const idNum = Number(params.id);
    if (!idNum || Number.isNaN(idNum)) {
      return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('Pharmacy')
      .delete()
      .eq('pharmacy_id', idNum);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Medicine deleted', data: { id: idNum } }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to delete medicine';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
