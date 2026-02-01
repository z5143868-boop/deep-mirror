"use client";

import { motion } from "framer-motion";

interface InsightCardProps {
  stage: number;
  feedback: string;
  onContinue: () => void;
  onRestart?: () => void;
}

const STAGE_INFO = {
  1: {
    icon: "👁️",
    name: "表层行为",
    subtitle: "The Surface",
    color: "from-blue-500 to-cyan-500"
  },
  2: {
    icon: "⚡",
    name: "深层动力",
    subtitle: "The Drive",
    color: "from-purple-500 to-pink-500"
  },
  3: {
    icon: "🌑",
    name: "阴影与防御",
    subtitle: "The Shadow",
    color: "from-red-500 to-orange-500"
  },
};

export default function InsightCard({ stage, feedback, onContinue, onRestart }: InsightCardProps) {
  const info = STAGE_INFO[stage as keyof typeof STAGE_INFO];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      {/* 洞察卡片 */}
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border-2 border-gray-700 shadow-2xl overflow-hidden">
        {/* 顶部装饰条 */}
        <div className={`h-2 bg-gradient-to-r ${info.color}`} />

        {/* 卡片内容 */}
        <div className="p-8">
          {/* 🔑 头部重构 - Flex 布局 + 分隔线 */}
          <div className="mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg`}>
                <span className="text-3xl">{info.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white">AI 分析师的洞察</h2>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                    ✓ Stage {stage} 完成
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {info.name} · {info.subtitle}
                </p>
              </div>
            </div>
            {/* 细微分隔线 */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
          </div>

          {/* 🔑 洞察内容 - 左对齐 + 柔和颜色 + 装饰线 */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-lg">🔮</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-purple-300 mb-1">基于您的回答，我看到了...</h3>
              </div>
            </div>
            {/* 左对齐 + 装饰线 + 增加行高 */}
            <div className="border-l-4 border-purple-500/30 pl-4">
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-left">{feedback}</p>
              </div>
            </div>
          </div>

          {/* 🔑 主要 CTA 按钮 + 次要操作按钮 */}
          <div className="flex flex-col items-center gap-3">
            {/* 主要按钮：继续深入 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onContinue}
              className={`px-8 py-3 rounded-xl bg-gradient-to-r ${info.color} hover:opacity-90 transition-opacity font-semibold text-white shadow-lg`}
            >
              {stage < 3 ? "继续深入 →" : "查看完整报告 →"}
            </motion.button>

            {/* 🔑 次要按钮：重新开始 (幽灵按钮) */}
            {onRestart && (
              <button
                onClick={onRestart}
                className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-2 transition-colors group"
                title="清除所有数据并重新开始"
              >
                <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>重新开始</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center mt-4 text-gray-500 text-sm">
        <p>💡 您可以在下方查看和修改本阶段的答案</p>
      </div>
    </motion.div>
  );
}
