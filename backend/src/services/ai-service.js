import axios from 'axios';

const API_KEY = 'eb5e8a54aeff453dba9d501f67356eeb.dIZcHbDwfETJxqM7';
const BASE_URL = 'https://open.bigmodel.cn/api/anthropic';

/**
 * 调用 GLM AI API
 */
async function callAI({ messages, system, maxTokens = 2048, temperature = 0.7 }) {
  try {
    const response = await axios.post(BASE_URL, {
      model: 'glm-5.1',
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });
    return response.data.content[0].text;
  } catch (error) {
    console.error('AI API Error:', error.message);
    throw error;
  }
}

/**
 * 生成日报摘要
 */
export async function generateDailySummary(chats) {
  if (!chats || chats.length === 0) {
    return {
      summary: '今日暂无对话记录',
      topics: [],
      sessionCount: 0,
      messageCount: 0,
    };
  }

  const chatText = chats.map(c => `${c.role === 'user' ? '用户' : 'AI'}: ${c.content}`).join('\n');

  const prompt = `请根据以下对话记录，生成今日的摘要：

${chatText}

请用 JSON 格式返回，包含：
- summary: 今日对话的主要内容和结论（Markdown格式，100-200字）
- topics: 今日讨论的主要话题（数组，最多5个）
- sessionCount: 对话会话数（估算）
- messageCount: 消息总数

只返回 JSON，不要有其他内容。`;

  try {
    const result = await callAI({
      messages: [{ role: 'user', content: prompt }],
      system: '你是一个助手，负责总结用户每日的对话记录。',
      maxTokens: 1024,
      temperature: 0.5,
    });

    // 提取 JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Summary generation failed:', error);
  }

  return {
    summary: `今日共 ${chats.length} 条对话记录`,
    topics: [],
    sessionCount: 1,
    messageCount: chats.length,
  };
}

/**
 * 从知识内容生成 Quiz 题目
 */
export async function generateQuizzesFromKnowledge(knowledgeEntries) {
  if (!knowledgeEntries || knowledgeEntries.length === 0) return [];

  const content = knowledgeEntries.map((k, i) =>
    `[知识${i + 1}] ${k.summary || k.content.substring(0, 500)}`
  ).join('\n\n');

  const prompt = `请根据以下知识内容，生成选择题和填空题。

${content}

要求：
1. 生成 2-3 道选择题（4个选项）和 1-2 道填空题
2. 题目要基于原文内容，答案在原文中可以找到
3. 难度适中

请用 JSON 数组格式返回，每道题包含：
- question_type: "multiple_choice" 或 "fill_in_blank"
- question: 题干
- options: 选项数组（多选用）
- correct_answer: 正确答案
- explanation: 解析
- difficulty: 难度 1-3

只返回 JSON 数组。`;

  try {
    const result = await callAI({
      messages: [{ role: 'user', content: prompt }],
      system: '你是一个出题专家，根据提供的知识内容生成测验题目。',
      maxTokens: 2048,
      temperature: 0.7,
    });

    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Quiz generation failed:', error);
  }

  return [];
}

/**
 * 提取知识摘要
 */
export async function extractKnowledgeSummary(content, topic = '通用') {
  const prompt = `请从以下内容中提取3-5个关键知识点，用简洁的话总结。

${content.substring(0, 4000)}

请用 JSON 数组格式返回，每个知识点包含：
- summary: 简短摘要（50字以内）
- tags: 相关标签数组

只返回 JSON 数组。`;

  try {
    const result = await callAI({
      messages: [{ role: 'user', content: prompt }],
      system: '你是一个知识整理助手，从文档中提取关键知识点。',
      maxTokens: 512,
      temperature: 0.5,
    });

    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Knowledge extraction failed:', error);
  }

  return [{ summary: content.substring(0, 100), tags: [topic] }];
}

export { callAI };
