import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateAI, AI_MODELS } from '@/lib/ai/openrouter';

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    
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
    const { studentId, type, targetUniversity, targetProgram, additionalNotes, model = AI_MODELS.GPT4O } = body;

    if (!studentId || !type) {
      return NextResponse.json({ error: 'studentId and type are required' }, { status: 400 });
    }

    if (!['sop', 'study_plan', 'self_intro'].includes(type)) {
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

    const systemPrompt = `You are an expert academic writer and study abroad admissions counselor.
Your task is to write a highly professional, compelling, and custom document for a student applying to study abroad.
Ensure the writing is authentic, grammatically flawless, matches the student's background, and is structured perfectly.
Avoid generic AI cliches and write with clear, academic language. Do not output anything other than the document itself.`;

    let userPrompt = '';
    const targetUniText = targetUniversity || student.target_course_name || 'Selected University';
    const targetProgText = targetProgram || student.target_course_name || 'Selected Program';

    if (type === 'sop') {
      userPrompt = `Write a Statement of Purpose (SOP) for this student:
- Name: ${studentName}
- Date of Birth: ${dob}
- Highest Education: ${highestEdu} from ${institution}
- GPA / Score: ${gpa}
- Graduation Year: ${gradYear}
- English Language Proficiency: ${ielts}
- Target University: ${targetUniText}
- Target Program: ${targetProgText}
${additionalNotes ? `- Additional Context/Notes: ${additionalNotes}` : ''}

The SOP should cover:
1. Introduction and interest in the chosen program.
2. Academic background and how it prepared the student.
3. Why this specific university and target country are ideal.
4. Career goals and how this degree will help achieve them.
Structure it in 4-5 clear paragraphs.`;
    } else if (type === 'study_plan') {
      userPrompt = `Write a Study Plan for this student:
- Name: ${studentName}
- Date of Birth: ${dob}
- Academic Background: Completed ${highestEdu} at ${institution} with GPA ${gpa} (Graduation: ${gradYear})
- English Proficiency: ${ielts}
- Target Institution: ${targetUniText}
- Target Program: ${targetProgText}
${additionalNotes ? `- Additional Context/Notes: ${additionalNotes}` : ''}

The Study Plan must cover:
1. Reason for studying in the target country/university rather than the home country.
2. Plan of study, course interests, and research objectives.
3. Detailed schedule (Year 1 course study, Year 2 thesis/practicum).
4. Career plan upon returning to the home country.
Provide clear headings for each section.`;
    } else if (type === 'self_intro') {
      userPrompt = `Write a Self-Introduction Statement (personal intro) for this student:
- Name: ${studentName}
- Date of Birth: ${dob}
- Background: ${highestEdu} from ${institution}
- Target: ${targetProgText} at ${targetUniText}
- Key English Credentials: ${ielts}
${additionalNotes ? `- Additional Context/Notes: ${additionalNotes}` : ''}

Write a formal self-introduction highlighting academic motivation, personality traits, extra-curriculars or work ethic, and suitability for the chosen international university program. Should be around 300 words.`;
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
        dob,
        education: highestEdu,
        institution,
        gpa,
        ielts,
        target_university: targetUniText,
        target_program: targetProgText,
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
      console.error('[SOP Generator Database Log Error]', dbError);
      // Still return the generated text even if database logging failed
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
    console.error('[SOP Generator API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
