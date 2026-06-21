import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * GET /api/chat/preferences
 * Fetch the current user's chat preferences (language, auto-translate, etc.)
 */
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('chat_user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine — user just hasn't set preferences yet
      throw error;
    }

    // Return defaults if no preferences exist
    const preferences = data || {
      user_id: user.id,
      preferred_language: 'en',
      auto_translate: false,
      notification_sound: true,
      theme: 'dark',
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('GET /api/chat/preferences error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/chat/preferences
 * Update the current user's chat preferences.
 * 
 * Body: {
 *   preferred_language?: string,     // e.g., 'en', 'ko', 'bn', 'vi'
 *   auto_translate?: boolean,        // auto-translate incoming messages
 *   notification_sound?: boolean,    // play sound on new messages
 *   theme?: string                   // 'dark' | 'light'
 * }
 */
export async function PUT(request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const allowedFields = ['preferred_language', 'auto_translate', 'notification_sound', 'theme'];
    
    // Only allow known fields
    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Upsert: create if not exists, update if exists
    const { data, error } = await supabase
      .from('chat_user_preferences')
      .upsert(
        { user_id: user.id, ...updateData },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT /api/chat/preferences error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Supported languages for the translation engine
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
];
