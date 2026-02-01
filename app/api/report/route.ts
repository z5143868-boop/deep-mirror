import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { formatUserProfileForPrompt, getTroublesDetailForAnalysis, getInterestsAnalysis } from "../utils/formatUserProfile";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Answer {
  question: string;
  selectedOption: { id: string; text: string };
}

interface AllAnswers {
  [stage: number]: Answer[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_profile, all_answers } = body;

    if (!user_profile || !all_answers) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 构建 System Prompt
    const systemPrompt = `你是一位资深的荣格派分析师和行为经济学家。你的风格是：客观、深邃、一针见血，有同理心但不滥情。

你的任务是基于用户在三个阶段的全部回答，生成一份深度心理分析报告。

这份报告不是为了安慰用户，而是为了让用户看清自己的真实面目——包括那些被隐藏的矛盾、风险和可能性。

报告必须包含以下四个板块，以 JSON 格式返回：

1. **core_identity**（核心画像定义）：
   - 用一个隐喻性的标题概括这个人（如"风暴中的独行船长"、"困在笼子里的猎豹"）
   - 100-150 字的画像描述，要有文学性但不失锋利

2. **inner_conflict**（内在死结）：
   - 揭示用户回答中最核心的逻辑矛盾或自我冲突
   - 150-200 字，要让用户感到"被看穿了"
   - 例如："你既渴望自由，又害怕失去控制；既想证明自己，又不敢承担失败"

3. **risk_prediction**（行为预测）：
   - 基于用户的防御机制和压力反应，预测高压下的风险点
   - 150-200 字，要具体、可怕、真实
   - 例如："当市场崩盘时，你可能会..."

4. **evolution_path**（进化建议）：
   - 提供 2-3 条可执行的减害或提升策略
   - 每条 50-80 字，要实用、不鸡汤
   - 不要说"多锻炼"、"保持乐观"这类空话

风格要求：
- 像一面镜子，不加滤镜地反射真相
- 可以温柔，但必须锋利
- 不要用"你很棒"、"继续加油"等空洞鼓励
- 要让用户有"被看穿"的震撼感`;

    // 构建 User Prompt
    const userPrompt = buildReportPrompt(user_profile, all_answers);

    // 调用 Claude API
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
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

    // 解析 JSON
    let responseText = content.text.trim();
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      responseText = jsonMatch[1];
    }

    const reportData = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      report: reportData,
    });
  } catch (error) {
    console.error("Report API Error:", error);
    return NextResponse.json(
      { error: "生成报告失败，请稍后重试" },
      { status: 500 }
    );
  }
}

function buildReportPrompt(userProfile: any, allAnswers: AllAnswers): string {
  // 使用工具函数格式化用户画像
  let prompt = formatUserProfileForPrompt(userProfile);

  // 添加兴趣和困扰的深度分析
  prompt += getInterestsAnalysis(userProfile.interests);
  prompt += `\n\n${getTroublesDetailForAnalysis(userProfile)}`;

  prompt += `

---

## 三阶段测试回答

### Stage 1: 表层行为（应激反应测试）
`;

  if (allAnswers[1]) {
    allAnswers[1].forEach((answer, index) => {
      prompt += `
**第 ${index + 1} 题**
问题：${answer.question}
选择：${answer.selectedOption.id}. ${answer.selectedOption.text}
`;
    });
  }

  prompt += `
### Stage 2: 深层动力（动机挖掘）
`;

  if (allAnswers[2]) {
    allAnswers[2].forEach((answer, index) => {
      prompt += `
**第 ${index + 1} 题**
问题：${answer.question}
选择：${answer.selectedOption.id}. ${answer.selectedOption.text}
`;
    });
  }

  prompt += `
### Stage 3: 阴影与防御（压力测试）
`;

  if (allAnswers[3]) {
    allAnswers[3].forEach((answer, index) => {
      prompt += `
**第 ${index + 1} 题**
问题：${answer.question}
选择：${answer.selectedOption.id}. ${answer.selectedOption.text}
`;
    });
  }

  prompt += `

---

## 任务要求

请基于以上所有信息，生成一份深度心理分析报告。

**重要思维链（内部推理，不输出给用户）：**
1. 归类行为：用户在三个阶段展现的行为模式是什么？
2. 侦测矛盾：用户的回答之间有哪些内在冲突？
3. 构建模型：这个人的核心驱动力是什么？恐惧还是欲望？
4. 预测风险：在极端情况下，这个人会做出什么非理性行为？

**输出格式（纯 JSON）：**
\`\`\`json
{
  "core_identity": {
    "title": "隐喻性的画像标题（如：风暴中的独行船长）",
    "description": "100-150字的画像描述，要有文学性但不失锋利"
  },
  "inner_conflict": {
    "title": "核心冲突的简短标题（如：自由与控制的囚徒困境）",
    "description": "150-200字，揭示最核心的逻辑矛盾"
  },
  "risk_prediction": {
    "title": "风险预警标题（如：崩溃边缘的三个信号）",
    "description": "150-200字，预测高压下的风险点"
  },
  "evolution_path": {
    "title": "进化路径",
    "suggestions": [
      {
        "label": "策略1的简短标题",
        "description": "50-80字的具体可执行建议"
      },
      {
        "label": "策略2的简短标题",
        "description": "50-80字的具体可执行建议"
      },
      {
        "label": "策略3的简短标题",
        "description": "50-80字的具体可执行建议"
      }
    ]
  }
}
\`\`\`

记住：这是一面镜子，不是一碗鸡汤。要让用户有"被看穿"的震撼感。`;

  return prompt;
}
