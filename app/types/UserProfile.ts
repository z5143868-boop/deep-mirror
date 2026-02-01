/**
 * MBTI 16型人格枚举
 */
export type MBTIType =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

/**
 * 兴趣深度等级
 */
export type InterestDepth = "light" | "medium" | "heavy";

/**
 * 兴趣标签接口
 */
export interface Interest {
  tag: string;
  depth: InterestDepth;
}

/**
 * 困扰话题类型
 */
export type TroubleCategory =
  | "career_bottleneck"      // 职业瓶颈
  | "intimate_relationship"  // 亲密关系
  | "family_origin"          // 原生家庭
  | "self_worth"             // 自我价值
  | "meaninglessness"        // 无意义感
  | "financial_anxiety";     // 财务焦虑

/**
 * 压力程度等级
 */
export type StressLevel = "mild" | "moderate" | "severe";

/**
 * 单个困扰接口
 */
export interface Trouble {
  category: TroubleCategory;
  stressLevel: StressLevel;
  stressIntensity: number; // 1-10
}

/**
 * 多重困扰接口
 */
export interface CurrentTroubles {
  troubles: Trouble[]; // 多个困扰
  details?: string; // 可选的补充说明（描述困扰间的关联）
}

/**
 * 用户画像接口 - 重构版 V2
 */
export interface UserProfile {
  // 基础画像
  gender: string;
  birthYear: number; // 出生年份,后台计算年龄
  industry: string; // 行业
  jobTitle: string; // 职位
  mbti?: MBTIType; // 可选的 MBTI

  // 兴趣爱好 (多选 + 深度 + 自定义)
  interests: Interest[];

  // 核心困扰 (支持多选)
  currentTroubles: CurrentTroubles;
}

/**
 * 预设的兴趣标签 - 扩充版
 */
export const PRESET_INTEREST_TAGS = [
  // 文化艺术
  "阅读", "写作", "绘画", "摄影", "音乐", "电影",
  // 运动健康
  "健身", "瑜伽", "跑步", "户外", "极限运动", "冥想",
  // 科技数码
  "编程", "游戏", "数码", "AI研究",
  // 投资理财
  "投资", "炒股", "加密货币", "理财",
  // 社交娱乐
  "社交", "派对", "桌游", "密室逃脱",
  // 生活方式
  "烹饪", "咖啡", "茶艺", "品酒", "旅行", "收藏",
  // 手作创意
  "手工", "木工", "陶艺", "园艺",
  // 亚文化
  "二次元", "COSPLAY", "电竞", "模型",
  // 学习探索
  "心理学", "哲学", "历史", "神秘学", "占星"
] as const;

/**
 * 困扰话题配置
 */
export const TROUBLE_CATEGORIES = [
  {
    id: "career_bottleneck" as TroubleCategory,
    label: "职业瓶颈",
    icon: "💼",
    description: "晋升受阻、转型困难、职场迷茫"
  },
  {
    id: "intimate_relationship" as TroubleCategory,
    label: "亲密关系",
    icon: "💔",
    description: "恋爱、婚姻、情感依赖与失望"
  },
  {
    id: "family_origin" as TroubleCategory,
    label: "原生家庭",
    icon: "🏠",
    description: "父母关系、童年创伤、家庭模式"
  },
  {
    id: "self_worth" as TroubleCategory,
    label: "自我价值",
    icon: "🪞",
    description: "自卑、不配得感、冒充者综合征"
  },
  {
    id: "meaninglessness" as TroubleCategory,
    label: "无意义感",
    icon: "🌑",
    description: "存在空虚、人生无目标、虚无主义"
  },
  {
    id: "financial_anxiety" as TroubleCategory,
    label: "财务焦虑",
    icon: "💰",
    description: "赚钱压力、财务自由焦虑、消费困扰"
  }
] as const;

/**
 * MBTI 类型列表
 */
export const MBTI_TYPES: MBTIType[] = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP"
];

/**
 * 计算年龄的工具函数
 */
export function calculateAge(birthYear: number): number {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}
