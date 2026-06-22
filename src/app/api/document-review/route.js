import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch user's profile and office_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    // 3. Fetch reviews (enforcing office isolation)
    let reviewQuery = supabase
      .from('human_document_reviews')
      .select('*, users(full_name)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin) {
      reviewQuery = reviewQuery.eq('office_id', profile.office_id);
    }

    const { data: reviews, error: fetchError } = await reviewQuery;

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json(reviews, { status: 200 });

  } catch (error) {
    console.error('[Human Review GET Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch user's profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { studentId, status, reviewNotes, errorMarkings = {}, recommendations = [], finalApproval = false } = body;

    if (!studentId || !status) {
      return NextResponse.json({ error: 'studentId and status are required' }, { status: 400 });
    }

    // Verify student exists and user has access
    let studentQuery = supabase
      .from('students')
      .select('office_id')
      .eq('id', studentId);

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin) {
      studentQuery = studentQuery.eq('office_id', profile.office_id);
    }

    const { data: student, error: studentError } = await studentQuery.single();
    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }

    // 4. Save human review record
    const payload = {
      office_id: student.office_id,
      student_id: studentId,
      reviewer_id: user.id,
      status,
      review_notes: reviewNotes,
      error_markings: errorMarkings,
      recommendations,
      final_approval: finalApproval,
      reviewed_at: new Date().toISOString()
    };

    const { data: dbData, error: dbError } = await supabase
      .from('human_document_reviews')
      .insert(payload)
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    // 5. Update student pipeline status if approved or needs fixes
    if (status === 'approved' && finalApproval) {
      await supabase
        .from('students')
        .update({ pipeline_status: 'documents_collecting' }) // progress pipeline state if needed
        .eq('id', studentId);
    }

    return NextResponse.json(dbData, { status: 201 });

  } catch (error) {
    console.error('[Human Review POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
