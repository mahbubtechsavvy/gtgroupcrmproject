const axios = require('axios');

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';

/**
 * Translates text using local LibreTranslate instance
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language ISO code (e.g., 'ko', 'bn', 'vi')
 * @param {string} sourceLang - Source language ISO code (default: 'auto' for auto-detection)
 * @returns {Promise<string>} Translated text or original text on failure
 */
async function translateText(text, targetLang, sourceLang = 'auto') {
  try {
    // Validate inputs
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text provided to translateText');
      return text || '';
    }

    const response = await axios.post(
      `${LIBRETRANSLATE_URL}/translate`,
      {
        q: text,
        source: sourceLang,
        target: targetLang
      },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.translatedText) {
      return response.data.translatedText;
    }

    console.warn('Unexpected response structure from LibreTranslate');
    return text;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('LibreTranslate service is not running on', LIBRETRANSLATE_URL);
    } else if (error.response) {
      console.error('LibreTranslate API error:', error.response.status, error.response.data);
    } else if (error.message) {
      console.error('Translation error:', error.message);
    }

    // Graceful fallback: return original text to prevent chat server crash
    return text;
  }
}

/**
 * Translate message with error handling for chat applications
 * @param {string} messageText - The message to translate
 * @param {string} targetLanguage - ISO 639-1 code (e.g., 'ko', 'bn', 'vi', 'en', 'si')
 * @returns {Promise<{success: boolean; text: string; language: string; error?: string}>}
 */
async function translateMessageForChat(messageText, targetLanguage) {
  try {
    const translated = await translateText(messageText, targetLanguage);
    return {
      success: true,
      text: translated,
      language: targetLanguage
    };
  } catch (error) {
    return {
      success: false,
      text: messageText,
      language: targetLanguage,
      error: error.message
    };
  }
}

module.exports = {
  translateText,
  translateMessageForChat
};
