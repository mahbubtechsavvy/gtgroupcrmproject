// Universal AI client using OpenRouter
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export const AI_MODELS = {
  GPT4O: 'openai/gpt-4o',
  CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
  GEMINI_PRO: 'google/gemini-pro-1.5',
  DEEPSEEK: 'deepseek/deepseek-chat',
  LLAMA: 'meta-llama/llama-3.1-70b-instruct',
};

// Robust mock generator for offline/development environments
function getMockResponse(type, userPrompt) {
  const lowerPrompt = userPrompt.toLowerCase();
  
  if (type === 'sop' || lowerPrompt.includes('sop') || lowerPrompt.includes('statement of purpose')) {
    return `STATEMENT OF PURPOSE

Dear Admissions Committee,

I am writing to express my enthusiastic interest in enrolling in the target program at your esteemed institution. Having completed my previous academic degree with strong standing, I have developed a robust foundation in the principles of my field and am eager to advance my knowledge through your rigorous curriculum.

My interest in this field began during my undergraduate studies, where I was exposed to key methodologies and theoretical frameworks. Since then, I have sought practical opportunities to apply these concepts, working on relevant projects and engaging in academic discussions. Your university represents the ideal next step in my journey due to its world-class faculty, state-of-the-art research facilities, and diverse student body.

Upon graduation, my goal is to return to my home country and leverage the advanced skills I acquire to contribute significantly to the local industry, driving innovation and raising standard practices. 

Thank you for considering my application.

Sincerely,
[Student Name]`;
  }

  if (type === 'study_plan' || lowerPrompt.includes('study plan')) {
    return `STUDY PLAN & RESEARCH OBJECTIVES

1. Introduction & Background
I have a background in academic studies with a focus on core subjects. My goal is to build on this through targeted postgraduate courses.

2. Academic Goals & Term-by-Term Plan
- Year 1: Focus on core theory, advanced seminars, and methodology courses.
- Year 2: Practical applications, laboratory research (if applicable), and thesis preparation under faculty guidance.

3. Future Career integration
After graduation, I plan to leverage this education to enter a leadership role, bridging academic theory and industry application.`;
  }

  if (type === 'self_intro' || lowerPrompt.includes('self introduction')) {
    return `PERSONAL INTRODUCTION / SELF-INTRODUCTION

Hello, my name is [Student Name]. I am a dedicated and highly motivated applicant from my home country, applying for the target degree program. I possess a strong work ethic, a passion for continuous learning, and an open-minded approach to cultural integration. I look forward to contributing positively to the university campus and collaborating with peers from around the world.`;
  }

  if (type === 'resume' || type === 'cv' || lowerPrompt.includes('resume') || lowerPrompt.includes('cv')) {
    return `CURRICULUM VITAE (CV)

[STUDENT NAME]
Email: student@example.com | Phone: +880-1234-567890

EDUCATION
- Bachelor of Science / Arts, CGPA: 3.8/4.0 (Graduation Year)
- High School Diploma, GPA: 5.0/5.0

ACADEMIC & PROFESSIONAL PROJECTS
- Key Research Project in Field of Study: Developed an optimized algorithm/framework that enhanced efficiency by 15%.
- Secondary Project: Coordinated a team of 4 to design and deploy a database CRM module.

SKILLS & CERTIFICATIONS
- Technical: JavaScript, SQL, Python, Next.js, HTML/CSS
- Languages: English (IELTS Band 7.5), Native Language
- Certifications: Advanced Project Design, Scrum Master Fundamentals`;
  }

  if (type === 'cover_letter' || lowerPrompt.includes('cover letter')) {
    return `COVER LETTER

Dear Admissions / Hiring Officer,

I am writing to formally submit my application for the program. With my academic background and hands-on project experience, I am confident in my ability to meet and exceed your expectations.

I look forward to the opportunity to discuss how my qualifications align with your requirements.

Sincerely,
[Student Name]`;
  }

  if (type === 'advice' || lowerPrompt.includes('recommend') || lowerPrompt.includes('suggest')) {
    return `### 🎓 University & Program Recommendations

Based on the academic profile provided, here are the top matching opportunities:

1. **Seoul National University (South Korea)**
   - **Program**: Master of Science in computer engineering/management.
   - **Matching Reason**: Perfect alignment with GPA requirements and strong IELTS scores.
   - **Scholarship**: Global Korea Scholarship (GKS) eligibility (covers 100% tuition + stipend).

2. **Yonsei University (South Korea)**
   - **Program**: Bachelor of Business Administration.
   - **Matching Reason**: Strong international student programs, highly ranked business school.
   - **Estimated Tuition**: $4,500/semester.

3. **Korea Advanced Institute of Science and Technology (KAIST)**
   - **Program**: PhD in electrical engineering.
   - **Matching Reason**: High research output matching the applicant's prior publication record.
   - **Scholarship**: KAIST International Student Scholarship.

### 🗺️ Visa & Admission Guidance
- Prepare your academic transcripts and have them apostilled or consular-verified.
- Ensure your bank statement holds at least $20,000 USD (standard requirement for visa D-2).`;
  }

  if (type === 'ad_copy' || type === 'social_post' || lowerPrompt.includes('ad copy') || lowerPrompt.includes('social post')) {
    return `🔥 STUDY ABROAD Mega Expo 2026 🔥

🚀 Are you dreaming of studying at top-ranked international universities in the USA, Canada, UK, or South Korea? This is your golden opportunity!

Join GT Group's upcoming Mega Study Abroad Expo to connect directly with university representatives, discover exclusive scholarship pathways (up to 100% tuition coverage), and get on-the-spot profile assessments.

✅ Free Admission
✅ 1-on-1 Session with Expert Counselors
✅ Complete Scholarship & Visa Guidelines

📍 Venue: Grand Ballroom, Westin Hotel, Dhaka
📅 Date: Friday, July 15, 2026 | Time: 10:00 AM - 5:00 PM

👉 Register now to secure your exclusive entry ticket!
[Link to Register]

#StudyAbroad #HigherEducation #GTGroupExpo #Scholarships #DhakaEvents #StudyInUSA #StudyInKorea`;
  }

  if (type === 'campaign' || lowerPrompt.includes('campaign') || lowerPrompt.includes('calendar')) {
    return `📅 14-DAY SOCIAL MEDIA CAMPAIGN PLAN: "Global Education Expo"

| Day | Platform | Topic/Focus | Visual Asset Idea | Action/CTA |
|-----|----------|-------------|-------------------|------------|
| Day 1 | Facebook/IG | Seminar Announcement | Bold flyer with Gold & Navy theme | "Register for Ticket" |
| Day 3 | Instagram | Scholarship Spotlight | Carousel of 100% scholarship programs | "Learn More" |
| Day 5 | LinkedIn | University Partnerships | Corporate photo of partner campuses | "Check Programs" |
| Day 7 | TikTok/Reels | Counselor Tips for IELTS | Short video explaining band requirements | "Book Consultation" |
| Day 9 | WhatsApp | Direct Invitations | Personal invitation template text | "Click to RSVP" |
| Day 11| Facebook/IG | Student Success Stories | Video testimonial of visa success | "Read Stories" |
| Day 13| All | 24 Hours Left Reminder | High-urgency countdown graphic | "Secure Seat" |
| Day 14| Live Event | Live Coverage & Q&A | Instagram Live / Photos of attendees | "Join Next Session" |`;
  }

  if (type === 'reel_idea' || lowerPrompt.includes('reel') || lowerPrompt.includes('script')) {
    return `🎬 REEL CONCEPT & SCRIPT: "How to Study in Korea with 100% Scholarship"

⏱️ Duration: 45 seconds | 🎵 Recommended Audio: Inspiring synth wave / trending upbeat track

---

### 🎥 Visual Storyboard & Script
1. **0:00 - 0:05 (Hook)**:
   - *Visual*: Counselor stands in front of a modern study desk, pointing to a screen showing "100% Scholarship SNU". Text overlay: "Study in Korea for FREE? 😱"
   - *Audio*: "Yes, you heard that right! You can study at Seoul National University with a full scholarship."

2. **0:05 - 0:20 (Step 1 - GPA & IELTS)**:
   - *Visual*: Close-up of academic requirements Checklist (GPA 4.5+ / IELTS 6.5+).
   - *Audio*: "Step 1: Check your eligibility. High school or Bachelor's grades matter, and a solid IELTS band opens doors instantly."

3. **0:20 - 0:35 (Step 2 - Documents)**:
   - *Visual*: Counselor showing a passport, personal statement (SOP), and recommendation letters folder.
   - *Audio*: "Step 2: Collect your documents. A compelling SOP and well-framed recommendation letters are critical."

4. **0:35 - 0:45 (Call to Action)**:
   - *Visual*: Transition to a premium screen displaying the GT Group logo and a QR registration code.
   - *Audio*: "Step 3: Register for our Mega Expo in Dhaka! We will review your profile on the spot. Click the link in bio!"

---

### 📝 Caption Template
Dreaming of studying in South Korea? 🇰🇷 From tuition fees to monthly stipends, the Global Korea Scholarship (GKS) has got you covered!
Want to know if your profile qualifies? Come to our Study Abroad Expo!
👉 Link in bio to register for FREE.`;
  }

  return `Generated AI content for student profile context. The system generated this output based on target preferences and credentials.`;
}

export async function generateAI({ model = AI_MODELS.GPT4O, type = 'sop', systemPrompt, userPrompt, maxTokens = 2000 }) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey.includes('your_key_here') || apiKey.trim() === '') {
    console.warn('[OpenRouter Client] API Key is missing. Falling back to mock generator.');
    // Simulate network delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 800));
    return getMockResponse(type, userPrompt);
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API responded with ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('[OpenRouter Client Error]', error);
    // Return mock fallback on error so application remains fully testable
    return getMockResponse(type, userPrompt);
  }
}
