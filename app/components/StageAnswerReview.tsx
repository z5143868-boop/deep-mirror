"use client";

import { motion } from "framer-motion";

interface Answer {
  question: string;
  selectedOption: { id: string; text: string };
}

interface StageAnswerReviewProps {
  stage: number;
  answers: Answer[];
  onEditAnswer: (questionIndex: number) => void;
}

export default function StageAnswerReview({ stage, answers, onEditAnswer }: StageAnswerReviewProps) {
  if (answers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden"
    >
      {/* 标题 */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-xl">📝</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">我的回答回顾</h3>
            <p className="text-sm text-gray-400">
              Stage {stage} · 共 {answers.length} 道题
            </p>
          </div>
        </div>
      </div>

      {/* 回答列表 */}
      <div className="p-6 space-y-4">
        {answers.map((answer, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-gray-800/50 rounded-xl border-2 border-gray-700 hover:border-blue-500/50 transition-all overflow-hidden"
          >
            {/* 题号标记 */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500" />

            <div className="pl-5 pr-4 py-4">
              {/* 题目摘要 */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold">
                      Q{index + 1}
                    </span>
                    <p className="text-gray-300 font-medium text-sm line-clamp-2">
                      {answer.question}
                    </p>
                  </div>
                </div>

                {/* 修改按钮 */}
                <button
                  onClick={() => onEditAnswer(index)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-blue-500 bg-gray-700/50 hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition-all text-xs font-medium group-hover:opacity-100 opacity-0"
                >
                  ✏️ 修改
                </button>
              </div>

              {/* 选择的答案 */}
              <div className="flex items-start gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold">
                  {answer.selectedOption.id}
                </span>
                <p className="flex-1 text-sm text-blue-200">
                  {answer.selectedOption.text}
                </p>
              </div>
            </div>

            {/* 悬停提示 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="px-6 pb-4">
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-xs text-yellow-400 text-center">
            ⚠️ 修改某道题的答案会清除该题之后的所有答案，请谨慎操作
          </p>
        </div>
      </div>
    </motion.div>
  );
}
