import { createServerSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const FALLBACK_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'Bangla' },
  { code: 'ko', name: 'Korean' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'si', name: 'Sinhala' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'th', name: 'Thai' },
  { code: 'ms', name: 'Malay' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
];

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ languages: FALLBACK_LANGUAGES }), { status: 200 });
    }

    const url = `https://translation.googleapis.com/language/translate/v2/languages?key=${apiKey}&target=en`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data?.data?.languages) {
      return new Response(JSON.stringify({ languages: FALLBACK_LANGUAGES }), { status: 200 });
    }

    const languages = data.data.languages.map((lang) => ({
      code: lang.language,
      name: lang.name || lang.language,
    }));

    return new Response(JSON.stringify({ languages }), { status: 200 });
  } catch (error) {
    console.error('/api/chat/translate/languages GET error:', error);
    return new Response(JSON.stringify({ languages: FALLBACK_LANGUAGES }), { status: 200 });
  }
}
