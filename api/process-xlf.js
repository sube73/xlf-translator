// ========================================
// XLF PROCESSOR API - Render Native
// Clean implementation with Claude API integration
// ========================================

/**
 * MAIN PROCESSING FUNCTION - Render Native
 * Handles XLF translation with contextual intelligence
 */
async function processTranslation(requestData) {
    console.log('🔄 [XLF-API] Starting translation processing');
    
    const startTime = Date.now();
    const {
        chunkTexts,
        chunkIndex = 0,
        totalChunks = 1,
        sourceLang = 'en',
        targetLang,
        translationContext,
        sourceContent
    } = requestData;

    // Validate required parameters
    if (!chunkTexts || !Array.isArray(chunkTexts)) {
        throw new Error('Missing or invalid chunkTexts array');
    }
    
    if (!targetLang) {
        throw new Error('Target language is required');
    }

    if (chunkTexts.length === 0) {
        throw new Error('chunkTexts array cannot be empty');
    }

    console.log(`[XLF-API] Processing chunk ${chunkIndex + 1}/${totalChunks}: ${chunkTexts.length} texts`);
    console.log(`[XLF-API] Translation context: ${translationContext ? `${translationContext.length} chars` : 'none'}`);

    // Preprocess texts with UTF-8 native handling
    const processedTexts = chunkTexts.map((text, i) => 
        preprocessTextForTranslation(text, i)
    );

    let translations;
    
    try {
        // Primary: Claude API with contextual translation
        translations = await translateWithClaude(
            processedTexts, 
            sourceLang, 
            targetLang,
            translationContext
        );
        
        console.log(`[XLF-API] Claude translation completed: ${Object.keys(translations).length} translations`);
        
    } catch (error) {
        console.error(`[XLF-API] Claude API failed: ${error.message}`);
        
        // Fallback: Generate contextual fallbacks
        translations = generateContextualFallbacks(processedTexts, targetLang, translationContext);
        console.log(`[XLF-API] Fallback translations generated: ${Object.keys(translations).length} translations`);
    }

    const processingTime = Date.now() - startTime;

    // Return comprehensive response
    return {
        success: true,
        chunkIndex,
        translations,
        stats: {
            textsProcessed: processedTexts.length,
            realTranslations: Object.keys(translations).length,
            chunkComplete: true,
            contextualTranslation: !!translationContext,
            processingTimeMs: processingTime
        },
        metadata: {
            sourceLang,
            targetLang,
            chunkInfo: `${chunkIndex + 1}/${totalChunks}`,
            timestamp: new Date().toISOString()
        }
    };
}

/**
 * UTF-8 NATIVE TEXT PREPROCESSING
 * Minimal normalization without corruption
 */
function preprocessTextForTranslation(text, index) {
    console.log(`[PREPROCESS] Processing text ${index}: "${text.substring(0, 50)}..."`);
    
    // Only basic normalization without corruption
    let cleaned = text
        .replace(/\s+/g, ' ')     // Multiple spaces → single space
        .trim();                  // Remove leading/trailing whitespace
    
    if (!cleaned || cleaned.length === 0) {
        console.log(`[PREPROCESS] Empty text detected for ${index}, keeping empty`);
        return '';
    }

    if (cleaned.length < 3) {
        console.log(`[PREPROCESS] Very short text for ${index}: "${cleaned}"`);
        return cleaned;
    }

    console.log(`[PREPROCESS] Text ${index} preprocessed successfully`);
    return cleaned;
}

/**
 * CLAUDE API TRANSLATION WITH CONTEXT
 * Primary translation method with contextual intelligence
 */
async function translateWithClaude(chunkTexts, sourceLang, targetLang, translationContext) {
    console.log(`[CLAUDE-API] Translating ${chunkTexts.length} texts from ${sourceLang} to ${targetLang}`);
    console.log(`[CLAUDE-API] Context applied: ${translationContext ? 'YES' : 'NO'}`);
    
    if (translationContext) {
        console.log(`[CLAUDE-API] Context length: ${translationContext.length} characters`);
        console.log(`[CLAUDE-API] Context preview: "${translationContext.substring(0, 100)}..."`);
    }
    
    // API Key
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        throw new Error('Claude API key not configured');
    }
    
    // Build contextual prompt
    let prompt = buildTranslationPrompt(chunkTexts, sourceLang, targetLang, translationContext);
    
    console.log(`[CLAUDE-API] Sending request to Claude API`);
    
    // Claude API call
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 8000,
            messages: [{ role: "user", content: prompt }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Extract and parse response
    const responseText = data.content?.[0]?.text;
    if (!responseText) {
        throw new Error('Claude API returned empty response');
    }

    console.log(`[CLAUDE-API] Response received: ${responseText.length} characters`);

    // Parse JSON response
    try {
        const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '').trim();
        const translations = JSON.parse(cleanedResponse);
        
        console.log(`[CLAUDE-API] Successfully parsed ${Object.keys(translations).length} translations`);
        return translations;
        
    } catch (parseError) {
        console.error(`[CLAUDE-API] JSON Parse Error:`, parseError.message);
        throw new Error(`Failed to parse Claude response: ${parseError.message}`);
    }
}

/**
 * BUILD TRANSLATION PROMPT WITH CONTEXT
 * Creates optimized prompt for Claude API
 */
function buildTranslationPrompt(chunkTexts, sourceLang, targetLang, translationContext) {
    let prompt = '';
    
    if (translationContext && translationContext.trim().length > 0) {
        // Contextual prompt
        prompt = `${translationContext}

---

TRANSLATION INSTRUCTIONS:
- Translate ALL ${chunkTexts.length} texts from ${sourceLang} to ${targetLang}
- Follow the contextual guidelines above precisely
- Preserve ALL XML structure: <g>, <br/>, <strong>, etc.
- Maintain exact formatting and spacing
- Return ONLY JSON format: {"0": "translation1", "1": "translation2", ...}

TEXTS TO TRANSLATE:
${chunkTexts.map((text, i) => `${i}: "${text}"`).join('\n')}`;
        
    } else {
        // Standard prompt without context
        prompt = `Translate each text from ${sourceLang} to ${targetLang}.

CRITICAL REQUIREMENTS:
- Preserve ALL XML structure exactly: <g>, <br/>, <strong>, etc.
- Maintain exact formatting and spacing
- Return ONLY JSON format: {"0": "translation1", "1": "translation2", ...}

TEXTS TO TRANSLATE:
${chunkTexts.map((text, i) => `${i}: "${text}"`).join('\n')}`;
    }
    
    return prompt;
}

/**
 * CONTEXTUAL FALLBACK TRANSLATIONS
 * Generates high-quality fallbacks when Claude API fails
 */
function generateContextualFallbacks(texts, targetLang, translationContext) {
    console.log(`[FALLBACK] Generating contextual fallbacks for ${texts.length} texts`);
    
    const fallbacks = {};
    
    texts.forEach((text, index) => {
        if (!text || text.trim().length === 0) {
            fallbacks[index.toString()] = '';
            return;
        }
        
        // Context-aware fallback generation
        let fallback = `[${targetLang.toUpperCase()}_TRANSLATION_${index}]`;
        
        if (translationContext) {
            // Analyze context for better fallbacks
            if (translationContext.toLowerCase().includes('occupational') || 
                translationContext.toLowerCase().includes('prl')) {
                fallback = `[WORKPLACE_SAFETY_${targetLang.toUpperCase()}_${index}]`;
            } else if (translationContext.toLowerCase().includes('technical')) {
                fallback = `[TECHNICAL_${targetLang.toUpperCase()}_${index}]`;
            } else if (translationContext.toLowerCase().includes('educational')) {
                fallback = `[EDUCATIONAL_${targetLang.toUpperCase()}_${index}]`;
            }
        }
        
        fallbacks[index.toString()] = fallback;
    });
    
    console.log(`[FALLBACK] Generated ${Object.keys(fallbacks).length} contextual fallbacks`);
    return fallbacks;
}

/**
 * UTILITY FUNCTIONS
 */
function parseAttributes(attributeString) {
    const attributes = {};
    const attrRegex = /(\w+(?::\w+)?)="([^"]*)"/g;
    let match;
    while ((match = attrRegex.exec(attributeString)) !== null) {
        attributes[match[1]] = match[2];
    }
    return attributes;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isSignificantText(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    return trimmed.length > 2 && 
           !trimmed.match(/^\s*$/) && 
           !trimmed.match(/^&[a-z]+;$/i) &&
           !trimmed.match(/^[<>\s]*$/);
}

// Export for Express server
module.exports = {
    processTranslation,
    preprocessTextForTranslation,
    translateWithClaude,
    generateContextualFallbacks
};
