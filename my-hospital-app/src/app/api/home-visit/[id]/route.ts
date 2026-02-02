import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

// PATCH /api/home-visit/:id → update visit status (Accepted, Completed, Cancelled) and optional assigned_id
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
    }

    const body = await req.json();
    const status = body?.status ? String(body.status) : undefined;
    const assigned_id = body?.assigned_id != null ? Number(body.assigned_id) : undefined;

    const updates: { status?: string; assigned_id?: number | null } = {};
    if (status) updates.status = status;
    if (assigned_id !== undefined) updates.assigned_id = assigned_id || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: 'No updatable fields provided' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('HomeVisit')
      .update(updates)
      .eq('visit_id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Home visit updated', data }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update home visit';
    return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
  }
}
