"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Answer {
  question: string;
  selectedOption: { id: string; text: string };
}

interface AnswerReviewProps {
  allAnswers: { [key: number]: Answer[] };
}

const STAGE_NAMES = {
  1: { name: "表层行为", subtitle: "The Surface", icon: "👁️" },
  2: { name: "深层动力", subtitle: "The Drive", icon: "⚡" },
  3: { name: "阴影与防御", subtitle: "The Shadow", icon: "🌑" },
};

export default function AnswerReview({ allAnswers }: AnswerReviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const totalQuestions = Object.values(allAnswers).reduce(
    (sum, answers) => sum + answers.length,
    0
  );

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden">
      {/* 折叠标题 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">答案回顾</h3>
            <p className="text-sm text-gray-400 mt-1">
              查看您在测试中的所有选择 · 共 {totalQuestions} 道题
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-gray-400 text-2xl"
        >
          ↓
        </motion.div>
      </button>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-800"
          >
            <div className="p-6 space-y-4">
              {Object.entries(allAnswers).map(([stageKey, answers]) => {
                const stage = parseInt(stageKey);
                const stageInfo = STAGE_NAMES[stage as keyof typeof STAGE_NAMES];
                const isStageExpanded = expandedStage === stage;

                return (
                  <div
                    key={stage}
                    className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
                  >
                    {/* Stage 标题 */}
                    <button
                      onClick={() =>
                        setExpandedStage(isStageExpanded ? null : stage)
                      }
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{stageInfo.icon}</span>
                        <div className="text-left">
                          <div className="font-semibold text-white">
                            Stage {stage}: {stageInfo.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {stageInfo.subtitle} · {answers.length} 道题
                          </div>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isStageExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-400"
                      >
                        ↓
                      </motion.div>
                    </button>

                    {/* Stage 答案列表 */}
                    <AnimatePresence>
                      {isStageExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-700"
                        >
                          <div className="p-6 space-y-6">
                            {answers.map((answer, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative pl-8"
                              >
                                {/* 时间线圆点 */}
                                <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                                  <span className="text-xs text-purple-400 font-bold">
                                    {index + 1}
                                  </span>
                                </div>

                                {/* 时间线竖线 */}
                                {index < answers.length - 1 && (
                                  <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-700" />
                                )}

                                {/* 问题和答案 */}
                                <div className="space-y-2">
                                  <p className="text-gray-300 font-medium leading-relaxed">
                                    {answer.question}
                                  </p>
                                  <div className="flex items-start gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400 font-bold">
                                      {answer.selectedOption.id}
                                    </span>
                                    <p className="flex-1 text-sm text-purple-200">
                                      {answer.selectedOption.text}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* 底部提示 */}
            <div className="px-6 pb-6">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <p className="text-xs text-gray-400 text-center">
                  💡 提示：回顾您的选择，可以帮助您更好地理解分析结果
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
