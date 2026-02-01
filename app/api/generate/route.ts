import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { formatUserProfileForPrompt, getTroublesDetailForAnalysis, getInterestsAnalysis } from "../utils/formatUserProfile";

// 🔑 Vercel 超时配置 (关键：解决 Hobby 计划的 10 秒超时限制)
export const maxDuration = 60; // 允许最长执行 60 秒 (Hobby 计划的上限)
export const dynamic = 'force-dynamic'; // 强制动态渲染

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 🔧 强健的 JSON 清洗函数 (Sanitization)
 * 解决 AI 返回 Markdown 代码块或格式问题导致的解析错误
 */
function cleanJson(text: string): string {
  // 1. 移除 Markdown 代码块标记
  let clean = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

  // 2. 提取纯 JSON 部分（找到第一个 { 和最后一个 }）
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  // 3. 尝试修复常见的换行符问题（替换未转义的实际换行符为 \n）
  // 注意：这个步骤比较复杂，只处理明显的错误情况
  // 例如：字符串值内的真实换行符应该被转义
  try {
    // 先尝试直接解析，如果成功就不需要修复
    JSON.parse(clean);
    return clean;
  } catch {
    // 如果解析失败，尝试修复常见问题
    // 替换字符串值内的实际换行符为 \n（简单策略）
    // 这个正则会匹配 "text" 内的真实换行符
    clean = clean.replace(/("(?:[^"\\]|\\.)*?")/g, (match) => {
      return match.replace(/\r?\n/g, '\\n').replace(/\t/g, '\\t');
    });
  }

  return clean;
}

// Stage 定义
const STAGE_CONFIGS = {
  1: {
    name: "表层行为 (The Surface)",
    description: "应激反应测试 - 询问具体高频场景下的本能动作",
    questionCount: 3,
  },
  2: {
    name: "深层动力 (The Drive)",
    description: "动机挖掘 - 基于 Stage 1 的行为，追问背后的价值观",
    questionCount: 3,
  },
  3: {
    name: "阴影与防御 (The Shadow)",
    description: "压力测试 & 矛盾侦测 - 设置极端环境，逼出防御机制",
    questionCount: 2,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_profile,
      current_stage,
      previous_answers,
      is_regenerate,
      regenerate_reason,
      custom_feedback,
      previous_question,
    } = body;

    // 调试日志
    console.log("=== Generate API Debug ===");
    console.log("Received body keys:", Object.keys(body));
    console.log("user_profile:", user_profile ? "exists" : "missing");
    console.log("current_stage:", current_stage);
    console.log("is_regenerate:", is_regenerate);
    console.log("regenerate_reason:", regenerate_reason);
    console.log("custom_feedback:", custom_feedback);

    // 验证参数
    if (!user_profile || !current_stage) {
      console.error("Validation failed:", { user_profile: !!user_profile, current_stage });
      return NextResponse.json(
        { error: "缺少必要参数 user_profile 或 current_stage" },
        { status: 400 }
      );
    }

    // 🔧 修复：自动清理旧版本的小数 stage 值（1.5 -> 1, 2.5 -> 2, 3.5 -> 3）
    const cleanedStage = Math.floor(current_stage);
    console.log("Stage value:", { original: current_stage, cleaned: cleanedStage });

    const stageConfig = STAGE_CONFIGS[cleanedStage as keyof typeof STAGE_CONFIGS];
    if (!stageConfig) {
      return NextResponse.json(
        { error: `无效的 stage 参数: ${current_stage} (cleaned: ${cleanedStage})` },
        { status: 400 }
      );
    }

    // 使用清理后的 stage 值
    const finalStage = cleanedStage;

    // 构建 System Prompt（AI 人设）
    const systemPrompt = `你是一位资深的荣格派分析师和行为经济学家。你的风格是：客观、深邃、一针见血，有同理心但不滥情。

你的任务是为用户生成深度心理测试题目。这是一个四阶段递进的测试系统：
- Stage 1: 表层行为测试（应激反应）
- Stage 2: 深层动力测试（动机挖掘）
- Stage 3: 阴影与防御测试（压力测试）

🔴 **CRITICAL: JSON 格式要求（Mandatory）**
- Return RAW JSON only. Do NOT wrap in Markdown code blocks (no \`\`\`json).
- Do NOT output actual newlines inside string values; use '\\n' instead.
- Ensure all strings are properly escaped (quotes, backslashes, newlines).
- The response must be parseable by JSON.parse() without any preprocessing.

重要原则：
1. 严禁使用抽象问题（如"你焦虑吗？"）
2. 必须构建具体的、场景化的情境（Scenario-based）
3. 必须包含投射性选项（Projective Options）
4. 每个选项都应该揭示不同的心理特征
5. 题目必须符合用户的真实生活场景和身份背景
6. 🔑 **CRITICAL FORMATTING INSTRUCTION - 强制分段结构（Mandatory for Mobile Readability）**：

   **严禁输出一大段不分行的文字墙。**

   You MUST structure the scenario text into **2-3 distinct paragraphs**, separated by double newlines (\n\n):

   * **Paragraph 1 (背景设置):** Set the scene/context based on user's job, hobby, or life situation. Establish the baseline environment.
     - Length: 40-60 characters
     - Example: "你刚入职一家新公司，作为产品经理负责一个重要项目。"

   * **Paragraph 2 (冲突引入):** Introduce the specific conflict, dilemma, or psychological tension related to their 'trouble' or psychological pattern.
     - Length: 50-80 characters
     - Example: "今天下午，老板突然把你叫进办公室，要求你在明天之前完成一个本需要一周的任务。团队其他人都已经下班了。"

   * **(Optional) Paragraph 3 (压力点/内在反应):** A brief internal reflection, sensory detail, or time marker that heightens the tension immediately before presenting the choices.
     - Length: 30-50 characters
     - Example: "现在是晚上 11 点，你面对电脑，手指悬停在键盘上。"

   **格式验证规则：**
   - ❌ WRONG: "你刚入职一家新公司，作为产品经理负责一个重要项目。今天下午，老板突然..." (单段堆砌)
   - ✅ CORRECT: "你刚入职一家新公司...\n\n今天下午，老板突然..." (明确分段)

   **强制执行：** 任何超过 80 字的场景描述，必须分段。段落之间必须使用 \n\n 分隔。

## 🔴 CRITICAL: 排他性约束处理（Exclusion Logic）

当用户在自定义反馈中使用以下表述时，这不是偏好，而是**绝对的负面约束**：

**排他性关键词识别：**
- "我只是..." / "我只..." / "Only" → 表示严格限制范围
- "我不..." / "我从不..." / "Never" → 表示绝对禁止
- "我不懂..." / "我不会..." → 表示能力边界，禁止生成超出范围的场景

**案例教学（必须严格遵守）：**

❌ 错误示例：
- 用户说"我只打 Dota"
- AI 生成："你在团队副本中遇到一个不配合的队友..."
- **错误原因：** Dota 是 MOBA 游戏，没有"副本"概念，这是 MMORPG 的术语

✅ 正确示例：
- 用户说"我只打 Dota"
- AI 生成："排位赛中，你选了一个核心位，但队友四选四，没人买眼..."
- **正确原因：** 严格限制在 Dota 的对线、排位、团战等真实场景中

**强制执行规则：**
1. 当用户使用"只"字时，将其理解为**唯一性约束**，禁止生成任何超出范围的场景
2. 当用户使用"不"字时，将其理解为**禁止性约束**，绝对不能触碰相关领域
3. 不要试图"扩展"或"通用化"用户的描述，必须精确匹配用户的自我定义

## 🎯 反同质化机制（Anti-Homogenization）

**强制多样性规则：**
1. **冲突类型多样性** - 连续两道题不能是同类型的压力/冲突
   - 类型分类：时间压力、人际冲突、自我怀疑、道德两难、资源竞争、身份认同
   - 如果上一题是"时间管理危机"，下一题必须换成"人际信任危机"或"自我价值怀疑"

2. **场景领域切换** - 避免连续在同一生活领域出题
   - 领域分类：工作职场、亲密关系、家庭原生、兴趣爱好、社交网络、个人成长
   - 如果上一题在"职场"，下一题优先选择"私人生活"或"兴趣圈"

3. **情绪基调轮换** - 避免连续使用同一种情绪基调
   - 基调分类：焦虑紧张型、失落沮丧型、愤怒对抗型、迷茫困惑型、兴奋期待型
   - 连续两题的情绪基调必须不同

**实施方法：**
- 在生成新题前，分析前一题的【冲突类型】【场景领域】【情绪基调】
- 强制选择与前一题不同的组合
- 保证测试的立体性和全面性`;

    // 构建 User Prompt
    const userPrompt = buildUserPrompt(
      user_profile,
      finalStage,
      stageConfig,
      previous_answers,
      is_regenerate,
      regenerate_reason,
      custom_feedback,
      previous_question
    );

    // 调用 Claude API
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      temperature: 0.8,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // 解析 AI 返回的内容
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }

    const rawText = content.text.trim();

    // 🔧 使用强健的 JSON 清洗逻辑
    let questionData;
    try {
      const cleanedText = cleanJson(rawText);
      questionData = JSON.parse(cleanedText);
    } catch (parseError) {
      // 详细记录解析错误，方便调试
      console.error("❌ JSON Parse Error:", parseError);
      console.error("📄 Raw AI Response:", rawText);
      console.error("🧹 Cleaned Text:", cleanJson(rawText));

      throw new Error(
        `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }

    // 验证返回的数据结构
    if (!questionData.question || !questionData.options) {
      console.error("⚠️ Invalid question data structure:", questionData);
      throw new Error("AI response missing required fields (question, options)");
    }

    return NextResponse.json({
      success: true,
      data: questionData,
      stage: finalStage,
    });
  } catch (error) {
    console.error("Generate API Error:", error);

    // 🔑 优化错误返回：提供具体的错误信息而不是模糊的 "Unknown Error"
    const errorMessage = error instanceof Error ? error.message : "生成题目失败，请稍后重试";
    const errorDetails = error instanceof Error ? error.stack : String(error);

    // 记录详细的错误信息到服务器日志
    console.error("Detailed error stack:", errorDetails);

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}

// 构建针对不同 Stage 的 User Prompt
function buildUserPrompt(
  userProfile: any,
  stage: number,
  stageConfig: any,
  previousAnswers?: any,
  isRegenerate?: boolean,
  regenerateReason?: string,
  customFeedback?: string,
  previousQuestion?: any
): string {
  // 使用工具函数格式化用户画像
  let prompt = formatUserProfileForPrompt(userProfile);

  // 添加兴趣和困扰的深度分析
  prompt += getInterestsAnalysis(userProfile.interests);
  prompt += `\n\n${getTroublesDetailForAnalysis(userProfile)}\n\n`;
  prompt += "---\n\n";

  // 如果是重新生成，添加反馈处理逻辑
  if (isRegenerate && previousQuestion) {
    prompt += buildRegenerateInstructions(
      regenerateReason,
      customFeedback,
      previousQuestion,
      userProfile
    );
  }

  if (stage === 1) {
    // 反同质化：分析上一题的特征
    let antiHomogenizationHint = "";
    if (previousAnswers && previousAnswers[1] && previousAnswers[1].length > 0) {
      const lastAnswer = previousAnswers[1][previousAnswers[1].length - 1];
      if (lastAnswer && lastAnswer.question) {
        antiHomogenizationHint = `\n\n## 🎯 反同质化要求（Anti-Homogenization）\n\n`;
        antiHomogenizationHint += `**上一道题目：**\n"${lastAnswer.question}"\n\n`;
        antiHomogenizationHint += `**强制多样性规则：**\n`;
        antiHomogenizationHint += `1. 新题目必须切换到**不同的冲突类型**（时间压力、人际冲突、自我怀疑、道德两难、资源竞争、身份认同中选一个与上题不同的）\n`;
        antiHomogenizationHint += `2. 新题目必须切换到**不同的生活领域**（如果上题是职场，这题必须是私人生活、兴趣爱好或其他领域）\n`;
        antiHomogenizationHint += `3. 新题目必须使用**不同的情绪基调**（焦虑、失落、愤怒、迷茫、兴奋等，不能与上题重复）\n`;
        antiHomogenizationHint += `4. **严禁**生成与上一题相似的场景或问法\n\n`;
      }
    }

    prompt += `## 任务要求
现在是 ${stageConfig.name} 阶段。
请为这位用户生成 1 道具体的、场景化的测试题。

题目要求：
- 必须是这位用户在日常生活中会真实遇到的高频场景
- 询问他们在这个场景下的**本能反应**或**第一时间的行为**
- 场景要具体、生动、有画面感
- 避免抽象的心理描述
- 🔑 **强制分段 (CRITICAL)**：
  * 场景描述必须分为 2-3 段，使用 \\n\\n 分隔
  * 第 1 段：背景设置（40-60 字）
  * 第 2 段：冲突引入（50-80 字）
  * 第 3 段（可选）：压力点/时间标记（30-50 字）
  * 严禁单段堆砌超过 80 字

选项要求：
- 提供 3 个选项（A、B、C）
- 每个选项代表不同的应激反应模式
- 选项要具体，是可观察的行为或决策，不是情绪描述
- 如果选项描述超过 30 字，建议分段以提升可读性
${antiHomogenizationHint}
返回格式（必须是纯 JSON）：
\`\`\`json
{
  "question": "具体的情境描述和问题",
  "options": [
    { "id": "A", "text": "选项A的具体行为" },
    { "id": "B", "text": "选项B的具体行为" },
    { "id": "C", "text": "选项C的具体行为" }
  ]
}
\`\`\``;
  } else if (stage === 2) {
    // 反同质化：分析上一题的特征
    let antiHomogenizationHint = "";
    if (previousAnswers && previousAnswers[2] && previousAnswers[2].length > 0) {
      const lastAnswer = previousAnswers[2][previousAnswers[2].length - 1];
      if (lastAnswer && lastAnswer.question) {
        antiHomogenizationHint = `\n\n## 🎯 反同质化要求\n\n`;
        antiHomogenizationHint += `**上一道题目：**\n"${lastAnswer.question}"\n\n`;
        antiHomogenizationHint += `**多样性要求：** 新题必须探测不同的价值维度，避免重复上一题的价值对立类型。\n\n`;
      }
    }

    prompt += `## 任务要求
现在是 ${stageConfig.name} 阶段。

用户在 Stage 1 的回答：
${previousAnswers ? JSON.stringify(previousAnswers, null, 2) : "（暂无）"}

请基于用户的画像和之前的回答，生成 1 道深层动机挖掘题。

题目要求：
- 追问用户行为背后的**价值观**和**核心驱动力**
- 设置一个需要在不同价值之间做选择的情境
- 揭示用户是被"恐惧"驱动还是被"欲望"驱动
- 🔑 **强制分段 (CRITICAL)**：
  * 场景描述必须分为 2-3 段，使用 \\n\\n 分隔
  * 严格遵循：背景 → 冲突 → 压力点的结构
  * 严禁单段堆砌

选项要求：
- 提供 3 个选项
- 每个选项代表不同的价值取向或内在需求
- 例如：控制感 vs 安全感、尊严 vs 金钱、自由 vs 稳定
${antiHomogenizationHint}
返回格式（必须是纯 JSON）：
\`\`\`json
{
  "question": "价值选择的具体情境",
  "options": [
    { "id": "A", "text": "代表某种价值观的选择" },
    { "id": "B", "text": "代表另一种价值观的选择" },
    { "id": "C", "text": "代表第三种价值观的选择" }
  ]
}
\`\`\``;
  } else if (stage === 3) {
    // 反同质化：分析上一题的特征
    let antiHomogenizationHint = "";
    if (previousAnswers && previousAnswers[3] && previousAnswers[3].length > 0) {
      const lastAnswer = previousAnswers[3][previousAnswers[3].length - 1];
      if (lastAnswer && lastAnswer.question) {
        antiHomogenizationHint = `\n\n## 🎯 反同质化要求\n\n`;
        antiHomogenizationHint += `**上一道题目：**\n"${lastAnswer.question}"\n\n`;
        antiHomogenizationHint += `**多样性要求：** 新题必须设置不同类型的极端困境，避免与上题的压力源重复。\n\n`;
      }
    }

    prompt += `## 任务要求
现在是 ${stageConfig.name} 阶段。

用户之前的回答：
${previousAnswers ? JSON.stringify(previousAnswers, null, 2) : "（暂无）"}

请生成 1 道高压/两难选择题，用于压力测试和防御机制侦测。

题目要求：
- 设置一个**极端的、痛苦的**两难困境
- 逼迫用户在两个都不想要的选项中做选择
- 揭示用户在崩溃边缘的防御机制和底线
- 🔑 **强制分段 (CRITICAL)**：
  * 场景描述必须分为 2-3 段，使用 \\n\\n 分隔
  * 严格遵循：背景 → 冲突 → 压力点的结构
  * 严禁单段堆砌

选项要求：
- 提供 3 个选项
- 选项都应该是艰难的、有代价的
- 揭示用户会优先保护什么、会牺牲什么
${antiHomogenizationHint}
返回格式（必须是纯 JSON）：
\`\`\`json
{
  "question": "极端困境的具体描述",
  "options": [
    { "id": "A", "text": "痛苦选择A" },
    { "id": "B", "text": "痛苦选择B" },
    { "id": "C", "text": "痛苦选择C" }
  ]
}
\`\`\``;
  }

  return prompt;
}

// 构建重新生成的指令
function buildRegenerateInstructions(
  reason?: string,
  customFeedback?: string,
  previousQuestion?: any,
  userProfile?: any
): string {
  let instructions = `\n\n## ⚠️ 重要：用户要求重新生成题目\n\n`;

  instructions += `**上一道题目：**\n"${previousQuestion?.question}"\n\n`;

  instructions += `**用户反馈原因：**\n`;

  // 根据不同的原因类型，添加对应的策略指令
  switch (reason) {
    case "scenario_mismatch":
      instructions += `- 场景不符合用户的实际情况\n\n`;
      instructions += `**强制指令：**\n`;
      instructions += `1. 丢弃上一道题目的场景设定\n`;
      instructions += `2. 从用户的画像中找到一个**完全不同的生活/工作侧面**来构建场景\n`;
      instructions += `3. 场景必须是用户**真实会遇到的**，不要臆测或理想化\n`;
      instructions += `4. 如果用户的行业是"${userProfile?.industry}"，确保场景真实反映该行业的日常\n`;
      break;

    case "too_generic":
      instructions += `- 问题太笼统/像套用模板\n\n`;
      instructions += `**强制指令：**\n`;
      instructions += `1. 提高颗粒度，聚焦到一个**具体的微观瞬间**\n`;
      instructions += `2. 加入感官细节（视觉、听觉、触觉）或行业黑话\n`;
      instructions += `3. 如果用户有重度爱好（如"${userProfile?.interests?.find((i: any) => i.depth === 'heavy')?.tag || '深度兴趣'}"），将其融入场景中\n`;
      instructions += `4. 避免"你会怎么办"这类宽泛问法，改为"此时你的第一反应是..."\n`;
      break;

    case "different_angle":
      instructions += `- 用户想换一个完全不同的角度\n\n`;
      instructions += `**强制指令：**\n`;
      instructions += `1. 从用户画像中选择一个**尚未涉及的领域**（如：兴趣爱好、困扰话题、人际关系）\n`;
      instructions += `2. 如果上一题是工作场景，这次改为私人生活场景；反之亦然\n`;
      instructions += `3. 创意优先：可以使用隐喻、反常识的情境\n`;
      instructions += `4. 但仍要保持心理测试的深度，不要为了"不同"而失去测试价值\n`;
      break;

    default:
      instructions += `- 用户要求换题\n\n`;
  }

  // 如果有自定义反馈，这是最高优先级
  if (customFeedback && customFeedback.trim()) {
    instructions += `\n\n## 🔴 CRITICAL: 用户的具体纠正信息（最高优先级）\n\n`;
    instructions += `用户明确表示：\n`;
    instructions += `"${customFeedback}"\n\n`;
    instructions += `**绝对强制指令：**\n`;
    instructions += `1. 你**必须严格遵守**用户的这条反馈，这是最高优先级\n`;
    instructions += `2. 如果用户说"我不会XX"，则**绝对禁止**生成涉及XX的场景\n`;
    instructions += `3. 如果用户说"我更关心YY"，则**必须**围绕YY来构建场景\n`;
    instructions += `4. 如果用户指出了具体的生活细节，**必须**将其纳入场景设定中\n`;
    instructions += `5. 不要试图"教育"或"纠正"用户，尊重用户的自我认知\n\n`;

    // 智能解析 custom_feedback 中的关键信息
    const feedback = customFeedback.toLowerCase();
    const feedbackOriginal = customFeedback;

    // 检测排他性约束（"只"字）
    if (feedback.includes("只是") || feedback.includes("只") || feedback.includes("仅") || feedback.match(/only|just/i)) {
      instructions += `## ⚠️ 检测到排他性约束（Exclusion Constraint）\n\n`;
      instructions += `用户使用了"只"/"仅"等限定词，这意味着：\n`;
      instructions += `- 这不是"偏好"，而是**唯一性约束**\n`;
      instructions += `- 你必须将场景**严格限制**在用户明确提到的范围内\n`;
      instructions += `- **禁止**做任何形式的"通用化"或"扩展理解"\n\n`;
      instructions += `**案例参考：**\n`;
      instructions += `- 如果用户说"我只打 Dota"，则场景必须是 Dota 的对线/团战/排位，不能是 LOL、王者荣耀或任何其他游戏\n`;
      instructions += `- 如果用户说"我只是学生"，则场景必须是校园/课堂/作业，不能是职场或创业\n`;
      instructions += `- 如果用户说"我只做前端"，则场景必须是 UI/交互/组件，不能是后端 API 或数据库\n\n`;
      instructions += `**你的任务：** 从用户的反馈中提取精确的范围限定，然后100%遵守。\n\n`;
    }

    // 检测禁止性约束（"不"字）
    if (feedback.includes("不会") || feedback.includes("不懂") || feedback.includes("不是") || feedback.includes("从不") || feedback.match(/not|never|don't/i)) {
      instructions += `## 🚫 检测到禁止性约束（Negative Constraint）\n\n`;
      instructions += `用户明确表示他们**不具备**某些能力或**不属于**某些身份：\n`;
      instructions += `- 这些领域是**绝对禁区**，生成场景时必须100%避开\n`;
      instructions += `- 不要假设用户"可能懂一点"或"应该了解"，必须尊重用户的自我定义\n\n`;
      instructions += `**你的任务：** 识别用户排除的领域，然后在生成场景时完全避开。\n\n`;
    }

    // 检测关注点转移（"更"字）
    if (feedback.includes("更关心") || feedback.includes("更在意") || feedback.includes("其实") || feedback.includes("实际上") || feedback.match(/actually|more/i)) {
      instructions += `## 💡 检测到关注点纠正（Priority Shift）\n\n`;
      instructions += `用户透露了他们真实的关注点，这可能与画像中的职业/爱好不一致：\n`;
      instructions += `- 用户的自我陈述 > 画像中的推断\n`;
      instructions += `- 必须围绕用户真实关心的点来构建场景\n`;
      instructions += `- 这是用户主动纠正认知偏差，必须优先采纳\n\n`;
      instructions += `**你的任务：** 提取用户真正关心的主题，并将其作为场景核心。\n\n`;
    }

    // 提取关键词并强调
    instructions += `**用户反馈的关键信息：**\n`;
    instructions += `"${feedbackOriginal}"\n\n`;
    instructions += `请逐字分析这段反馈，提取所有约束条件，并在生成新题时严格执行。\n\n`;
  }

  instructions += `\n---\n\n`;
  instructions += `**最终提醒：** 这是用户主动反馈后的二次生成，必须体现出明显的调整。不要生成与上一题相似的场景或问法。\n\n`;

  return instructions;
}
