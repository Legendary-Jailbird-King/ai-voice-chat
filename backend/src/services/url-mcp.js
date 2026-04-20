import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * 通用 URL 内容读取 MCP
 * 支持任意网页 URL，自动提取正文内容
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; AI-Voice-Chat/1.0; +https://github.com/Legendary-Jailbird-King/ai-voice-chat)';

const PLATFORM_PATTERNS = {
  yuque: /yuque\.com/,
  notion: /notion\.so/,
  github: /github\.com/,
  feishu: /feishu\.cn|larksuite\.com/,
};

/**
 * 检测平台类型
 */
function detectPlatform(url) {
  for (const [name, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) return name;
  }
  return 'generic';
}

/**
 * 通用网页内容提取
 */
async function extractGenericContent(url) {
  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 15000,
      responseType: 'text',
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 移除脚本、样式、广告
    $('script, style, nav, footer, header, aside, .ad, .advertisement, .sidebar, .nav, .menu').remove();

    // 提取 meta 信息
    const title = $('meta[property="og:title"]').attr('content')
      || $('title').text()
      || $('h1').first().text()
      || '未命名页面';
    const description = $('meta[property="og:description"]').attr('content')
      || $('meta[name="description"]').attr('content')
      || '';

    // 提取正文（优先 article/main 内容区）
    let content = '';
    const articleSelectors = ['article', 'main', '[role="main"]', '.content', '.post', '.article', '.markdown-body', '.md-content'];

    for (const selector of articleSelectors) {
      const el = $(selector);
      if (el.length) {
        content = el.text();
        break;
      }
    }

    // 如果没找到，尝试 body
    if (!content) {
      content = $('body').text();
    }

    // 清理空白
    content = content.replace(/\s+/g, ' ').trim();

    return {
      title: title.trim(),
      description: description.trim(),
      content: content.substring(0, 8000), // 限制长度
      url,
      platform: 'generic',
    };
  } catch (error) {
    throw new Error(`URL 读取失败: ${error.message}`);
  }
}

/**
 * 读取 URL 内容（统一入口）
 */
export async function readUrl(url) {
  const platform = detectPlatform(url);

  switch (platform) {
    case 'yuque':
      return readYuque(url);
    case 'notion':
      return readNotion(url);
    case 'github':
      return readGitHub(url);
    default:
      return extractGenericContent(url);
  }
}

/**
 * 语雀文档
 */
async function readYuque(url) {
  // 简单实现，实际需要 token
  return extractGenericContent(url);
}

/**
 * Notion 页面
 */
async function readNotion(url) {
  // Notion 需要 token，这里做降级处理
  return {
    title: 'Notion 页面',
    description: 'Notion 页面需要登录访问',
    content: `此页面是 Notion 文档，需要授权才能读取。\n\nURL: ${url}\n\n请登录 Notion 并将页面设置为公开访问后重试。`,
    url,
    platform: 'notion',
  };
}

/**
 * GitHub 文件/文档
 */
async function readGitHub(url) {
  // 尝试解析 GitHub 文件 URL
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/i);
  if (match) {
    const [, owner, repo, branch, path] = match;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    try {
      const response = await axios.get(rawUrl, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 10000,
      });
      return {
        title: `${owner}/${repo} - ${path}`,
        description: '',
        content: response.data,
        url,
        platform: 'github',
      };
    } catch {
      // 降级到通用提取
    }
  }
  return extractGenericContent(url);
}

/**
 * MCP 工具定义
 */
export const urlMcpTools = [
  {
    name: 'read_url',
    description: '读取任意 URL 的网页内容，支持网页、GitHub 文件等。自动提取标题和正文。',
    input: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: '要读取的 URL',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'extract_knowledge',
    description: '从网页内容中提取关键知识点，返回结构化的知识条目。',
    input: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '要提取知识的内容',
        },
        topic: {
          type: 'string',
          description: '主题/领域（用于生成标签）',
        },
      },
      required: ['content'],
    },
  },
];

export default { readUrl, urlMcpTools };
