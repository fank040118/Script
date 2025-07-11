// ==UserScript==
// @name         AI Translation Extension
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  AI-powered translation extension with custom API support
// @author       Assistant
// @match        *://*/*
// @exclude      *://localhost/*
// @exclude      *://127.0.0.1/*
// @exclude      *://0.0.0.0/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('[AI Translator] Extension loaded');
    
    // Configuration
    const CONFIG = {
        storageKeys: {
            apiKey: 'ai_translator_api_key',
            baseUrl: 'ai_translator_base_url',
            enabled: 'ai_translator_enabled',
            debugMode: 'ai_translator_debug_mode'
        },
        defaults: {
            baseUrl: 'https://api.openai.com/v1',
            enabled: true,
            debugMode: false
        },
        segmentMaxLength: 500,
        translationDelay: 1000 // Delay between translations to avoid rate limiting
    };
    
    // State management
    let isTranslating = false;
    let translationQueue = [];
    let debugPanel = null;
    let settingsPanel = null;
    
    // Utility functions
    function debugLog(message, data = null) {
        const debugMode = GM_getValue(CONFIG.storageKeys.debugMode, CONFIG.defaults.debugMode);
        if (debugMode) {
            console.log('[AI Translator Debug]', message, data);
            if (debugPanel) {
                addDebugMessage(message, data);
            }
        }
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `ai-translator-notification ai-translator-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
            word-wrap: break-word;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // Text segmentation
    function segmentText(text) {
        debugLog('Segmenting text', { originalLength: text.length });
        
        // Clean and normalize text
        text = text.trim().replace(/\s+/g, ' ');
        
        if (text.length <= CONFIG.segmentMaxLength) {
            return [text];
        }
        
        const segments = [];
        const sentences = text.split(/(?<=[.!?。！？])\s+/);
        
        let currentSegment = '';
        
        for (const sentence of sentences) {
            if ((currentSegment + sentence).length <= CONFIG.segmentMaxLength) {
                currentSegment += (currentSegment ? ' ' : '') + sentence;
            } else {
                if (currentSegment) {
                    segments.push(currentSegment);
                    currentSegment = sentence;
                } else {
                    // Handle very long sentences by splitting on commas or other punctuation
                    const parts = sentence.split(/(?<=[,;，；])\s+/);
                    for (const part of parts) {
                        if (part.length <= CONFIG.segmentMaxLength) {
                            if ((currentSegment + part).length <= CONFIG.segmentMaxLength) {
                                currentSegment += (currentSegment ? ' ' : '') + part;
                            } else {
                                if (currentSegment) segments.push(currentSegment);
                                currentSegment = part;
                            }
                        } else {
                            // Force split very long parts
                            if (currentSegment) {
                                segments.push(currentSegment);
                                currentSegment = '';
                            }
                            segments.push(part.substring(0, CONFIG.segmentMaxLength));
                        }
                    }
                }
            }
        }
        
        if (currentSegment) {
            segments.push(currentSegment);
        }
        
        debugLog('Text segmented', { segments: segments.length, lengths: segments.map(s => s.length) });
        return segments.filter(s => s.trim().length > 0);
    }
    
    // API functions
    async function translateText(text, targetLanguage = 'zh-CN') {
        const apiKey = GM_getValue(CONFIG.storageKeys.apiKey);
        const baseUrl = GM_getValue(CONFIG.storageKeys.baseUrl, CONFIG.defaults.baseUrl);
        
        if (!apiKey) {
            throw new Error('API Key not configured');
        }
        
        const prompt = `Please translate the following text to ${targetLanguage}. Only return the translated text without any explanations or additional content:\n\n${text}`;
        
        debugLog('Making API request', { text: text.substring(0, 100) + '...', targetLanguage });
        
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${baseUrl}/chat/completions`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                data: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                }),
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            const translation = data.choices[0].message.content.trim();
                            debugLog('Translation received', { original: text.substring(0, 50) + '...', translation: translation.substring(0, 50) + '...' });
                            resolve(translation);
                        } else {
                            debugLog('API Error', { status: response.status, response: response.responseText });
                            reject(new Error(`API Error: ${response.status} - ${response.responseText}`));
                        }
                    } catch (error) {
                        debugLog('Parse Error', error);
                        reject(new Error(`Parse Error: ${error.message}`));
                    }
                },
                onerror: function(error) {
                    debugLog('Request Error', error);
                    reject(new Error(`Request Error: ${error}`));
                }
            });
        });
    }
    
    // UI Creation
    function createSettingsPanel() {
        const panel = document.createElement('div');
        panel.className = 'ai-translator-settings';
        panel.innerHTML = `
            <div class="ai-translator-settings-header">
                <h3>AI Translation Settings</h3>
                <button class="ai-translator-close-btn" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
            </div>
            <div class="ai-translator-settings-content">
                <div class="ai-translator-field">
                    <label>API Key:</label>
                    <input type="password" id="ai-translator-api-key" placeholder="Enter your AI API key">
                </div>
                <div class="ai-translator-field">
                    <label>Base URL:</label>
                    <input type="text" id="ai-translator-base-url" placeholder="https://api.openai.com/v1">
                </div>
                <div class="ai-translator-field">
                    <label>
                        <input type="checkbox" id="ai-translator-enabled"> Enable Translation
                    </label>
                </div>
                <div class="ai-translator-field">
                    <label>
                        <input type="checkbox" id="ai-translator-debug"> Debug Mode
                    </label>
                </div>
                <div class="ai-translator-buttons">
                    <button id="ai-translator-save">Save Settings</button>
                    <button id="ai-translator-test">Test API</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Load current settings
        document.getElementById('ai-translator-api-key').value = GM_getValue(CONFIG.storageKeys.apiKey, '');
        document.getElementById('ai-translator-base-url').value = GM_getValue(CONFIG.storageKeys.baseUrl, CONFIG.defaults.baseUrl);
        document.getElementById('ai-translator-enabled').checked = GM_getValue(CONFIG.storageKeys.enabled, CONFIG.defaults.enabled);
        document.getElementById('ai-translator-debug').checked = GM_getValue(CONFIG.storageKeys.debugMode, CONFIG.defaults.debugMode);
        
        // Event handlers
        document.getElementById('ai-translator-save').addEventListener('click', saveSettings);
        document.getElementById('ai-translator-test').addEventListener('click', testAPI);
        
        return panel;
    }
    
    function createDebugPanel() {
        const panel = document.createElement('div');
        panel.className = 'ai-translator-debug';
        panel.innerHTML = `
            <div class="ai-translator-debug-header">
                <h3>AI Translation Debug</h3>
                <button class="ai-translator-close-btn" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
                <button id="ai-translator-clear-debug">Clear</button>
            </div>
            <div class="ai-translator-debug-content">
                <div id="ai-translator-debug-messages"></div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        document.getElementById('ai-translator-clear-debug').addEventListener('click', () => {
            document.getElementById('ai-translator-debug-messages').innerHTML = '';
        });
        
        return panel;
    }
    
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.className = 'ai-translator-control';
        panel.innerHTML = `
            <div class="ai-translator-control-header">AI Translator</div>
            <div class="ai-translator-control-buttons">
                <button id="ai-translator-translate-page">Translate Page</button>
                <button id="ai-translator-show-settings">Settings</button>
                <button id="ai-translator-show-debug">Debug</button>
                <button id="ai-translator-toggle-panel">Hide</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Event handlers
        document.getElementById('ai-translator-translate-page').addEventListener('click', translatePage);
        document.getElementById('ai-translator-show-settings').addEventListener('click', showSettings);
        document.getElementById('ai-translator-show-debug').addEventListener('click', showDebug);
        document.getElementById('ai-translator-toggle-panel').addEventListener('click', toggleControlPanel);
        
        return panel;
    }
    
    // Event handlers
    function saveSettings() {
        const apiKey = document.getElementById('ai-translator-api-key').value;
        const baseUrl = document.getElementById('ai-translator-base-url').value;
        const enabled = document.getElementById('ai-translator-enabled').checked;
        const debugMode = document.getElementById('ai-translator-debug').checked;
        
        GM_setValue(CONFIG.storageKeys.apiKey, apiKey);
        GM_setValue(CONFIG.storageKeys.baseUrl, baseUrl);
        GM_setValue(CONFIG.storageKeys.enabled, enabled);
        GM_setValue(CONFIG.storageKeys.debugMode, debugMode);
        
        showNotification('Settings saved successfully!', 'success');
        debugLog('Settings saved', { apiKey: apiKey ? 'Set' : 'Not set', baseUrl, enabled, debugMode });
    }
    
    async function testAPI() {
        try {
            const testText = 'Hello, world!';
            showNotification('Testing API...', 'info');
            const translation = await translateText(testText);
            showNotification(`API test successful! Translation: ${translation}`, 'success');
        } catch (error) {
            showNotification(`API test failed: ${error.message}`, 'error');
        }
    }
    
    function showSettings() {
        if (!settingsPanel) {
            settingsPanel = createSettingsPanel();
        }
        settingsPanel.style.display = 'block';
    }
    
    function showDebug() {
        if (!debugPanel) {
            debugPanel = createDebugPanel();
        }
        debugPanel.style.display = 'block';
    }
    
    function toggleControlPanel() {
        const panel = document.querySelector('.ai-translator-control');
        const buttons = panel.querySelector('.ai-translator-control-buttons');
        const toggle = document.getElementById('ai-translator-toggle-panel');
        
        if (buttons.style.display === 'none') {
            buttons.style.display = 'block';
            toggle.textContent = 'Hide';
        } else {
            buttons.style.display = 'none';
            toggle.textContent = 'Show';
        }
    }
    
    function addDebugMessage(message, data = null) {
        const messagesContainer = document.getElementById('ai-translator-debug-messages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'ai-translator-debug-message';
        messageElement.innerHTML = `
            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            <span class="message">${message}</span>
            ${data ? `<pre class="data">${JSON.stringify(data, null, 2)}</pre>` : ''}
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Main translation functions
    async function translatePage() {
        if (isTranslating) {
            showNotification('Translation in progress...', 'info');
            return;
        }
        
        const enabled = GM_getValue(CONFIG.storageKeys.enabled, CONFIG.defaults.enabled);
        if (!enabled) {
            showNotification('Translation is disabled. Enable it in settings.', 'error');
            return;
        }
        
        const apiKey = GM_getValue(CONFIG.storageKeys.apiKey);
        if (!apiKey) {
            showNotification('API Key not configured. Please set it in settings.', 'error');
            showSettings();
            return;
        }
        
        isTranslating = true;
        showNotification('Starting page translation...', 'info');
        debugLog('Starting page translation');
        
        try {
            // Find text nodes that haven't been translated yet
            const textNodes = getTranslatableTextNodes();
            debugLog('Found translatable text nodes', { count: textNodes.length });
            
            let translatedCount = 0;
            
            for (const node of textNodes) {
                const text = node.textContent.trim();
                if (text.length < 10) continue; // Skip very short text
                
                try {
                    // Check if already translated
                    if (node.parentElement && node.parentElement.classList.contains('ai-translator-translated')) {
                        continue;
                    }
                    
                    debugLog('Translating text node', { text: text.substring(0, 100) + '...' });
                    
                    const segments = segmentText(text);
                    const translations = [];
                    
                    for (const segment of segments) {
                        const translation = await translateText(segment);
                        translations.push(translation);
                        
                        // Add delay between segments to avoid rate limiting
                        if (segments.length > 1) {
                            await new Promise(resolve => setTimeout(resolve, CONFIG.translationDelay));
                        }
                    }
                    
                    const fullTranslation = translations.join(' ');
                    addTranslationToPage(node, fullTranslation);
                    translatedCount++;
                    
                } catch (error) {
                    debugLog('Translation error for node', { error: error.message, text: text.substring(0, 100) });
                    continue;
                }
            }
            
            showNotification(`Translation completed! Translated ${translatedCount} text blocks.`, 'success');
            debugLog('Page translation completed', { translatedCount });
            
        } catch (error) {
            showNotification(`Translation failed: ${error.message}`, 'error');
            debugLog('Page translation failed', { error: error.message });
        } finally {
            isTranslating = false;
        }
    }
    
    function getTranslatableTextNodes() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip empty text nodes
                    if (!node.textContent.trim()) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip script, style, and other non-visible elements
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const tagName = parent.tagName.toLowerCase();
                    if (['script', 'style', 'noscript', 'textarea', 'input', 'select', 'button'].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip if parent is our own extension elements
                    if (parent.className && typeof parent.className === 'string' && parent.className.includes('ai-translator')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip if already translated
                    if (parent.classList.contains('ai-translator-translated')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        return textNodes;
    }
    
    function addTranslationToPage(textNode, translation) {
        const parent = textNode.parentElement;
        if (!parent) return;
        
        // Mark as translated
        parent.classList.add('ai-translator-translated');
        
        // Create translation element
        const translationElement = document.createElement('div');
        translationElement.className = 'ai-translator-translation';
        translationElement.textContent = translation;
        
        // Insert after the parent element
        if (parent.nextSibling) {
            parent.parentNode.insertBefore(translationElement, parent.nextSibling);
        } else {
            parent.parentNode.appendChild(translationElement);
        }
        
        debugLog('Translation added to page', { 
            original: textNode.textContent.substring(0, 100) + '...', 
            translation: translation.substring(0, 100) + '...' 
        });
    }
    
    // Add CSS styles
    GM_addStyle(`
        .ai-translator-control {
            position: fixed;
            top: 20px;
            left: 20px;
            background: #333;
            color: white;
            border-radius: 8px;
            padding: 10px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            min-width: 150px;
        }
        
        .ai-translator-control-header {
            font-weight: bold;
            margin-bottom: 8px;
            text-align: center;
        }
        
        .ai-translator-control-buttons button {
            display: block;
            width: 100%;
            margin: 2px 0;
            padding: 6px;
            background: #555;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        }
        
        .ai-translator-control-buttons button:hover {
            background: #666;
        }
        
        .ai-translator-settings, .ai-translator-debug {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 0;
            z-index: 10001;
            font-family: Arial, sans-serif;
            font-size: 14px;
            width: 400px;
            max-height: 80vh;
            overflow: auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            display: none;
        }
        
        .ai-translator-settings-header, .ai-translator-debug-header {
            background: #f0f0f0;
            padding: 15px;
            border-bottom: 1px solid #ddd;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .ai-translator-settings-header h3, .ai-translator-debug-header h3 {
            margin: 0;
            color: #333;
        }
        
        .ai-translator-close-btn {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .ai-translator-close-btn:hover {
            color: #000;
        }
        
        .ai-translator-settings-content {
            padding: 20px;
        }
        
        .ai-translator-field {
            margin-bottom: 15px;
        }
        
        .ai-translator-field label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        
        .ai-translator-field input[type="text"], .ai-translator-field input[type="password"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        
        .ai-translator-field input[type="checkbox"] {
            margin-right: 8px;
        }
        
        .ai-translator-buttons {
            text-align: center;
            margin-top: 20px;
        }
        
        .ai-translator-buttons button {
            background: #007cba;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 5px;
            font-size: 14px;
        }
        
        .ai-translator-buttons button:hover {
            background: #005a87;
        }
        
        .ai-translator-debug-content {
            max-height: 400px;
            overflow-y: auto;
            padding: 10px;
        }
        
        .ai-translator-debug-message {
            margin-bottom: 10px;
            padding: 8px;
            background: #f9f9f9;
            border-radius: 4px;
            border-left: 3px solid #007cba;
            font-size: 12px;
        }
        
        .ai-translator-debug-message .timestamp {
            color: #666;
            font-weight: bold;
            margin-right: 8px;
        }
        
        .ai-translator-debug-message .data {
            background: #f0f0f0;
            padding: 8px;
            border-radius: 4px;
            margin-top: 5px;
            font-size: 11px;
            overflow-x: auto;
        }
        
        .ai-translator-translation {
            background: #e8f4fd;
            border: 1px solid #bee5eb;
            border-radius: 4px;
            padding: 8px;
            margin: 5px 0;
            font-style: italic;
            color: #0c5460;
            font-size: 0.95em;
        }
        
        .ai-translator-translation:before {
            content: "🌐 ";
            font-style: normal;
        }
        
        .ai-translator-translated {
            position: relative;
        }
        
        .ai-translator-notification {
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `);
    
    // Initialize
    function init() {
        debugLog('Initializing AI Translator');
        
        // Create control panel
        setTimeout(() => {
            createControlPanel();
            debugLog('AI Translator initialized');
        }, 1000);
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();