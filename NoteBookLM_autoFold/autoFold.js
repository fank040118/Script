// ==UserScript==
// @name         NotebookLM Auto Fold Source Panel
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  自动折叠NotebookLM的"来源"窗口，但保留手动展开功能
// @author       Assistant
// @match        https://notebooklm.google.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('[NotebookLM Auto Fold] 脚本已启动');
    
    // 检查并折叠来源面板的函数
    function autoFoldSourcePanel() {
        // 查找来源面板
        const sourcePanel = document.querySelector('section.source-panel');
        
        if (sourcePanel) {
            console.log('[NotebookLM Auto Fold] 找到来源面板');
            
            // 检查面板是否已经被折叠
            // 通过检查面板的宽度或可见性来判断
            const computedStyle = window.getComputedStyle(sourcePanel);
            const currentWidth = computedStyle.width;
            
            // 如果面板宽度大于某个阈值，说明是展开状态，需要折叠
            if (parseFloat(currentWidth) > 100) {
                console.log('[NotebookLM Auto Fold] 面板处于展开状态，准备自动折叠');
                
                // 查找折叠按钮
                const toggleButton = sourcePanel.querySelector('button.toggle-source-panel-button');
                
                if (toggleButton) {
                    console.log('[NotebookLM Auto Fold] 找到折叠按钮，执行自动折叠');
                    
                    // 模拟点击折叠按钮
                    toggleButton.click();
                    
                    console.log('[NotebookLM Auto Fold] 自动折叠完成');
                    return true;
                } else {
                    console.log('[NotebookLM Auto Fold] 未找到折叠按钮');
                }
            } else {
                console.log('[NotebookLM Auto Fold] 面板已经是折叠状态');
                return true;
            }
        } else {
            // 减少未找到面板时的日志频率
            return false;
        }
        
        return false;
    }
    
    // 等待页面完全加载后执行
    function waitForPageLoad() {
        let isProcessed = false; // 标记是否已经处理过
        let observer = null;
        
        // 防抖函数，避免频繁执行
        let debounceTimer = null;
        function debouncedCheck() {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (!isProcessed && autoFoldSourcePanel()) {
                    isProcessed = true;
                    console.log('[NotebookLM Auto Fold] 自动折叠完成，停止监听');
                    if (observer) {
                        observer.disconnect();
                        observer = null;
                    }
                }
            }, 200);
        }
        
        // 使用MutationObserver监听DOM变化，但配置更精确
        observer = new MutationObserver((mutations) => {
            // 如果已经处理过，直接返回
            if (isProcessed) return;
            
            let shouldCheck = false;
            
            // 只检查必要的变化
            for (let mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 直接检查是否是目标元素或包含目标元素
                            if ((node.tagName === 'SECTION' && node.classList.contains('source-panel')) ||
                                (node.querySelector && node.querySelector('section.source-panel'))) {
                                shouldCheck = true;
                                break;
                            }
                        }
                    }
                    if (shouldCheck) break;
                }
            }
            
            if (shouldCheck) {
                console.log('[NotebookLM Auto Fold] 检测到来源面板，准备处理');
                debouncedCheck();
            }
        });
        
        // 更精确的监听配置，减少不必要的触发
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false, // 不监听属性变化
            characterData: false // 不监听文本变化
        });
        
        // 页面加载完成后立即尝试一次
        setTimeout(() => {
            console.log('[NotebookLM Auto Fold] 页面加载完成，执行初始检查');
            if (autoFoldSourcePanel()) {
                isProcessed = true;
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
            }
        }, 1000);
        
        // 简化的备用检查机制
        let checkCount = 0;
        const maxChecks = 5; // 减少检查次数
        
        const intervalCheck = setInterval(() => {
            if (isProcessed) {
                clearInterval(intervalCheck);
                return;
            }
            
            checkCount++;
            console.log(`[NotebookLM Auto Fold] 备用检查 ${checkCount}/${maxChecks}`);
            
            if (autoFoldSourcePanel() || checkCount >= maxChecks) {
                isProcessed = true;
                clearInterval(intervalCheck);
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
                console.log('[NotebookLM Auto Fold] 停止所有检查');
            }
        }, 3000); // 增加检查间隔
    }
    
    // 当DOM加载完成时启动脚本
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForPageLoad);
    } else {
        // DOM已经加载完成
        waitForPageLoad();
    }
    
    // 添加自定义样式，让折叠过渡更平滑
    const style = document.createElement('style');
    style.textContent = `
        /* 让来源面板的折叠动画更平滑 */
        section.source-panel {
            transition: all 0.3s ease-in-out !important;
        }
        
        /* 确保折叠按钮在所有状态下都可见和可点击 */
        .toggle-source-panel-button {
            pointer-events: auto !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log('[NotebookLM Auto Fold] 脚本初始化完成');
})();