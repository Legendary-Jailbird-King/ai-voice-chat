/**
 * MCP Document Reader Service - Pure JavaScript
 * 支持多平台文档读取 + AI 总结
 */

const https = require('https');
const http = require('http');

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
  }
};

/**
 * 读取文档
 */
async function readDocument(source) {
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
 * 读取网页文档
 */
async function readWebDoc(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { headers: { 'User-Agent': 'AI-Voice-Chat/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          resolve(readWebDoc(res.headers.location));
          return;
        }
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const text = extractTextFromHTML(data);
        resolve({
          success: true,
          platform: 'web',
          title: extractTitle(data) || 'Web Document',
          content: text.slice(0, 8000),
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
async function readYuqueDoc(yuqueUrl, query) {
  const token = DOC_PLATFORMS.yuque.auth;
  if (!token) {
    return { success: false, platform: 'yuque', title: '', content: '', url: yuqueUrl, error: 'YUQUE_TOKEN not set' };
  }

  const match = yuqueUrl.match(/yuque\.com\/([^\/]+)\/([^\/]+)\/([^\/\?]+)/);
  if (!match) {
    return { success: false, platform: 'yuque', title: '', content: '', url: yuqueUrl, error: 'Invalid Yuque URL' };
  }

  const [, namespace, , docSlug] = match;
  
  try {
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
    const title = doc.data?.title || doc.data?.name || 'Yuque Document';

    return {
      success: true,
      platform: 'yuque',
      title,
      content: `文档：${title}\n链接：${yuqueUrl}`,
      url: yuqueUrl
    };
  } catch (err) {
    return { success: false, platform: 'yuque', title: '', content: '', url: yuqueUrl, error: String(err) };
  }
}

/**
 * 读取 Notion 文档
 */
async function readNotionDoc(notionUrl, query) {
  const token = DOC_PLATFORMS.notion.auth;
  if (!token) {
    return { success: false, platform: 'notion', title: '', content: '', url: notionUrl, error: 'NOTION_TOKEN not set' };
  }

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
 * 读取 GitHub 文件
 */
async function readGitHubDoc(githubUrl, query) {
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

function extractTextFromHTML(html) {
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

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : '';
}

function detectPlatform(url) {
  if (url.includes('yuque.com')) return 'yuque';
  if (url.includes('notion.so')) return 'notion';
  if (url.includes('github.com')) return 'github';
  return 'web';
}

module.exports = { readDocument, detectPlatform };
