/**
 * 类型定义示例 V2 - 仅供参考,可删除
 */

import {
  UserProfile,
  calculateAge,
} from "./UserProfile";

// 示例 1: 完整的用户画像 (多困扰 + 自定义兴趣)
const exampleProfile: UserProfile = {
  gender: "男性",
  birthYear: 1995,
  industry: "互联网",
  jobTitle: "产品经理",
  mbti: "INTJ",
  interests: [
    { tag: "阅读", depth: "heavy" },
    { tag: "游戏", depth: "medium" },
    { tag: "投资", depth: "light" },
    { tag: "心理学", depth: "heavy" }, // 新增预设标签
    { tag: "剧本杀", depth: "medium" }, // 自定义兴趣示例
  ],
  currentTroubles: {
    troubles: [
      {
        category: "career_bottleneck",
        stressIntensity: 7,
        stressLevel: "severe",
      },
      {
        category: "self_worth",
        stressIntensity: 6,
        stressLevel: "moderate",
      },
    ],
    details: "工作上的瓶颈让我怀疑自己的能力,两者互相加强形成恶性循环",
  },
};

// 示例 2: 最小化配置 (单一困扰)
const minimalProfile: UserProfile = {
  gender: "女性",
  birthYear: 1988,
  industry: "金融",
  jobTitle: "风控专员",
  interests: [
    { tag: "冥想", depth: "medium" },
  ],
  currentTroubles: {
    troubles: [
      {
        category: "meaninglessness",
        stressIntensity: 9,
        stressLevel: "severe",
      },
    ],
  },
};

// 示例 3: 多重困扰场景
const multiTroubleProfile: UserProfile = {
  gender: "男性",
  birthYear: 1992,
  industry: "自由职业",
  jobTitle: "独立设计师",
  mbti: "INFP",
  interests: [
    { tag: "绘画", depth: "heavy" },
    { tag: "摄影", depth: "heavy" },
    { tag: "咖啡", depth: "medium" },
  ],
  currentTroubles: {
    troubles: [
      {
        category: "financial_anxiety",
        stressIntensity: 8,
        stressLevel: "severe",
      },
      {
        category: "intimate_relationship",
        stressIntensity: 5,
        stressLevel: "moderate",
      },
      {
        category: "self_worth",
        stressIntensity: 6,
        stressLevel: "moderate",
      },
    ],
    details: "收入不稳定影响了恋爱关系,伴侣的不理解又加深了我对自我价值的怀疑",
  },
};

// 示例 4: 使用工具函数
const age = calculateAge(1995); // 计算年龄: 31

console.log("示例用户画像:", exampleProfile);
console.log("当前年龄:", age);
console.log("多重困扰示例:", multiTroubleProfile);

export { exampleProfile, minimalProfile, multiTroubleProfile };
