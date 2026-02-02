import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// GET /api/staff/inventory → list all medicines
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('Pharmacy')
      .select('*')
      .order('pharmacy_id', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Fetched inventory', data }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// POST /api/staff/inventory → add a medicine
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Accept either raw medicine_details (string) or structured fields
    const name = (body?.name ?? '').toString().trim();
    const details = (body?.details ?? '').toString().trim();
    const batch_number = (body?.batch_number ?? '').toString().trim();
    const expiry_date = body?.expiry_date ? new Date(body.expiry_date) : null;
    const category = (body?.category ?? '').toString().trim();
    const rawDetails = (body?.medicine_details ?? '').toString().trim();

    if (expiry_date && isNaN(expiry_date.getTime())) {
      return NextResponse.json({ success: false, message: 'Invalid expiry_date' }, { status: 400 });
    }

    // Build medicine_details value (text column)
    // If only 'name' is provided (and no other structured fields), store as plain string
    let medicine_details: string = rawDetails;
    const hasAnyStructured = Boolean(name || details || batch_number || expiry_date || category);
    if (hasAnyStructured) {
      const onlyName = Boolean(name) && !details && !batch_number && !expiry_date && !category;
      if (onlyName) {
        medicine_details = name;
      } else {
        const detailsObj: Record<string, unknown> = {};
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
      return NextResponse.json({ success: false, message: 'medicine_details is required' }, { status: 400 });
    }
    if (quantity < 0 || price < 0 || Number.isNaN(quantity) || Number.isNaN(price)) {
      return NextResponse.json({ success: false, message: 'quantity and price must be non-negative numbers' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('Pharmacy')
      .insert([{ medicine_details, quantity, price }])
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Medicine added', data }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to add medicine';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
