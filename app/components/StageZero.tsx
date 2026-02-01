"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserProfile,
  Interest,
  InterestDepth,
  TroubleCategory,
  StressLevel,
  Trouble,
  PRESET_INTEREST_TAGS,
  TROUBLE_CATEGORIES,
  MBTI_TYPES,
  MBTIType,
} from "../types/UserProfile";

interface StageZeroProps {
  onComplete: (profile: UserProfile) => void;
}

export default function StageZero({ onComplete }: StageZeroProps) {
  const [step, setStep] = useState(0);

  // 基础画像状态
  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [industry, setIndustry] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [mbti, setMbti] = useState<MBTIType | "">("");

  // 兴趣爱好状态
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [expandedInterest, setExpandedInterest] = useState<string | null>(null);
  const [customInterest, setCustomInterest] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);

  // 核心困扰状态 (多选)
  const [selectedTroubleCategories, setSelectedTroubleCategories] = useState<TroubleCategory[]>([]);
  const [troubleIntensities, setTroubleIntensities] = useState<{ [key: string]: number }>({});
  const [troubleDetails, setTroubleDetails] = useState("");

  // Step 配置
  const TOTAL_STEPS = 5;

  // 检查当前步骤是否完成
  const isStepComplete = () => {
    switch (step) {
      case 0:
        return gender !== "";
      case 1:
        return birthYear !== "" && parseInt(birthYear) > 1900 && parseInt(birthYear) <= new Date().getFullYear();
      case 2:
        return industry.trim() !== "" && jobTitle.trim() !== "";
      case 3:
        return selectedInterests.length > 0;
      case 4:
        return selectedTroubleCategories.length > 0;
      default:
        return false;
    }
  };

  // 处理兴趣标签点击
  const handleInterestToggle = (tag: string) => {
    const existingIndex = selectedInterests.findIndex((i) => i.tag === tag);

    if (existingIndex >= 0) {
      // 已选中,移除
      setSelectedInterests(selectedInterests.filter((i) => i.tag !== tag));
      if (expandedInterest === tag) {
        setExpandedInterest(null);
      }
    } else {
      // 新选中,展开深度选择
      setExpandedInterest(tag);
    }
  };

  // 设置兴趣深度
  const handleInterestDepthSelect = (tag: string, depth: InterestDepth) => {
    const existingIndex = selectedInterests.findIndex((i) => i.tag === tag);

    if (existingIndex >= 0) {
      // 更新深度
      const updated = [...selectedInterests];
      updated[existingIndex].depth = depth;
      setSelectedInterests(updated);
    } else {
      // 添加新兴趣
      setSelectedInterests([...selectedInterests, { tag, depth }]);
    }

    setExpandedInterest(null);
  };

  // 处理自定义兴趣添加
  const handleCustomInterestAdd = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) return;

    // 检查是否已存在
    const exists = selectedInterests.some((i) => i.tag.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setCustomInterest("");
      setShowCustomInput(false);
      return;
    }

    // 添加新兴趣并立即展开深度选择
    setExpandedInterest(trimmed);
    setCustomInterest("");
    setShowCustomInput(false);
  };

  // 移除已选兴趣
  const handleRemoveInterest = (tag: string) => {
    setSelectedInterests(selectedInterests.filter((i) => i.tag !== tag));
  };

  // 处理困扰话题多选
  const handleTroubleCategoryToggle = (category: TroubleCategory) => {
    if (selectedTroubleCategories.includes(category)) {
      // 取消选中
      setSelectedTroubleCategories(selectedTroubleCategories.filter((c) => c !== category));
      // 移除对应的强度数据
      const newIntensities = { ...troubleIntensities };
      delete newIntensities[category];
      setTroubleIntensities(newIntensities);
    } else {
      // 新选中
      setSelectedTroubleCategories([...selectedTroubleCategories, category]);
      // 初始化默认强度
      setTroubleIntensities({ ...troubleIntensities, [category]: 5 });
    }
  };

  // 更新特定困扰的强度
  const handleTroubleIntensityChange = (category: TroubleCategory, intensity: number) => {
    setTroubleIntensities({ ...troubleIntensities, [category]: intensity });
  };

  // 计算压力等级
  const getStressLevel = (intensity: number): StressLevel => {
    if (intensity <= 3) return "mild";
    if (intensity <= 6) return "moderate";
    return "severe";
  };

  // 获取困扰话题的显示信息
  const getTroubleCategoryInfo = (category: TroubleCategory) => {
    return TROUBLE_CATEGORIES.find((c) => c.id === category);
  };

  // 提交表单
  const handleSubmit = () => {
    if (selectedTroubleCategories.length === 0) return;

    // 构建困扰数组
    const troubles: Trouble[] = selectedTroubleCategories.map((category) => ({
      category,
      stressIntensity: troubleIntensities[category] || 5,
      stressLevel: getStressLevel(troubleIntensities[category] || 5),
    }));

    const profile: UserProfile = {
      gender,
      birthYear: parseInt(birthYear),
      industry,
      jobTitle,
      mbti: mbti || undefined,
      interests: selectedInterests,
      currentTroubles: {
        troubles,
        details: troubleDetails.trim() || undefined,
      },
    };

    onComplete(profile);
  };

  // 下一步
  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="max-w-2xl w-full">
      {/* 进度条 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Stage 0: 锚定现状</span>
          <span className="text-sm text-gray-400">{step + 1} / {TOTAL_STEPS}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* 主内容区 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 shadow-2xl"
        >
          {/* Step 0: 性别选择 */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">选择您的性别</h2>
              <div className="grid grid-cols-2 gap-4">
                {["男性", "女性"].map((option) => (
                  <motion.button
                    key={option}
                    onClick={() => setGender(option)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      gender === option
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: 出生年份 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-2">您的出生年份</h2>
              <p className="text-gray-400 text-sm mb-6">我们会自动计算您的当前年龄</p>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="例如: 1990"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none text-center text-2xl font-semibold"
              />
              {birthYear && parseInt(birthYear) > 1900 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-purple-400"
                >
                  当前年龄: {new Date().getFullYear() - parseInt(birthYear)} 岁
                </motion.p>
              )}
            </div>
          )}

          {/* Step 2: 行业 + 职位 + MBTI */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">您的职业身份</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">行业</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="如: 互联网、金融、艺术、教育..."
                    className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">职位</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="如: 产品经理、自由职业者、学生..."
                    className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    MBTI 人格类型 <span className="text-gray-600">(可选)</span>
                  </label>
                  <select
                    value={mbti}
                    onChange={(e) => setMbti(e.target.value as MBTIType | "")}
                    className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">暂不选择</option>
                    {MBTI_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 兴趣爱好标签云 + 自定义 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-2">您的兴趣爱好</h2>
              <p className="text-gray-400 text-sm mb-6">
                选择您的兴趣,点击后可设置投入程度
              </p>

              {/* 标签云 */}
              <div className="flex flex-wrap gap-3">
                {PRESET_INTEREST_TAGS.map((tag) => {
                  const selected = selectedInterests.find((i) => i.tag === tag);
                  const isExpanded = expandedInterest === tag;

                  return (
                    <div key={tag} className="relative">
                      <motion.button
                        onClick={() => handleInterestToggle(tag)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-full border-2 transition-all text-sm ${
                          selected
                            ? "border-purple-500 bg-purple-500/20 text-purple-300"
                            : "border-gray-700 hover:border-gray-600 text-gray-400"
                        }`}
                      >
                        {tag}
                        {selected && (
                          <span className="ml-2 text-xs opacity-70">
                            {selected.depth === "light" && "·"}
                            {selected.depth === "medium" && "··"}
                            {selected.depth === "heavy" && "···"}
                          </span>
                        )}
                      </motion.button>

                      {/* 深度选择弹窗 */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-10 mt-2 left-0 bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-2xl min-w-[200px]"
                          >
                            <p className="text-xs text-gray-400 mb-2">选择投入程度</p>
                            <div className="space-y-2">
                              {(["light", "medium", "heavy"] as InterestDepth[]).map((depth) => (
                                <button
                                  key={depth}
                                  onClick={() => handleInterestDepthSelect(tag, depth)}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-500/20 transition-all text-sm"
                                >
                                  {depth === "light" && "轻度 · 偶尔接触"}
                                  {depth === "medium" && "中度 ·· 定期投入"}
                                  {depth === "heavy" && "重度 ··· 深度痴迷"}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* 自定义兴趣按钮/输入框 */}
                <AnimatePresence mode="wait">
                  {!showCustomInput ? (
                    <motion.button
                      key="custom-button"
                      onClick={() => {
                        setShowCustomInput(true);
                        setTimeout(() => customInputRef.current?.focus(), 100);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-4 py-2 rounded-full border-2 border-dashed border-gray-600 hover:border-purple-500 text-gray-500 hover:text-purple-400 transition-all text-sm"
                    >
                      + 自定义
                    </motion.button>
                  ) : (
                    <motion.div
                      key="custom-input"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center gap-2"
                    >
                      <input
                        ref={customInputRef}
                        type="text"
                        value={customInterest}
                        onChange={(e) => setCustomInterest(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCustomInterestAdd();
                          if (e.key === "Escape") setShowCustomInput(false);
                        }}
                        placeholder="输入兴趣名称"
                        className="px-4 py-2 bg-gray-800 border-2 border-purple-500 rounded-full focus:outline-none text-sm min-w-[150px]"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCustomInterestAdd}
                        className="w-8 h-8 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center"
                      >
                        ✓
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setCustomInterest("");
                          setShowCustomInput(false);
                        }}
                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center"
                      >
                        ✕
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 已选兴趣列表 */}
              {selectedInterests.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700"
                >
                  <p className="text-sm text-gray-400 mb-2">已选兴趣:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map((interest) => (
                      <motion.span
                        key={interest.tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2"
                      >
                        {interest.tag}
                        <span className="opacity-70">
                          {interest.depth === "light" && "·"}
                          {interest.depth === "medium" && "··"}
                          {interest.depth === "heavy" && "···"}
                        </span>
                        <button
                          onClick={() => handleRemoveInterest(interest.tag)}
                          className="ml-1 hover:text-red-400 transition-colors"
                        >
                          ✕
                        </button>
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Step 4: 核心困扰 (多选 + 单独滑块) */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-2">当前困扰您的问题</h2>
              <p className="text-gray-400 text-sm mb-6">
                可以选择多个困扰话题,我们会帮您理清它们的关系
              </p>

              {/* Step A: 话题卡片 (多选) */}
              <div className="grid grid-cols-2 gap-4">
                {TROUBLE_CATEGORIES.map((category) => {
                  const isSelected = selectedTroubleCategories.includes(category.id);
                  return (
                    <motion.button
                      key={category.id}
                      onClick={() => handleTroubleCategoryToggle(category.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                        isSelected
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs"
                        >
                          ✓
                        </motion.div>
                      )}
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="font-semibold mb-1">{category.label}</div>
                      <div className="text-xs text-gray-500">{category.description}</div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Step B: 每个困扰的强度滑块 */}
              <AnimatePresence>
                {selectedTroubleCategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 space-y-4"
                  >
                    <p className="text-sm text-gray-400 mb-4">
                      {selectedTroubleCategories.length > 3
                        ? "为每个困扰标记痛苦程度"
                        : "分别标记每个困扰的痛苦程度"}
                    </p>

                    {selectedTroubleCategories.map((category) => {
                      const categoryInfo = getTroubleCategoryInfo(category);
                      const intensity = troubleIntensities[category] || 5;

                      return (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-gray-800/50 rounded-xl border border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{categoryInfo?.icon}</span>
                              <span className="font-semibold text-sm">{categoryInfo?.label}</span>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                                {intensity}
                              </div>
                              <div className="text-xs text-gray-400">
                                {intensity <= 3 && "轻微"}
                                {intensity > 3 && intensity <= 6 && "中度"}
                                {intensity > 6 && "严重"}
                              </div>
                            </div>
                          </div>

                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={intensity}
                            onChange={(e) =>
                              handleTroubleIntensityChange(category, parseInt(e.target.value))
                            }
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                              background: `linear-gradient(to right,
                                rgb(168, 85, 247) 0%,
                                rgb(236, 72, 153) ${(intensity / 10) * 100}%,
                                rgb(55, 65, 81) ${(intensity / 10) * 100}%)`
                            }}
                          />
                        </motion.div>
                      );
                    })}

                    {/* Step C: 补充细节 */}
                    <div className="mt-6">
                      <label className="text-sm text-gray-400 mb-2 block">
                        这些困扰是如何相互影响的？想多说说吗？{" "}
                        <span className="text-gray-600">(可选)</span>
                      </label>
                      <textarea
                        value={troubleDetails}
                        onChange={(e) => setTroubleDetails(e.target.value)}
                        placeholder="比如：工作压力导致关系紧张,反过来又让我更焦虑..."
                        className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none min-h-24 resize-none text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 导航按钮 */}
      <div className="flex justify-between mt-8">
        {step > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 rounded-xl border-2 border-gray-700 hover:border-gray-600 transition-all"
          >
            上一步
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: isStepComplete() ? 1.05 : 1 }}
          whileTap={{ scale: isStepComplete() ? 0.95 : 1 }}
          onClick={handleNext}
          disabled={!isStepComplete()}
          className={`ml-auto px-8 py-3 rounded-xl transition-all ${
            isStepComplete()
              ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              : "bg-gray-700 cursor-not-allowed opacity-50"
          }`}
        >
          {step < TOTAL_STEPS - 1 ? "下一步" : "开始潜入"}
        </motion.button>
      </div>

      {/* 底部提示 */}
      <div className="text-center mt-8 text-gray-600 text-sm">
        <p>我们将通过动态追问和投射性测试</p>
        <p>帮助您挖掘潜意识中的核心矛盾与行为动力</p>
      </div>

      {/* 自定义滑块样式 */}
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153));
          cursor: pointer;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153));
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
      `}</style>
    </div>
  );
}
