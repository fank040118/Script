# 安装指南 / Installation Guide

## 中文安装指南

### 第一步：安装用户脚本管理器
1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
   - Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Safari: [Safari Extensions](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### 第二步：安装AI翻译脚本
1. 复制 `script/ai-translator.user.js` 文件的完整内容
2. 打开Tampermonkey扩展面板
3. 点击"创建新脚本"
4. 删除默认内容，粘贴复制的脚本代码
5. 按 `Ctrl+S` (或 `Cmd+S`) 保存脚本

### 第三步：配置API
1. 访问任意网页（非localhost地址）
2. 点击页面左上角的"AI Translator"控制面板
3. 点击"Settings"按钮
4. 输入你的AI API密钥
5. 配置API基础URL（默认为OpenAI）
6. 保存设置并测试API连接

### 第四步：开始翻译
1. 在任意网页点击"Translate Page"
2. 等待翻译完成
3. 翻译结果将显示在原文下方

---

## English Installation Guide

### Step 1: Install Userscript Manager
1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
   - Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Safari: [Safari Extensions](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### Step 2: Install AI Translation Script
1. Copy the complete content of `script/ai-translator.user.js` file
2. Open Tampermonkey extension panel
3. Click "Create a new script"
4. Delete default content and paste the copied script code
5. Press `Ctrl+S` (or `Cmd+S`) to save the script

### Step 3: Configure API
1. Visit any webpage (not localhost addresses)
2. Click the "AI Translator" control panel in the top-left corner
3. Click "Settings" button
4. Enter your AI API key
5. Configure API base URL (defaults to OpenAI)
6. Save settings and test API connection

### Step 4: Start Translating
1. Click "Translate Page" on any webpage
2. Wait for translation to complete
3. Translation results will appear below original text

## 支持的API / Supported APIs

- OpenAI ChatGPT API
- Azure OpenAI
- 其他兼容OpenAI格式的API / Other OpenAI-compatible APIs

## 注意事项 / Notes

- 确保网络能够访问配置的API端点 / Ensure network access to configured API endpoint
- API使用可能产生费用，请合理控制使用量 / API usage may incur costs, please control usage appropriately
- 脚本仅在非本地地址网站上运行 / Script only runs on non-localhost websites