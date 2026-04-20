/**
 * MCP Document Reader Service
 * 支持多平台文档读取 + AI 总结
 */

import https from 'https';
import http from 'http';

// 文档平台配置
const DOC_PLATFORMS = {
  yuque: {
    name: '语雀',
    baseUrl: 'https://www.yuque.com/api/v2',
    auth: process.env.YUQUE_TOKEN || ''
  },
  notion: {
    name: 'Notion',
    baseUrl: 'https://api.notion.com/v1',
    auth: process.env.NOTION_TOKEN || ''
  },
  web: {
    name: 'Web URL',
    baseUrl: '',
    auth: ''
  }
};

/**
 * 统一文档读取接口
 */
export interface DocSource {
  platform: 'yuque' | 'notion' | 'web' | 'github';
  url: string;
  query?: string; // 用户的问题，用于 AI 总结
}

export interface DocResult {
  success: boolean;
  platform: string;
  title: string;
  content: string;
  summary?: string;
  url: string;
  error?: string;
}

/**
 * 从 URL 自动检测平台并读取文档
 */
export async function readDocument(source: DocSource): Promise<DocResult> {
  const { platform, url, query } = source;

  try {
    switch (platform) {
      case 'web':
        return await readWebDoc(url);
      case 'yuque':
        return await readYuqueDoc(url, query);
      case 'notion':
        return await readNotionDoc(url, query);
      case 'github':
        return await readGitHubDoc(url, query);
      default:
        return { success: false, platform, title: '', content: '', url, error: 'Unknown platform' };
    }
  } catch (err) {
    return { success: false, platform, title: '', content: '', url, error: String(err) };
  }
}

/**
 * 读取网页文档（支持任意 URL）
 */
async function readWebDoc(url: string): Promise<DocResult> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { headers: { 'User-Agent': 'AI-Voice-Chat/1.0' } }, (res) => {
      let data = '';
      
      // 处理重定向
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location) {
          resolve(readWebDoc(location));
          return;
        }
      }
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // 提取文本内容（简化版，实际用 turndown 或类似库）
        const text = extractTextFromHTML(data);
        resolve({
          success: true,
          platform: 'web',
          title: extractTitle(data) || 'Web Document',
          content: text.slice(0, 8000), // 限制长度
          url
        });
      });
    }).on('error', (err) => {
      resolve({ success: false, platform: 'web', title: '', content: '', url, error: err.message });
    });
  });
}

/**
 * 读取语雀文档
 */
async function readYuqueDoc(yuqueUrl: string, query?: string): Promise<DocResult> {
  const token = DOC_PLATFORMS.yuque.auth;
  if (!token) {
    return { success: false, platform: 'yuque', title: '', content: '', url: yuqueUrl, error: 'YUQUE_TOKEN not set' };
  }

  // 从 URL 提取 book_id 和 doc_id
  // 格式: https://www.yuque.com/xxx/book/12345 或 https://www.yuque.com/xxx/12345
  const match = yuqueUrl.match(/yuque\.com\/([^\/]+)\/([^\/]+)\/([^\/\?]+)/);
  if (!match) {
    return { success: false, platform: 'yuque', title: '', content: '', url: yuqueUrl, error: 'Invalid Yuque URL' };
  }

  const [, namespace, , docSlug] = match;
  
  try {
    // 获取文档详情
    const docRes = await fetch(`${DOC_PLATFORMS.yuque.baseUrl}/repos/${namespace}/docs/${docSlug}`, {
      headers: {
        'X-Auth-Token': token,
        'Content-Type': 'application/json'
      }
    });

    if (!docRes.ok) {
      return { success: false, platform: 'yuque', title: '', content: '', url: yuqueUrl, error: `Yuque API error: ${docRes.status}` };
    }

    const doc = await docRes.json();
    
    // 获取文档内容
    const bodyRes = await fetch(`${DOC_PLATFORMS.yuque.baseUrl}/repos/${namespace}/docs/${docSlug}/body`, {
      headers: { 'X-Auth-Token': token }
    });
    
    let bodyContent = '';
    if (bodyRes.ok) {
      const body = await bodyRes.json();
      bodyContent = body.body || '';
    }

    return {
      success: true,
      platform: 'yuque',
      title: doc.data?.title || doc.data?.name || 'Yuque Document',
      content: bodyContent || doc.data?.description || '',
      url: yuqueUrl
    };
  } catch (err) {
    return { success: false, platform: 'yuque', title: '', content: '', url: yuqueUrl, error: String(err) };
  }
}

/**
 * 读取 Notion 文档
 */
async function readNotionDoc(notionUrl: string, query?: string): Promise<DocResult> {
  const token = DOC_PLATFORMS.notion.auth;
  if (!token) {
    return { success: false, platform: 'notion', title: '', content: '', url: notionUrl, error: 'NOTION_TOKEN not set' };
  }

  // 从 URL 提取 page ID
  const match = notionUrl.match(/notion\.so\/[^\/]+\/([a-f0-9-]+)/i);
  if (!match) {
    return { success: false, platform: 'notion', title: '', content: '', url: notionUrl, error: 'Invalid Notion URL' };
  }

  const pageId = match[1].replace(/-/g, '');

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!res.ok) {
      return { success: false, platform: 'notion', title: '', content: '', url: notionUrl, error: `Notion API error: ${res.status}` };
    }

    const page = await res.json();
    const title = page.properties?.title?.title?.[0]?.plain_text || 'Notion Page';

    return {
      success: true,
      platform: 'notion',
      title,
      content: `Notion page: ${title}\nURL: ${notionUrl}`,
      url: notionUrl
    };
  } catch (err) {
    return { success: false, platform: 'notion', title: '', content: '', url: notionUrl, error: String(err) };
  }
}

/**
 * 读取 GitHub 文件/文档
 */
async function readGitHubDoc(githubUrl: string, query?: string): Promise<DocResult> {
  // 格式: https://github.com/owner/repo/blob/branch/path/to/file
  const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/);
  if (!match) {
    return { success: false, platform: 'github', title: '', content: '', url: githubUrl, error: 'Invalid GitHub file URL' };
  }

  const [, owner, repo, branch, path] = match;
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;

  return new Promise((resolve) => {
    https.get(rawUrl, { headers: { 'User-Agent': 'AI-Voice-Chat/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode === 200,
          platform: 'github',
          title: `${owner}/${repo}/${path}`,
          content: data.slice(0, 8000),
          url: githubUrl,
          error: res.statusCode !== 200 ? `HTTP ${res.statusCode}` : undefined
        });
      });
    }).on('error', (err) => {
      resolve({ success: false, platform: 'github', title: '', content: '', url: githubUrl, error: err.message });
    });
  });
}

/**
 * 辅助函数：从 HTML 提取纯文本
 */
function extractTextFromHTML(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 辅助函数：从 HTML 提取标题
 */
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : '';
}

/**
 * 检测 URL 平台类型
 */
export function detectPlatform(url: string): 'yuque' | 'notion' | 'github' | 'web' {
  if (url.includes('yuque.com')) return 'yuque';
  if (url.includes('notion.so')) return 'notion';
  if (url.includes('github.com')) return 'github';
  return 'web';
}
