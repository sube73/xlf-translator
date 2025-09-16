// ========================================
// XLF TRANSLATOR SERVER - Render Native
// Clean implementation without any Netlify dependencies
// ========================================

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// API Routes
const processXlf = require('./api/process-xlf');
const generateContext = require('./api/generate-context');

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'xlf-translator-render',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API endpoints
app.post('/api/process-xlf', async (req, res) => {
    console.log('[RENDER-API] Processing XLF translation request');
    try {
        const result = await processXlf.processTranslation(req.body);
        res.json(result);
    } catch (error) {
        console.error('[RENDER-API] XLF processing error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            service: 'process-xlf'
        });
    }
});

app.post('/api/generate-context', async (req, res) => {
    console.log('[RENDER-API] Generating translation context');
    try {
        const result = await generateContext.generateTranslationContext(req.body);
        res.json(result);
    } catch (error) {
        console.error('[RENDER-API] Context generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            service: 'generate-context'
        });
    }
});

// Frontend routes - serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 XLF Translator - Render Native Server');
    console.log(`📍 Running on port ${PORT}`);
    console.log(`🔗 Health check: /health`);
    console.log(`📡 API endpoints:`);
    console.log(`   POST /api/process-xlf`);
    console.log(`   POST /api/generate-context`);
    console.log('✅ Ready to accept requests');
});

module.exports = app;
