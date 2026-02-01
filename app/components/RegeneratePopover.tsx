"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type RegenerateReason =
  | "scenario_mismatch"
  | "too_generic"
  | "different_angle";

interface RegeneratePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: RegenerateReason, customFeedback: string) => void;
  isLoading?: boolean;
}

const REGENERATE_OPTIONS = [
  {
    id: "scenario_mismatch" as RegenerateReason,
    label: "场景不符合我的实际情况",
    icon: "🎯",
    description: "这个场景我日常不会遇到",
  },
  {
    id: "too_generic" as RegenerateReason,
    label: "问题太笼统/像模板",
    icon: "📋",
    description: "感觉是套公式，不够具体",
  },
  {
    id: "different_angle" as RegenerateReason,
    label: "我想换个完全不同的角度",
    icon: "🔄",
    description: "换个领域或情境来问",
  },
];

export default function RegeneratePopover({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: RegeneratePopoverProps) {
  const [selectedReason, setSelectedReason] = useState<RegenerateReason | null>(null);
  const [customFeedback, setCustomFeedback] = useState("");
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setSelectedReason(null);
      setCustomFeedback("");
      setShowInput(false);
    }
  }, [isOpen]);

  const handleReasonSelect = (reason: RegenerateReason) => {
    setSelectedReason(reason);
    setShowInput(true);
    // 自动滚动到底部，确保输入框可见
    setTimeout(() => {
      inputRef.current?.focus();
      scrollContainerRef.current?.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }, 300);
  };

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit(selectedReason, customFeedback.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            // 点击遮罩层关闭
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          {/* 弹窗容器 */}
          <motion.div
            ref={popoverRef}
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md max-h-[85vh] flex flex-col bg-gray-900/90 border-2 border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - 固定顶部 */}
            <div className="flex-shrink-0 p-4 border-b border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1">为什么要换题？</h3>
                  <p className="text-sm text-gray-400">
                    告诉 AI 你的想法，让它生成更适合你的场景
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  disabled={isLoading}
                  aria-label="关闭"
                >
                  <span className="text-gray-400">✕</span>
                </button>
              </div>
            </div>

            {/* Body - 可滚动内容区域 */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
              {/* 选项列表 */}
              <div className="space-y-2.5 mb-4">
                {REGENERATE_OPTIONS.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleReasonSelect(option.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      selectedReason === option.id
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-gray-700 hover:border-gray-600"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl mt-0.5">{option.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm mb-0.5">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-400">
                          {option.description}
                        </div>
                      </div>
                      {selectedReason === option.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs"
                        >
                          ✓
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* 补充说明输入框 */}
              <AnimatePresence>
                {showInput && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="pt-4 border-t border-white/10"
                  >
                    <label className="text-sm text-gray-400 mb-2 block">
                      补充说明 <span className="text-gray-600">(可选，但强烈建议)</span>
                    </label>
                    <textarea
                      ref={inputRef}
                      value={customFeedback}
                      onChange={(e) => setCustomFeedback(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="比如：我其实不懂技术细节... / 我更关心人际关系... / 我是自由职业不是职场..."
                      disabled={isLoading}
                      className="w-full p-3 bg-gray-800/50 border-2 border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none min-h-20 resize-none text-sm disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      💡 提示：越具体越好！AI 会严格根据你的反馈调整场景。
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer - 固定底部 */}
            <div className="flex-shrink-0 p-4 border-t border-white/10">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg border-2 border-gray-700 hover:border-gray-600 transition-colors disabled:opacity-50 text-sm"
                >
                  取消
                </button>
                <motion.button
                  onClick={handleSubmit}
                  disabled={!selectedReason || isLoading}
                  whileHover={{ scale: selectedReason ? 1.05 : 1 }}
                  whileTap={{ scale: selectedReason ? 0.95 : 1 }}
                  className={`px-5 py-2 rounded-lg transition-all text-sm font-medium ${
                    selectedReason && !isLoading
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      : "bg-gray-700 cursor-not-allowed opacity-50"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      重新生成中...
                    </span>
                  ) : (
                    "提交并重新生成"
                  )}
                </motion.button>
              </div>

              {/* 键盘快捷键提示 */}
              {showInput && !isLoading && (
                <div className="mt-3 text-xs text-gray-600 text-center">
                  按 <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">⌘/Ctrl</kbd> +{" "}
                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Enter</kbd> 快速提交
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
