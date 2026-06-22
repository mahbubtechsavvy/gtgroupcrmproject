import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const supabase = createServerSupabaseClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { to_status, note } = body;

    const validStatuses = [
      'draft', 'submitted', 'gt_review', 'under_review',
      'docs_required', 'accepted', 'rejected', 'offer_issued', 'enrolled'
    ];

    if (!to_status || !validStatuses.includes(to_status)) {
      return NextResponse.json({ error: 'Invalid or missing target status' }, { status: 400 });
    }

    // 3. Fetch current application details to check office permissions
    const { data: app, error: appErr } = await supabase
      .from('university_applications')
      .select('status, office_id, student_id')
      .eq('id', id)
      .single();

    if (appErr || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // 4. Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin && app.office_id !== profile.office_id) {
      return NextResponse.json({ error: 'Unauthorized Office Access' }, { status: 403 });
    }

    const from_status = app.status;

    // 5. Update Status
    const { data: updatedApp, error: updateErr } = await supabase
      .from('university_applications')
      .update({ status: to_status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 6. Log in History
    const historyRecord = {
      application_id: id,
      from_status,
      to_status,
      changed_by: user.id,
      note: note || `Transitioned status from ${from_status} to ${to_status}.`
    };
    await supabase.from('application_status_history').insert(historyRecord);

    // 7. Route in-app/email notifications (System trigger)
    const notificationRecord = {
      user_id: user.id,
      office_id: app.office_id,
      type: 'application_update',
      title: 'Application Status Updated',
      body: `Application stage changed to ${to_status.toUpperCase()} for student file.`,
      data: { application_id: id, student_id: app.student_id, stage: to_status },
      channels: ['in_app']
    };
    await supabase.from('notifications').insert(notificationRecord);

    return NextResponse.json({ data: updatedApp }, { status: 200 });

  } catch (error) {
    console.error('[API Applications Status PUT Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
