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

    // 2. Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, office_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // 3. Parse input params
    const body = await request.json();
    const { 
      type = 'ad_copy', 
      platform = 'Facebook', 
      description = '', 
      audience = 'Students', 
      tone = 'professional', 
      model = AI_MODELS.GPT4O 
    } = body;

    if (!description) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }

    // 4. Construct System & User Prompts
    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'ad_copy' || type === 'social_post') {
      systemPrompt = `You are an expert copywriter specializing in social media advertising for the study abroad and higher education industry.
Your goal is to write high-converting, attention-grabbing, and persuasive ad copies tailored for ${platform}.
Structure your output to include:
1. Catchy Headlines (3 options)
2. Primary Body Copy (using formatting like emojis and bullets for readability)
3. Call to Action (CTA)
4. Relevant hashtags.
Maintain a ${tone} tone throughout the response. Target audience: ${audience}.`;

      userPrompt = `Write ad copy for ${platform} about: ${description}. Target country/university details if any: ${description}. Keep the output clear, modern, and engaging.`;
    } else if (type === 'reel_idea') {
      systemPrompt = `You are a creative video content strategist and scriptwriter for TikTok, Instagram Reels, and YouTube Shorts.
Your goal is to write a comprehensive video outline for a 30-60 second short-form video.
Include:
1. Video Title / Visual Hook
2. Detailed Visual Storyboard (scene-by-scene visual descriptions)
3. Direct Voiceover (VO) Script / Narration script
4. Trending audio style recommendations
5. Social media caption with hashtags.
Maintain a ${tone} tone throughout the response. Target audience: ${audience}.`;

      userPrompt = `Generate a video script/reel idea about: ${description}. Visuals should feel premium, engaging, and modern.`;
    } else if (type === 'campaign') {
      systemPrompt = `You are a senior digital marketing director.
Your goal is to design a detailed 14-day social media marketing campaign schedule to build buzz, drive registrations, and increase engagement.
Output the plan in a clean Markdown Table containing the following columns:
- Day
- Platform (Facebook, IG, LinkedIn, TikTok, or WhatsApp)
- Topic / Focus
- Visual Asset / Media Idea
- Call to Action (CTA)
Include brief setup/strategy notes before the table.
Maintain a ${tone} tone. Target audience: ${audience}.`;

      userPrompt = `Generate a 14-day social media campaign calendar for: ${description}.`;
    } else {
      // Default fallback
      systemPrompt = `You are a helpful marketing assistant. Generate engaging content in a ${tone} tone.`;
      userPrompt = `Create marketing content about: ${description}.`;
    }

    // 5. Query OpenRouter (will automatically fallback to mocks if API keys are absent)
    const resultText = await generateAI({
      model,
      type,
      systemPrompt,
      userPrompt,
      maxTokens: 2500
    });

    // 6. Record generation event in ai_generations table
    const logPayload = {
      office_id: profile.office_id,
      user_id: user.id,
      type: 'advice', // fallback type to register, or we could add 'marketing' in future migrations
      model_used: model,
      input_data: { type, platform, audience, tone, description },
      output_text: resultText
    };

    const { error: logError } = await supabase
      .from('ai_generations')
      .insert(logPayload);
    
    if (logError) {
      console.warn('Logging AI generation to DB failed:', logError);
    }

    return NextResponse.json({ result: resultText }, { status: 200 });

  } catch (error) {
    console.error('[AI Marketing POST Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
