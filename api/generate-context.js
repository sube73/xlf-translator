// ========================================
// CONTEXT GENERATOR API - Render Native
// Clean implementation with intelligent content analysis
// ========================================

/**
 * MAIN CONTEXT GENERATION FUNCTION - Render Native
 * Analyzes content and generates contextual translation guidelines
 */
async function generateTranslationContext(requestData) {
    console.log('🧠 [CONTEXT-API] Starting context generation');
    
    const startTime = Date.now();
    const {
        sampleTexts = [],
        userContext = '',
        targetLang = 'es',
        contentType = 'educational'
    } = requestData;

    // Validate required parameters
    if (!sampleTexts || !Array.isArray(sampleTexts)) {
        throw new Error('Missing or invalid sampleTexts array');
    }
    
    if (sampleTexts.length === 0) {
        throw new Error('sampleTexts array cannot be empty');
    }

    console.log(`[CONTEXT-API] Analyzing ${sampleTexts.length} sample texts for ${targetLang}`);
    console.log(`[CONTEXT-API] User context provided: ${userContext ? 'YES' : 'NO'}`);

    let translationContext;
    
    try {
        // Primary: Claude API for intelligent analysis
        translationContext = await generateContextWithClaude(
            sampleTexts, 
            userContext, 
            targetLang
        );
        
        console.log(`[CONTEXT-API] Claude context generated: ${translationContext.length} characters`);
        
    } catch (error) {
        console.error(`[CONTEXT-API] Claude API failed: ${error.message}`);
        
        // Fallback: Enhanced local analysis
        translationContext = generateEnhancedLocalContext(
            sampleTexts, 
            userContext, 
            targetLang
        );
        
        console.log(`[CONTEXT-API] Enhanced local context generated: ${translationContext.length} characters`);
    }

    const processingTime = Date.now() - startTime;

    // Return comprehensive response
    return {
        success: true,
        translationContext,
        stats: {
            sampleTextsAnalyzed: sampleTexts.length,
            contextLength: translationContext.length,
            userContextProvided: !!userContext,
            processingTimeMs: processingTime
        },
        metadata: {
            targetLang,
            contentType,
            generationMethod: translationContext.includes('**CONTENT TYPE**') ? 'claude' : 'local',
            timestamp: new Date().toISOString()
        }
    };
}

/**
 * CLAUDE API CONTEXT GENERATION
 * Primary method for intelligent content analysis
 */
async function generateContextWithClaude(sampleTexts, userContext, targetLang) {
    console.log(`[CLAUDE-CONTEXT] Generating context with Claude API for ${targetLang}`);
    
    // API Key
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
        throw new Error('Claude API key not configured');
    }
    
    // Prepare representative sample (max 40 texts for analysis)
    const sampleForAnalysis = sampleTexts.slice(0, 40).join('\n---\n');
    
    // Build analysis prompt
    const prompt = `Analyze this content and generate precise translation context guidelines.

CONTENT SAMPLE (first 40 representative texts):
${sampleForAnalysis}

${userContext ? `ADDITIONAL USER CONTEXT: ${userContext}` : ''}

TARGET LANGUAGE: ${targetLang}

Generate ONLY a structured translation context (max 800 characters) in exactly this format:

**CONTENT TYPE**: [Educational/Training/Technical/Corporate/Interactive]
**DOMAIN**: [Identify specific domain: Corporate Training, Technical Software, Academic Course, E-Learning Platform, Occupational Health & Safety Training, etc.]
**TERMINOLOGY APPROACH**: [Specific ${targetLang} terminology guidance for this domain - be precise about technical vs educational language]
**TONE**: [Professional/Academic/Technical/Instructional/Interactive - choose most appropriate]
**AUDIENCE**: [Learners/Employees/Students/Technical Users/End Users - be specific]
**SPECIAL CONSIDERATIONS**: [UI elements, technical accuracy, cultural adaptation, learning flow, interaction clarity - list relevant ones]
${userContext ? `**USER REQUIREMENTS**: [Incorporate user context here]` : ''}
**QUALITY STANDARDS**: Maintain XML structure integrity, preserve spacing, ensure ${targetLang} linguistic accuracy

Focus on translation quality enhancement. Be specific and actionable.`;

    console.log(`[CLAUDE-CONTEXT] Sending analysis request to Claude API`);
    
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
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }]
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Extract response
    const responseText = data.content?.[0]?.text;
    if (!responseText) {
        throw new Error('Claude API returned empty response');
    }

    console.log(`[CLAUDE-CONTEXT] Context analysis completed: ${responseText.length} characters`);
    return responseText.trim();
}

/**
 * ENHANCED LOCAL CONTEXT ANALYSIS
 * Fallback method with intelligent pattern recognition
 */
function generateEnhancedLocalContext(sampleTexts, userContext, targetLang) {
    console.log(`[LOCAL-CONTEXT] Generating enhanced local context for ${targetLang}`);
    
    const analysis = analyzeContentPatterns(sampleTexts);
    const domainAnalysis = detectContentDomain(sampleTexts);
    
    console.log(`[LOCAL-CONTEXT] Content analysis: Domain=${domainAnalysis.primary}, Confidence=${domainAnalysis.confidence}%`);
    
    // Build contextual guidelines
    let contextualPrompt = `**CONTENT TYPE**: ${analysis.contentType}\n`;
    contextualPrompt += `**DOMAIN**: ${domainAnalysis.description}\n`;
    contextualPrompt += `**TERMINOLOGY APPROACH**: ${getTerminologyApproach(domainAnalysis.primary, targetLang)}\n`;
    contextualPrompt += `**TONE**: ${analysis.recommendedTone}\n`;
    contextualPrompt += `**AUDIENCE**: ${analysis.targetAudience}\n`;
    contextualPrompt += `**SPECIAL CONSIDERATIONS**: ${analysis.specialConsiderations}\n`;
    
    if (userContext && userContext.trim().length > 0) {
        contextualPrompt += `**USER REQUIREMENTS**: ${userContext.trim()}\n`;
    }
    
    contextualPrompt += `**QUALITY STANDARDS**: Maintain XML structure integrity, preserve spacing, ensure ${targetLang} linguistic accuracy\n`;
    
    console.log(`[LOCAL-CONTEXT] Enhanced local context generated: ${contextualPrompt.length} characters`);
    return contextualPrompt.trim();
}

/**
 * CONTENT PATTERN ANALYSIS
 * Analyzes content for type, tone, and audience
 */
function analyzeContentPatterns(sampleTexts) {
    const allContent = sampleTexts.join(' ').toLowerCase();
    
    const analysis = {
        contentType: 'Educational/Training Content',
        recommendedTone: 'Professional',
        targetAudience: 'Learners',
        specialConsiderations: []
    };
    
    // UI/Interactive elements detection
    if (/\b(click|button|navigate|select|choose|continue|next|previous|start|complete)\b/.test(allContent)) {
        analysis.specialConsiderations.push('UI elements');
        analysis.specialConsiderations.push('interaction clarity');
    }
    
    // Technical content detection
    if (/\b(api|system|configuration|database|server|technical|setup|install)\b/.test(allContent)) {
        analysis.recommendedTone = 'Technical';
        analysis.targetAudience = 'Technical Users';
        analysis.specialConsiderations.push('technical accuracy');
    }
    
    // Educational content detection
    if (/\b(lesson|course|learning|training|module|chapter|quiz|student|learn)\b/.test(allContent)) {
        analysis.contentType = 'E-Learning Platform';
        analysis.specialConsiderations.push('learning flow');
    }
    
    // Corporate content detection
    if (/\b(company|organization|employee|business|corporate|workplace|team)\b/.test(allContent)) {
        analysis.contentType = 'Corporate Training';
        analysis.targetAudience = 'Employees';
        analysis.recommendedTone = 'Professional';
    }
    
    return analysis;
}

/**
 * DOMAIN DETECTION WITH CONFIDENCE SCORING
 * Identifies specific content domains
 */
function detectContentDomain(sampleTexts) {
    const allContent = sampleTexts.join(' ').toLowerCase();
    
    const domains = {
        prl: {
            name: 'Occupational Health & Safety (PRL)',
            keywords: [
                'prl', 'prevención', 'riesgos laborales', 'ergonomía', 'postura', 'asiento', 'respaldo', 
                'estrés laboral', 'seguridad', 'salud laboral', 'workplace safety', 'occupational health',
                'ergonomic', 'posture', 'safety guidelines', 'health risks', 'prevention'
            ],
            weight: 0
        },
        
        technical: {
            name: 'Technical & IT Training',
            keywords: [
                'api', 'system', 'software', 'configuration', 'install', 'database', 'server', 'code',
                'technical', 'setup', 'data', 'process', 'function', 'network', 'interface', 'development'
            ],
            weight: 0
        },
        
        educational: {
            name: 'Educational & E-Learning',
            keywords: [
                'lesson', 'course', 'learning', 'training', 'module', 'chapter', 'quiz', 'assessment',
                'knowledge', 'skill', 'student', 'learn', 'teach', 'education', 'instruction'
            ],
            weight: 0
        },
        
        corporate: {
            name: 'Corporate Training',
            keywords: [
                'company', 'organization', 'team', 'department', 'employee', 'business', 'corporate',
                'workplace', 'professional', 'management', 'process', 'procedure', 'policy'
            ],
            weight: 0
        }
    };
    
    // Calculate domain weights
    Object.keys(domains).forEach(domainKey => {
        const domain = domains[domainKey];
        domain.keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = allContent.match(regex);
            if (matches) {
                domain.weight += matches.length;
            }
        });
    });
    
    // Find dominant domain
    const dominantDomain = Object.keys(domains).reduce((a, b) => 
        domains[a].weight > domains[b].weight ? a : b
    );
    
    const maxWeight = domains[dominantDomain].weight;
    const confidence = maxWeight > 0 ? Math.min(Math.round((maxWeight / sampleTexts.length) * 100), 95) : 50;
    
    return {
        primary: dominantDomain,
        description: domains[dominantDomain].name,
        confidence: confidence,
        weights: Object.fromEntries(
            Object.keys(domains).map(key => [key, domains[key].weight])
        )
    };
}

/**
 * GET TERMINOLOGY APPROACH
 * Returns domain-specific terminology guidance
 */
function getTerminologyApproach(domain, targetLang) {
    const approaches = {
        prl: `Professional ${targetLang} workplace safety terminology, technical precision for ergonomic and health concepts`,
        technical: `Technical ${targetLang} terminology with accuracy for system/software concepts, maintain English technical terms where standard`,
        educational: `Clear, accessible ${targetLang} with educational clarity, avoid overly technical jargon unless necessary`,
        corporate: `Professional business ${targetLang} terminology, formal register appropriate for corporate environment`
    };
    
    return approaches[domain] || `Professional ${targetLang} terminology appropriate for the content domain`;
}

// Export for Express server
module.exports = {
    generateTranslationContext,
    generateContextWithClaude,
    generateEnhancedLocalContext,
    analyzeContentPatterns,
    detectContentDomain
};
