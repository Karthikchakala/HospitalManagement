import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// POST /api/home-visit → create a new home visit booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const patient_id = Number(body?.patient_id);
    const assigned_id = body?.assigned_id != null ? Number(body.assigned_id) : null;
    const service_type = (body?.service_type || '').toString().trim();
    const visit_date = (body?.visit_date || '').toString().trim();
    const visit_time = (body?.visit_time || '').toString().trim();
    const address = (body?.address || '').toString().trim();
    const notes = (body?.notes || '').toString().trim();

    if (!patient_id || !service_type || !visit_date || !visit_time || !address) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Auto-assign doctor only if service_type === 'Doctor' and assigned_id provided; otherwise leave null
    const insertPayload = {
      patient_id,
      assigned_id: service_type === 'Doctor' ? (assigned_id || null) : null,
      service_type,
      visit_date,
      visit_time,
      address,
      notes,
      status: 'Pending',
    };

    const { data, error } = await supabaseServer
      .from('HomeVisit')
      .insert([insertPayload])
      .select('*')
      .single();

    if (error) throw error;

    // Trigger backend mailer to send confirmation
    try {
      const base = process.env.BACKEND_BASE_URL || 'http://localhost:5000';
      await fetch(`${base}/api/notifications/home-visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visit_id: data.visit_id }),
      });
    } catch (e) {
      // Non-blocking
      console.warn('[HomeVisit] Failed to trigger confirmation mail:', e);
    }

    return NextResponse.json({ success: true, message: 'Home visit booked', data }, { status: 201 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to create home visit';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}

// GET /api/home-visit → fetch visits (optional filters: patient_id, assigned_id, service_type)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patient_id = searchParams.get('patient_id');
    const assigned_id = searchParams.get('assigned_id');
    const service_type = searchParams.get('service_type');

    let query = supabaseServer.from('HomeVisit').select('*').order('created_at', { ascending: false });
    if (patient_id) query = query.eq('patient_id', Number(patient_id));
    if (assigned_id) query = query.eq('assigned_id', Number(assigned_id));
    if (service_type) query = query.eq('service_type', service_type);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Fetched home visits', data }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch home visits';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
