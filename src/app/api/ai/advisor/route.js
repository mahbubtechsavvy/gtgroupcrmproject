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
    const { studentId, messageHistory = [], userMessage, model = AI_MODELS.GPT4O } = body;

    if (!userMessage?.trim()) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }

    let student = null;

    // 4. Optionally load student profile if studentId is provided
    if (studentId) {
      let studentQuery = supabase
        .from('students')
        .select('*, destinations(country_name), universities(name), programs(name)')
        .eq('id', studentId);

      const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(profile.role);
      if (!isSuperAdmin) {
        studentQuery = studentQuery.eq('office_id', profile.office_id);
      }

      const { data, error } = await studentQuery.single();
      if (!error) student = data;
    }

    // 5. Construct Context System Prompt
    let contextPrompt = `You are GT Student Advisor, a premium, intelligent AI consultant specializing in matching students with international universities (with focus on South Korea, USA, UK, Germany, Canada, and Australia).
`;

    if (student) {
      const studentName = `${student.first_name} ${student.last_name}`;
      const highestEdu = student.education_level || 'Not Specified';
      const institution = student.institution_name || 'Not Specified';
      const gpa = student.gpa || 'Not Specified';
      const gradYear = student.graduation_year || 'Not Specified';
      const ielts = student.ielts_overall ? `IELTS Overall: ${student.ielts_overall} (L: ${student.ielts_listening || 0}, R: ${student.ielts_reading || 0}, W: ${student.ielts_writing || 0}, S: ${student.ielts_speaking || 0})` : 'No IELTS score provided';
      const prefDestination = student.destinations?.country_name || student.target_destination_id || 'Any Country';
      const prefUniversity = student.universities?.name || student.target_university_id || 'Any University';
      const prefProgram = student.programs?.name || student.target_course_name || 'Any Program';

      contextPrompt += `
You are currently advising the student:
- Name: ${studentName}
- Date of Birth: ${student.date_of_birth || 'Not Specified'}
- Highest Education: ${highestEdu} from ${institution}
- GPA / Score: ${gpa}
- Graduation Year: ${gradYear}
- English Language Credentials: ${ielts}
- Preferred Study Destination: ${prefDestination}
- Target University Interest: ${prefUniversity}
- Target Program / Course: ${prefProgram}

Use this profile to customize all recommendations. For example, check if their GPA is sufficient for their target programs, and match their IELTS bands to entry requirements (many universities require 6.0 or 6.5 overall). Recommend realistic options. Make your answers concise, structured (using markdown lists and bold text), and highly practical. Provide scholarship names and visa D-2 (or F-1) timelines when helpful.`;
    } else {
      contextPrompt += `
You are providing general consultancy to an agent. Provide structured, realistic study abroad advice, estimated tuition fees, visa guidance, and university matching based on the parameters discussed.`;
    }

    // 6. Call OpenRouter with complete chat message history
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey.includes('your_key_here') || apiKey.trim() === '') {
      console.warn('[Advisor AI] API Key missing. Returning mock response.');
      const mockResult = getMockAdvisorResponse(userMessage, student);
      return NextResponse.json({ output: mockResult });
    }

    // Construct full messages payload for OpenRouter
    const chatMessages = [
      { role: 'system', content: contextPrompt },
      ...messageHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',
        },
        body: JSON.stringify({
          model,
          messages: chatMessages,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API responded with ${response.status}`);
      }

      const resData = await response.json();
      const outputText = resData.choices[0].message.content;

      // Log advice generation in database asynchronously
      if (studentId) {
        await supabase.from('ai_generations').insert({
          office_id: profile.office_id,
          student_id: studentId,
          user_id: user.id,
          type: 'advice',
          model_used: model,
          input_data: { user_message: userMessage },
          output_text: outputText,
          final_text: outputText
        });
      }

      return NextResponse.json({ output: outputText });
    } catch (apiError) {
      console.error('[Advisor AI Call Error]', apiError);
      const mockResult = getMockAdvisorResponse(userMessage, student);
      return NextResponse.json({ output: mockResult });
    }

  } catch (error) {
    console.error('[Advisor AI API Route Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fallback helper to provide context-aware response offline
function getMockAdvisorResponse(message, student) {
  const msgLower = message.toLowerCase();
  const name = student ? `${student.first_name}` : 'the student';
  
  if (msgLower.includes('scholarship')) {
    return `### 💰 Scholarship Recommendations for ${student ? student.first_name + ' ' + student.last_name : 'the Applicant'}

1. **Global Korea Scholarship (GKS)**:
   - **Coverage**: 100% tuition waiver, round-trip airfare, monthly stipend (1,000,000 KRW).
   - **Suitability**: Excellent for candidates with GPA above 80% or 3.2/4.0.
2. **University Specific Merit Scholarships**:
   - **Coverage**: 30% to 70% tuition waiver based on IELTS score (usually 6.5+ gets 50% waiver).
   - **Requirement**: Maintaining GPA of 3.0+ each semester.`;
  }
  
  if (msgLower.includes('visa')) {
    return `### ✈️ Visa Processing Guidelines for Study Destination

For D-2 Student Visa (South Korea) or F-1 Visa (USA):
1. **Consular Verification / Apostille**: Get your academic certificate and transcripts verified by the Ministry of Foreign Affairs and Ministry of Education.
2. **Financial Proof**:
   - Bank statement in student's or parents' name showing at least **$20,000 USD** (kept for at least 30 days).
   - Family relationship certificate (if bank statement is in parents' name).
3. **Application Timeline**: Process takes 4 to 8 weeks after receiving the official admission certificate (Standard Admission Letter).`;
  }

  return `### 🎓 GT Advisor AI response for ${name}

Regarding your question: "${message}"

Based on the profile:
- **Prior GPA**: ${student?.gpa || 'Not Specified'}
- **English score**: ${student?.ielts_overall || 'Not Specified'}
- **Target Country**: ${student?.destinations?.country_name || 'Selected Destination'}

**My Recommendations:**
- Research programs starting in the next intake (March/September).
- Ensure your passport has at least 1.5 years validity before applying.
- Gather recommenders (teachers/professors) for letters of recommendation.

How can I help you refine this selection?`;
}
