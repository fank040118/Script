# AI Translation Extension

一个基于油猴（Tampermonkey/Greasemonkey）的AI翻译扩展，支持用户自定义API密钥和接口地址。

## 功能特性

- 🔑 **自定义API配置** - 用户可以输入自己的AI API密钥和基础URL
- 📝 **智能文本分段** - 自动将长文本分割成合适的片段进行翻译
- 🎯 **非破坏性显示** - 翻译内容显示在原文下方，不会替换原有内容
- 🔧 **调试面板** - 提供详细的调试信息，方便查看扩展运行状态
- ⚡ **限流保护** - 内置延时机制，避免API调用过于频繁
- 🎨 **优雅界面** - 浮动控制面板，简洁易用

## 安装使用

### 1. 安装用户脚本

1. 首先安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [Greasemonkey](https://www.greasespot.net/) 浏览器扩展
2. 点击 `script/ai-translator.user.js` 文件
3. 复制脚本内容
4. 在Tampermonkey中创建新脚本，粘贴内容并保存

### 2. 配置API

1. 访问任意网页，会看到左上角的浮动控制面板
2. 点击 "Settings" 按钮打开设置面板
3. 输入你的AI API密钥（支持OpenAI或兼容接口）
4. 配置基础URL（默认为 `https://api.openai.com/v1`）
5. 保存设置并点击 "Test API" 测试连接

### 3. 开始翻译

1. 在任意网页上点击 "Translate Page" 开始翻译
2. 扩展会自动识别可翻译的文本内容
3. 翻译结果会显示在原文下方，带有蓝色背景标识
4. 可以通过 "Debug" 面板查看详细的翻译过程

## 配置选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| API Key | OpenAI或兼容接口的API密钥 | 无 |
| Base URL | API接口的基础地址 | `https://api.openai.com/v1` |
| Enable Translation | 是否启用翻译功能 | 启用 |
| Debug Mode | 是否开启调试模式 | 关闭 |

## 技术实现

### 文本分段算法

扩展使用智能分段算法处理长文本：
- 优先按句号、感叹号、问号等句子边界分割
- 如果单句过长，则按逗号、分号等标点符号进一步分割
- 每个分段最大长度为500字符，确保翻译质量
- 保持上下文完整性，避免语义断裂

### DOM处理

- 使用 `TreeWalker` API 遍历文本节点
- 自动跳过脚本、样式、表单元素等不需要翻译的内容
- 避免重复翻译已处理的内容
- 支持动态生成的内容

### API集成

- 兼容OpenAI ChatGPT API格式
- 支持自定义端点，可用于其他兼容服务
- 内置错误处理和重试机制
- 请求间隔控制，避免触发速率限制

## 文件结构

```
AI_Translation_Extension/
├── script/
│   └── ai-translator.user.js    # 主要的用户脚本文件
├── examples/
│   └── demo.html                # 演示页面
└── README.md                    # 说明文档
```

## 兼容性

- 支持所有主流浏览器（Chrome、Firefox、Safari、Edge）
- 兼容 Tampermonkey 和 Greasemonkey
- 支持 OpenAI API 及兼容接口
- 适用于绝大多数网站（localhost 等本地地址除外）

## 使用示例

### API配置示例

**OpenAI官方接口：**
- API Key: `sk-your-openai-api-key`
- Base URL: `https://api.openai.com/v1`

**自定义兼容接口：**
- API Key: `your-custom-api-key`
- Base URL: `https://your-custom-endpoint.com/v1`

### 调试信息

启用调试模式后，可以在调试面板中看到：
- 文本分段详情
- API请求和响应
- 翻译进度
- 错误信息

## 注意事项

1. **API费用**: 使用自己的API密钥，请注意控制使用量以避免产生意外费用
2. **网络环境**: 确保能够访问配置的API端点
3. **内容筛选**: 扩展会自动跳过不适合翻译的内容（脚本、样式等）
4. **隐私保护**: 所有配置信息都存储在本地，不会上传到第三方服务器

## 许可证

MIT License - 详见 LICENSE 文件

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个扩展！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持自定义API配置
- 智能文本分段
- 非破坏性翻译显示
- 调试面板
- 基础UI界面