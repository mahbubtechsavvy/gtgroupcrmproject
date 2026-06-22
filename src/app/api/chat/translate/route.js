import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Note: In a real production environment, you would use @google-cloud/translate
// For this implementation, we provide the architecture and a placeholder for the API call.

export async function POST(request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messageId, text, targetLanguage, type, engine: requestedEngine } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
    }

    if (!messageId || !type) {
      return NextResponse.json({ error: 'Missing messageId or type' }, { status: 400 });
    }

    // 1. Check cache first
    const cacheQuery = supabase
      .from('chat_message_translations')
      .select('translated_text')
      .eq('target_language', targetLanguage);
    
    if (type === 'group') {
      cacheQuery.eq('message_id', messageId);
    } else {
      cacheQuery.eq('dm_message_id', messageId);
    }

    const { data: cacheData } = await cacheQuery.single();

    if (cacheData) {
      return NextResponse.json({
        translatedText: cacheData.translated_text,
        cached: true,
        sourceLanguage: cacheData.source_language,
        translationEngine: cacheData.translation_engine,
      });
    }

    // 2. Get API Keys and configuration
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'google_translate_api_key', 
        'deepl_api_key', 
        'libretranslate_url', 
        'default_translation_engine',
        'enable_chat_translation'
      ]);
    
    const settingsMap = {};
    settings?.forEach(s => settingsMap[s.key] = s.value);

    const isEnabled = settingsMap.enable_chat_translation !== 'false';
    if (!isEnabled) {
      return NextResponse.json({ error: 'Translation is currently disabled' }, { status: 403 });
    }

    const engine = requestedEngine || settingsMap.default_translation_engine || process.env.DEFAULT_TRANSLATION_ENGINE || 'google';

    // 3. Perform translation based on engine
    let translatedText = '';
    let sourceLanguage = 'auto';
    let provider = engine;

    try {
      if (engine === 'google') {
        const apiKey = settingsMap.google_translate_api_key || process.env.GOOGLE_TRANSLATE_API_KEY;
        if (!apiKey || apiKey === 'your_google_translate_api_key') throw new Error('Google API key not configured');

        const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: text, target: targetLanguage })
        });
        const result = await response.json();
        translatedText = result.data?.translations?.[0]?.translatedText;
        sourceLanguage = result.data?.translations?.[0]?.detectedSourceLanguage || 'auto';
      } 
      else if (engine === 'deepl') {
        const apiKey = settingsMap.deepl_api_key || process.env.DEEPL_API_KEY;
        if (!apiKey) throw new Error('DeepL API key not configured');

        const response = await fetch('https://api-free.deepl.com/v2/translate', {
          method: 'POST',
          headers: { 
            'Authorization': `DeepL-Auth-Key ${apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            text: text,
            target_lang: targetLanguage.toUpperCase()
          })
        });
        const result = await response.json();
        translatedText = result.translations?.[0]?.text;
        sourceLanguage = result.translations?.[0]?.detected_source_language || 'auto';
      }
      else if (engine === 'libre' || engine === 'libretranslate') {
        const url = settingsMap.libretranslate_url || process.env.LIBRETRANSLATE_URL || 'https://translate.argosopentech.com';
        const response = await fetch(`${url}/translate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: 'auto',
            target: targetLanguage,
            format: 'text'
          })
        });
        const result = await response.json();
        translatedText = result.translatedText;
        sourceLanguage = result.detectedLanguage?.language || result.source || 'auto';
      }

      if (!translatedText) throw new Error(`No translation result from ${engine}`);

    } catch (err) {
      console.error(`${engine} Translation Error:`, err);
      // Fallback to mock for demo/debug if absolutely necessary, or return error
      translatedText = `[${engine} Error]: ${text}`;
      provider = 'fallback';
    }

    // 3. Save to cache
    const insertData = {
      source_language: sourceLanguage || 'auto',
      target_language: targetLanguage,
      translated_text: translatedText,
      translation_engine: provider,
    };

    if (type === 'group') {
      insertData.message_id = messageId;
    } else {
      insertData.dm_message_id = messageId;
    }

    await supabase.from('chat_message_translations').upsert(insertData, {
      onConflict: type === 'group' ? 'message_id,target_language' : 'dm_message_id,target_language',
    });

    return NextResponse.json({
      translatedText,
      cached: false,
      sourceLanguage,
      translationEngine: provider,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
