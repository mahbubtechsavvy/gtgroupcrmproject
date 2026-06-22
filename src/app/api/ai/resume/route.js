import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAI, AI_MODELS } from '@/lib/ai/openrouter';

export async function POST(request) {
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

    // 3. Parse request body
    const body = await request.json();
    const { studentId, type, jobTitle, companyName, additionalNotes, model = AI_MODELS.GPT4O } = body;

    if (!studentId || !type) {
      return NextResponse.json({ error: 'studentId and type are required' }, { status: 400 });
    }

    if (!['resume', 'cv', 'cover_letter'].includes(type)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // 4. Fetch student details (enforcing office isolation for non-super-admins)
    let studentQuery = supabase
      .from('students')
      .select('*')
      .eq('id', studentId);

    const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
    if (!isSuperAdmin) {
      studentQuery = studentQuery.eq('office_id', profile.office_id);
    }

    const { data: student, error: studentError } = await studentQuery.single();
    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }

    // 5. Construct prompts based on student data
    const studentName = `${student.first_name} ${student.last_name}`;
    const dob = student.date_of_birth || 'Not Specified';
    const highestEdu = student.education_level || 'Not Specified';
    const institution = student.institution_name || 'Not Specified';
    const gpa = student.gpa || 'Not Specified';
    const gradYear = student.graduation_year || 'Not Specified';
    const ielts = student.ielts_overall ? `IELTS Overall: ${student.ielts_overall} (L: ${student.ielts_listening || 0}, R: ${student.ielts_reading || 0}, W: ${student.ielts_writing || 0}, S: ${student.ielts_speaking || 0})` : 'No IELTS score provided';

    const systemPrompt = `You are a professional HR specialist, resume writer, and career advisor.
Your task is to write a highly professional, polished, and modern document.
Ensure the layout suggestions are clean, standard formatting is applied, and vocabulary is executive and action-oriented.
Do not output anything other than the document itself.`;

    let userPrompt = '';

    if (type === 'resume' || type === 'cv') {
      userPrompt = `Generate a professional, structured ${type.toUpperCase()} for this student based on their profile:
- Full Name: ${studentName}
- Nationality: ${student.nationality || 'Not Specified'}
- Contact Email: ${student.email || 'Not Specified'}
- Contact Phone: ${student.phone || 'Not Specified'}
- Highest Education: ${highestEdu} at ${institution} (GPA: ${gpa}, Graduated: ${gradYear})
- English Credentials: ${ielts}
${additionalNotes ? `- Additional Background / Work Experience / Skills: ${additionalNotes}` : ''}

Structure the CV/Resume with these clear sections:
1. Contact Information
2. Professional Summary (compelling 3-sentence hook)
3. Education History
4. Academic & Professional Projects
5. Core Skills (Technical & Soft Skills)
6. Language Proficiency & Certificates
Format it beautifully in plain text/markdown.`;
    } else if (type === 'cover_letter') {
      userPrompt = `Write a professional Cover Letter for this student:
- Name: ${studentName}
- Academic Background: Completed ${highestEdu} at ${institution} with GPA ${gpa} (Graduated: ${gradYear})
- Target Role/Program: ${jobTitle || 'Academic Program Admissions'}
- Target Institution/Company: ${companyName || student.target_university_id || 'International University'}
- Key Highlights: ${ielts}
${additionalNotes ? `- Additional Context/Notes: ${additionalNotes}` : ''}

The cover letter should contain:
1. Professional header.
2. Opening paragraph expressing interest in the role/admissions program.
3. Mid paragraphs matching the student's academic background and strengths to the program.
4. Closing call-to-action requesting an interview or review.
Limit to 1 page (approx 350 words).`;
    }

    // 6. Generate document via OpenRouter AI helper
    const outputText = await generateAI({
      model,
      type,
      systemPrompt,
      userPrompt,
      maxTokens: 2500,
    });

    // 7. Save generation details to database
    const generationRecord = {
      office_id: profile.office_id,
      student_id: studentId,
      user_id: user.id,
      type,
      model_used: model,
      input_data: {
        student_name: studentName,
        education: highestEdu,
        institution,
        gpa,
        ielts,
        job_title: jobTitle || '',
        company_name: companyName || '',
        additional_notes: additionalNotes || ''
      },
      output_text: outputText,
      final_text: outputText,
      is_edited: false
    };

    const { data: dbData, error: dbError } = await supabase
      .from('ai_generations')
      .insert(generationRecord)
      .select()
      .single();

    if (dbError) {
      console.error('[Resume Builder Database Log Error]', dbError);
      return NextResponse.json({
        id: null,
        output: outputText,
        message: 'Generation succeeded but logging failed: ' + dbError.message
      });
    }

    return NextResponse.json({
      id: dbData.id,
      output: dbData.output_text,
      createdAt: dbData.created_at
    }, { status: 200 });

  } catch (error) {
    console.error('[Resume Builder API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
