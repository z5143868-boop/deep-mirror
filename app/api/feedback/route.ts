import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { formatUserProfileForPrompt, getTroublesDetailForAnalysis } from "../utils/formatUserProfile";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Stage 配置
const STAGE_NAMES = {
  1: "表层行为 (The Surface)",
  2: "深层动力 (The Drive)",
  3: "阴影与防御 (The Shadow)",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_profile, stage, answers } = body;

    if (!user_profile || !stage || !answers) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 构建 System Prompt
    const systemPrompt = `你是一位资深的荣格派分析师和行为经济学家。你的风格是：客观、深邃、一针见血，有同理心但不滥情。

你的任务是对用户在某个 Stage 的回答给出即时反馈。

反馈结构（150-200字）：
1. 肯定：以"我看到了你..."开头，描述你观察到的行为模式
2. 洞察：以"这说明..."展开，揭示背后的心理机制或驱动力
3. 诱导（Hook）：以"但..."或"然而..."转折，抛出一个更深的问题，引导进入下一阶段

风格要求：
- 不要使用"你很棒"、"做得好"等空洞的鼓励
- 要像镜子一样客观反射用户的内心
- 可以温柔，但必须锋利
- 用具体的观察代替抽象的评价`;

    // 构建 User Prompt
    const userPrompt = buildFeedbackPrompt(user_profile, stage, answers);

    // 调用 Claude API
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    return NextResponse.json({
      success: true,
      feedback: content.text.trim(),
      stage,
    });
  } catch (error) {
    console.error("Feedback API Error:", error);
    return NextResponse.json(
      { error: "生成反馈失败，请稍后重试" },
      { status: 500 }
    );
  }
}

function buildFeedbackPrompt(
  userProfile: any,
  stage: number,
  answers: any[]
): string {
  const stageName = STAGE_NAMES[stage as keyof typeof STAGE_NAMES];

  // 使用工具函数格式化用户画像
  let prompt = formatUserProfileForPrompt(userProfile);
  prompt += `\n\n${getTroublesDetailForAnalysis(userProfile)}\n\n`;
  prompt += "---\n\n";
  prompt += `## ${stageName} 阶段回答\n\n`;

  answers.forEach((answer, index) => {
    prompt += `第 ${index + 1} 题：
问题：${answer.question}
用户选择：${answer.selectedOption.id}. ${answer.selectedOption.text}

`;
  });

  prompt += `## 任务要求

请基于以上信息，给出一段 150-200 字的即时反馈。

反馈结构：
1. **肯定**（我看到了你...）- 描述观察到的行为模式
2. **洞察**（这说明...）- 揭示背后的心理机制
3. **诱导（Hook）**（但...）- 抛出更深的问题，引导进入下一阶段

直接输出反馈文本，不需要 JSON 格式，不需要标题。`;

  return prompt;
}
