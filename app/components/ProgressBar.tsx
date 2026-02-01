"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  percentage: number;
  stage: number;
  questionIndex: number;
  totalQuestions: number;
}

export default function ProgressBar({
  percentage,
  stage,
  questionIndex,
  totalQuestions
}: ProgressBarProps) {
  // Stage名称映射
  const STAGE_NAMES: Record<number, string> = {
    0: "信息采集",
    1: "表层行为",
    2: "深层动力",
    3: "阴影与防御",
    4: "完整报告"
  };

  const stageName = STAGE_NAMES[stage] || "未知阶段";

  return (
    <div className="w-full bg-gray-900/50 backdrop-blur-sm border-b border-gray-800 py-4 px-6">
      <div className="max-w-4xl mx-auto">
        {/* 顶部信息 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-400">
              {stage === 0 && "📋 信息采集"}
              {stage >= 1 && stage <= 3 && `🎯 Stage ${stage}/3`}
              {stage === 4 && "✨ 分析完成"}
            </span>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-sm text-gray-400">{stageName}</span>
            {stage >= 1 && stage <= 3 && (
              <>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-sm text-gray-400">
                  第 {questionIndex + 1}/{totalQuestions} 题
                </span>
              </>
            )}
          </div>

          {/* 百分比显示 */}
          <motion.div
            key={percentage}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {Math.round(percentage)}%
            </span>
          </motion.div>
        </div>

        {/* 进度条 */}
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          {/* 背景光效 */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />

          {/* 进度填充 */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-400 rounded-full shadow-lg shadow-purple-500/50"
          >
            {/* 动态光泽效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>

          {/* 进度点 */}
          <motion.div
            initial={{ left: 0 }}
            animate={{ left: `${percentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg shadow-purple-500/50 border-2 border-purple-400"
          />
        </div>

        {/* 底部阶段标记 */}
        <div className="flex justify-between mt-2 px-1">
          {[0, 1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`text-xs transition-colors ${
                stage > s || (stage === s && stage === 4)
                  ? "text-purple-400 font-semibold"
                  : stage === s
                  ? "text-white font-semibold"
                  : "text-gray-600"
              }`}
            >
              {s === 0 ? "开始" : s === 4 ? "完成" : `S${s}`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
