"use client";

import { motion } from "framer-motion";

export type ErrorType = "network" | "api" | "timeout" | "unknown";

interface ErrorDisplayProps {
  error: string;
  errorType?: ErrorType;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ERROR_CONFIGS = {
  network: {
    icon: "🌐",
    title: "网络连接问题",
    color: "text-orange-400",
    bgColor: "bg-orange-900/20",
    borderColor: "border-orange-500/50",
  },
  api: {
    icon: "⚠️",
    title: "服务器错误",
    color: "text-red-400",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-500/50",
  },
  timeout: {
    icon: "⏱️",
    title: "请求超时",
    color: "text-yellow-400",
    bgColor: "bg-yellow-900/20",
    borderColor: "border-yellow-500/50",
  },
  unknown: {
    icon: "❌",
    title: "未知错误",
    color: "text-gray-400",
    bgColor: "bg-gray-900/20",
    borderColor: "border-gray-500/50",
  },
};

export default function ErrorDisplay({
  error,
  errorType = "unknown",
  onRetry,
  onDismiss,
}: ErrorDisplayProps) {
  const config = ERROR_CONFIGS[errorType];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-6 mb-6 backdrop-blur-sm`}
    >
      <div className="flex items-start gap-4">
        {/* 图标 */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
          <span className="text-2xl">{config.icon}</span>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-semibold ${config.color} mb-2`}>
            {config.title}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">{error}</p>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3">
            {onRetry && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRetry}
                className={`px-4 py-2 rounded-lg ${config.bgColor} border ${config.borderColor} ${config.color} hover:opacity-80 transition-opacity font-medium text-sm flex items-center gap-2`}
              >
                <span>🔄</span>
                重试
              </motion.button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 transition-colors text-sm"
              >
                关闭
              </button>
            )}
          </div>
        </div>

        {/* 关闭按钮 */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-300"
            aria-label="关闭"
          >
            ✕
          </button>
        )}
      </div>

      {/* 建议提示 */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500">
          {errorType === "network" && "💡 请检查您的网络连接，然后点击重试"}
          {errorType === "api" && "💡 服务器可能正在维护，请稍后重试"}
          {errorType === "timeout" && "💡 请求时间过长，可能是网络不稳定"}
          {errorType === "unknown" && "💡 如果问题持续出现，请联系技术支持"}
        </p>
      </div>
    </motion.div>
  );
}
