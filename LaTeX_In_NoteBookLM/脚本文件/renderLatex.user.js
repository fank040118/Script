// ==UserScript==
// @name         Render LaTeX in NotebookLM (Optimized)
// @namespace    http://tampermonkey.net/
// @version      2.5.0
// @description  简化优化版本：专注修复分片LaTeX，提高稳定性
// @author       ergs0204 (with optimized fragmented LaTeX fix)
// @match        https://notebooklm.google.com/*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js
// @resource     katexCSS https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css
// @license      MIT
// ==/UserScript==

/* global renderMathInElement */

(function () {
    'use strict';

    const addKaTeXStyles = () => {
        const katexLink = document.createElement('link');
        katexLink.rel = 'stylesheet';
        katexLink.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css';
        document.head.appendChild(katexLink);
    };

    const addCustomStyles = () => {
        const css = `.katex { vertical-align: -0.1em; }`;
        GM_addStyle(css);
    };

    // 简化的分片LaTeX修复：重点处理$$和$符号
    const fixFragmentedLatex = (container) => {
        const spans = Array.from(container.querySelectorAll('span.ng-star-inserted'));
        let fixedCount = 0;
        
        for (let i = 0; i < spans.length; i++) {
            const currentSpan = spans[i];
            const currentText = currentSpan.textContent.trim();
            
            // 检查是否是LaTeX开始标记（优先处理$$）
            if ((currentText === '$$' || currentText === '$') && !currentSpan.hasAttribute('data-latex-processed')) {
                const delimiter = currentText;
                let latexContent = delimiter;
                let endIndex = -1;
                let spansToMerge = [currentSpan];
                
                console.log(`[LaTeX Fix] 发现${delimiter}开始标记`);
                
                // 向后查找匹配的结束标记
                for (let j = i + 1; j < spans.length; j++) {
                    const nextSpan = spans[j];
                    const nextText = nextSpan.textContent;
                    
                    spansToMerge.push(nextSpan);
                    
                    // 检查是否找到匹配的结束标记
                    if (nextText.trim() === delimiter) {
                        latexContent += delimiter;
                        endIndex = j;
                        console.log(`[LaTeX Fix] 发现${delimiter}结束标记`);
                        break;
                    } else {
                        // 添加内容（包括空格）
                        latexContent += nextText;
                    }
                    
                    // 安全限制
                    if (j - i > 15 || latexContent.length > 500) {
                        console.log('[LaTeX Fix] 查找超限，跳过');
                        break;
                    }
                }
                
                // 如果找到了完整的LaTeX结构
                if (endIndex !== -1 && latexContent.length > delimiter.length * 2) {
                    console.log('[LaTeX Fix] 重构公式:', latexContent);
                    
                    const newSpan = document.createElement('span');
                    newSpan.textContent = latexContent;
                    newSpan.className = 'latex-reconstructed ng-star-inserted';
                    newSpan.setAttribute('data-latex-processed', 'true');
                    
                    // 替换所有相关的span
                    const parentNode = currentSpan.parentNode;
                    if (parentNode) {
                        parentNode.insertBefore(newSpan, currentSpan);
                        spansToMerge.forEach(span => {
                            if (span.parentNode === parentNode) {
                                span.remove();
                            }
                        });
                        
                        fixedCount++;
                        // 跳过已处理的spans
                        i = endIndex;
                    }
                }
            }
        }
        
        if (fixedCount > 0) {
            console.log(`[LaTeX Fix] 修复了 ${fixedCount} 个分片公式`);
        }
        return fixedCount;
    };

    const preprocessAndSanitize = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            let originalText = node.nodeValue;
            let newText = originalText;

            const displayMathRegex = /\$\$(.*?)\$\$/gs;
            let tempTextForDisplay = newText;
            let match_display;
            while ((match_display = displayMathRegex.exec(tempTextForDisplay)) !== null) {
                const content = match_display[1].trim();
                const isComplex = content.length > 25 || content.includes('\\begin') || content.includes('\\frac') || content.includes('\\sum') || content.includes('\\int') || content.includes('\\lim') || content.includes('\\\\') || content.split(' ').length > 4;
                if (!isComplex) {
                    newText = newText.replace(`$$${match_display[1]}$$`, `$${content}$`);
                }
            }

            if (newText !== originalText) {
                node.nodeValue = newText;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (['SCRIPT', 'STYLE', 'TEXTAREA', 'PRE', 'CODE'].includes(node.tagName)) {
                return;
            }
            for (const child of Array.from(node.childNodes)) {
                preprocessAndSanitize(child);
            }
        }
    };

    const ignoreClass = 'katex-ignore-active-render';
    const katexOptions = {
        delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true }
        ],
        ignoredClasses: [ignoreClass],
        throwOnError: false
    };

    let renderTimeout;
    let isRendering = false;
    
    const renderPageWithIgnore = () => {
        // 防止重复渲染
        if (isRendering) {
            return;
        }
        
        isRendering = true;
        const activeEl = document.activeElement;
        let hasIgnoreClass = false;
        
        try {
            if (activeEl && (activeEl.isContentEditable || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
                activeEl.classList.add(ignoreClass);
                hasIgnoreClass = true;
            }
            
            console.log('[LaTeX Renderer] === 开始渲染流程 ===');
            
            // 步骤1：修复分片的LaTeX
            const fixedCount = fixFragmentedLatex(document.body);
            
            // 步骤2：预处理
            preprocessAndSanitize(document.body);
            
            // 步骤3：KaTeX渲染
            renderMathInElement(document.body, katexOptions);
            
            console.log('[LaTeX Renderer] 渲染流程完成');
            
        } catch (e) {
            console.error("KaTeX render error:", e);
        } finally {
            if (hasIgnoreClass && activeEl) {
                activeEl.classList.remove(ignoreClass);
            }
            isRendering = false;
        }
    };

    const observer = new MutationObserver(() => {
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(renderPageWithIgnore, 300);
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true
    });

    window.addEventListener('load', () => {
        addKaTeXStyles();
        addCustomStyles();
        
        // 初始渲染，稍作延迟确保页面加载完成
        setTimeout(() => {
            renderPageWithIgnore();
        }, 1000);
        
        // 额外的检查，确保没有遗漏
        setTimeout(() => {
            const unrenderedLatex = document.querySelectorAll('span.latex-reconstructed:not(.katex)');
            if (unrenderedLatex.length > 0) {
                console.log(`[LaTeX] 发现 ${unrenderedLatex.length} 个未渲染的LaTeX，重新渲染`);
                renderPageWithIgnore();
            }
        }, 3000);
    });

})();
