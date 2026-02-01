/**
 * 格式化用户画像工具函数
 * 用于将 V2 版本的 UserProfile 转换为适合 AI Prompt 的文本格式
 */

import { UserProfile, Interest, Trouble } from "../../types/UserProfile";

/**
 * 计算年龄
 */
function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

/**
 * 格式化兴趣列表
 */
function formatInterests(interests: Interest[]): string {
  if (interests.length === 0) return "（未填写）";

  return interests
    .map((interest) => {
      const depthLabel =
        interest.depth === "light"
          ? "轻度"
          : interest.depth === "medium"
          ? "中度"
          : "重度";
      return `${interest.tag}（${depthLabel}）`;
    })
    .join("、");
}

/**
 * 格式化单个困扰
 */
function formatTrouble(trouble: Trouble): string {
  const categoryNames: { [key: string]: string } = {
    career_bottleneck: "职业瓶颈",
    intimate_relationship: "亲密关系",
    family_origin: "原生家庭",
    self_worth: "自我价值",
    meaninglessness: "无意义感",
    financial_anxiety: "财务焦虑",
  };

  const categoryName = categoryNames[trouble.category] || trouble.category;
  const levelLabel =
    trouble.stressLevel === "mild"
      ? "轻微"
      : trouble.stressLevel === "moderate"
      ? "中度"
      : "严重";

  return `${categoryName}（${levelLabel} ${trouble.stressIntensity}/10）`;
}

/**
 * 格式化多重困扰
 */
function formatCurrentTroubles(
  troubles: Trouble[],
  details?: string
): string {
  if (troubles.length === 0) return "（未填写）";

  const troubleList = troubles.map(formatTrouble).join("、");

  if (details) {
    return `${troubleList}\n困扰关联: ${details}`;
  }

  return troubleList;
}

/**
 * 将用户画像格式化为 Prompt 文本
 */
export function formatUserProfileForPrompt(userProfile: UserProfile): string {
  const age = calculateAge(userProfile.birthYear);

  let profileText = `## 用户画像
性别: ${userProfile.gender}
年龄: ${age} 岁（${userProfile.birthYear} 年生）
行业: ${userProfile.industry}
职位: ${userProfile.jobTitle}`;

  // MBTI 可选
  if (userProfile.mbti) {
    profileText += `\nMBTI: ${userProfile.mbti}`;
  }

  // 兴趣爱好
  profileText += `\n兴趣爱好: ${formatInterests(userProfile.interests)}`;

  // 核心困扰
  profileText += `\n核心困扰: ${formatCurrentTroubles(
    userProfile.currentTroubles.troubles,
    userProfile.currentTroubles.details
  )}`;

  return profileText;
}

/**
 * 获取困扰的详细描述（用于更深度的分析）
 */
export function getTroublesDetailForAnalysis(
  userProfile: UserProfile
): string {
  const { troubles, details } = userProfile.currentTroubles;

  if (troubles.length === 0) return "用户未提供困扰信息";

  let analysis = `用户当前面临 ${troubles.length} 个困扰:\n\n`;

  troubles.forEach((trouble, index) => {
    analysis += `${index + 1}. ${formatTrouble(trouble)}\n`;
  });

  if (details) {
    analysis += `\n用户对困扰间关联的描述:\n"${details}"`;
  }

  if (troubles.length > 1) {
    analysis += `\n\n注意: 用户同时面临多个困扰，这可能意味着它们之间存在相互影响或共同根源。请在分析时考虑这些困扰的关联性。`;
  }

  return analysis;
}

/**
 * 获取兴趣深度分析（用于性格推断）
 */
export function getInterestsAnalysis(interests: Interest[]): string {
  if (interests.length === 0) return "";

  const heavyInterests = interests
    .filter((i) => i.depth === "heavy")
    .map((i) => i.tag);
  const lightInterests = interests
    .filter((i) => i.depth === "light")
    .map((i) => i.tag);

  let analysis = "";

  if (heavyInterests.length > 0) {
    analysis += `\n重度投入爱好: ${heavyInterests.join("、")}`;
  }

  if (lightInterests.length > 0) {
    analysis += `\n轻度涉猎爱好: ${lightInterests.join("、")}`;
  }

  if (heavyInterests.length > 0) {
    analysis += `\n\n提示: 用户对 ${heavyInterests.join("、")} 的深度投入可能揭示了其性格特质或心理需求。`;
  }

  return analysis;
}
