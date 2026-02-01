"use client";

import { useState, useEffect, useRef } from "react";
import StageZero from "./components/StageZero";
import RegeneratePopover, { RegenerateReason } from "./components/RegeneratePopover";
import AnswerReview from "./components/AnswerReview";
import ErrorDisplay, { ErrorType } from "./components/ErrorDisplay";
import InsightCard from "./components/InsightCard";
import StageAnswerReview from "./components/StageAnswerReview";
import ProgressBar from "./components/ProgressBar";
import { UserProfile } from "./types/UserProfile";
import { useDeepMirrorStorage } from "./hooks/useLocalStorage";
import { useShareImage } from "./hooks/useShareImage";

interface Question {
  question: string;
  options: Array<{ id: string; text: string }>;
}

interface Answer {
  question: string;
  selectedOption: { id: string; text: string };
}

interface Report {
  core_identity: {
    title: string;
    description: string;
  };
  inner_conflict: {
    title: string;
    description: string;
  };
  risk_prediction: {
    title: string;
    description: string;
  };
  evolution_path: {
    title: string;
    suggestions: Array<{
      label: string;
      description: string;
    }>;
  };
}

// Stage 配置
const STAGE_CONFIG = {
  1: { name: "表层行为", subtitle: "The Surface", questionCount: 3 },
  2: { name: "深层动力", subtitle: "The Drive", questionCount: 3 },
  3: { name: "阴影与防御", subtitle: "The Shadow", questionCount: 2 },
};

export default function Home() {
  // localStorage 管理
  const { saveSession, clearSession, hasSession, getSession } = useDeepMirrorStorage();

  // 分享功能 - 报告容器 ref
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const { generateAndDownload, isGenerating: isGeneratingImage, error: shareError } = useShareImage();

  // 用户画像状态
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // 测试流程状态
  const [currentStage, setCurrentStage] = useState(0); // 0: Stage 0, 1-3: 测试阶段, 4: 查看反馈
  const [questionIndex, setQuestionIndex] = useState(0); // 当前题目索引（0-based）
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [stageAnswers, setStageAnswers] = useState<Answer[]>([]); // 当前 Stage 的答案
  const [allAnswers, setAllAnswers] = useState<{ [key: number]: Answer[] }>({}); // 所有 Stage 的答案
  const [feedback, setFeedback] = useState<string>(""); // 当前 Stage 的反馈
  const [report, setReport] = useState<Report | null>(null); // 最终报告

  // UI 状态
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<ErrorType>("unknown");
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null);

  // 重新生成题目状态
  const [showRegeneratePopover, setShowRegeneratePopover] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<Question | null>(null);

  // 恢复会话数据
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  // Stage 洞察视图状态
  const [showingInsight, setShowingInsight] = useState(false);

  // 页面加载时恢复数据
  useEffect(() => {
    if (hasSession()) {
      const session = getSession();
      if (session) {
        setUserProfile(session.userProfile);

        // 🔧 修复：清理旧版本的小数 stage 值（1.5 -> 1, 2.5 -> 2, 3.5 -> 3）
        const cleanedStage = Math.floor(session.currentStage);
        setCurrentStage(cleanedStage);

        // 🔧 修复：如果有反馈且不在做题状态，则显示洞察视图
        const hasCompletedQuestions = session.stageAnswers && session.stageAnswers.length > 0;
        const hasFeedback = session.feedback && session.feedback.trim() !== '';
        if (hasCompletedQuestions && hasFeedback && !session.currentQuestion) {
          setShowingInsight(true);
        }

        setQuestionIndex(session.questionIndex);
        setCurrentQuestion(session.currentQuestion);
        setStageAnswers(session.stageAnswers);
        setAllAnswers(session.allAnswers);
        setFeedback(session.feedback);
        setReport(session.report);
        console.log("✅ 会话已恢复", { ...session, cleanedStage });
      }
    }
    setIsRestoringSession(false);
  }, []);

  // 自动保存数据（每次状态变化时）
  useEffect(() => {
    if (!isRestoringSession && (userProfile || currentStage > 0)) {
      saveSession({
        userProfile,
        currentStage,
        questionIndex,
        currentQuestion,
        stageAnswers,
        allAnswers,
        feedback,
        report,
      });

      // 显示保存提示
      setShowSavedIndicator(true);
      const timer = setTimeout(() => setShowSavedIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [userProfile, currentStage, questionIndex, currentQuestion, stageAnswers, allAnswers, feedback, report, isRestoringSession]);

  // Stage 0 完成回调
  const handleStageZeroComplete = async (profile: UserProfile) => {
    setUserProfile(profile);
    // 直接传递 profile，避免状态更新延迟
    await startStage(1, profile);
  };

  // 测试流程函数
  const startStage = async (stage: number, profile?: UserProfile) => {
    setCurrentStage(stage);
    setQuestionIndex(0);
    setStageAnswers([]);
    await generateQuestion(stage, 0, profile);
  };

  // 错误处理辅助函数
  const handleError = (err: unknown, action: () => void) => {
    let errorMessage = "未知错误";
    let type: ErrorType = "unknown";

    if (err instanceof Error) {
      errorMessage = err.message;

      // 判断错误类型
      if (err.message.includes("fetch") || err.message.includes("network")) {
        type = "network";
        errorMessage = "无法连接到服务器，请检查网络连接";
      } else if (err.message.includes("timeout") || err.message.includes("超时")) {
        type = "timeout";
        errorMessage = "请求超时，服务器响应时间过长";
      } else if (err.message.includes("API") || err.message.includes("服务器")) {
        type = "api";
      }
    }

    setError(errorMessage);
    setErrorType(type);
    setLastFailedAction(() => action);
  };

  const generateQuestion = async (
    stage: number,
    index: number,
    profile?: UserProfile,
    isRegenerate?: boolean,
    regenerateReason?: RegenerateReason,
    customFeedback?: string
  ) => {
    const action = () => generateQuestion(stage, index, profile, isRegenerate, regenerateReason, customFeedback);

    setIsLoading(true);
    setLoadingText(
      isRegenerate
        ? "AI 正在根据你的反馈重新设计场景..."
        : index === 0
        ? "正在连接潜意识..."
        : "正在生成下一道题..."
    );
    setError("");

    // 使用传入的 profile 或状态中的 userProfile
    const currentProfile = profile || userProfile;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_profile: currentProfile,
          current_stage: stage,
          previous_answers: allAnswers,
          is_regenerate: isRegenerate || false,
          regenerate_reason: regenerateReason,
          custom_feedback: customFeedback,
          previous_question: isRegenerate ? lastQuestion : null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "生成题目失败");

      const newQuestion = result.data;
      setCurrentQuestion(newQuestion);
      setLastQuestion(newQuestion);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        handleError(new Error("请求超时，服务器响应时间过长"), action);
      } else {
        handleError(err, action);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理重新生成题目
  const handleRegenerate = (reason: RegenerateReason, customFeedback: string) => {
    setShowRegeneratePopover(false);
    generateQuestion(
      currentStage,
      questionIndex,
      undefined,
      true,
      reason,
      customFeedback
    );
  };

  const handleAnswerSelect = async (option: { id: string; text: string }) => {
    if (!currentQuestion) return;

    // 🔧 修复：确保 currentStage 是有效值
    const config = STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG];
    if (!config) {
      console.error("Invalid currentStage:", currentStage);
      setError(`系统错误：无效的 Stage 值 (${currentStage})。请刷新页面重试。`);
      return;
    }

    // 保存答案
    const answer: Answer = {
      question: currentQuestion.question,
      selectedOption: option,
    };
    const newStageAnswers = [...stageAnswers, answer];
    setStageAnswers(newStageAnswers);

    const nextIndex = questionIndex + 1;

    // 判断是否还有题目
    if (nextIndex < config.questionCount) {
      // 还有题目，生成下一题
      setQuestionIndex(nextIndex);
      await generateQuestion(currentStage, nextIndex);
    } else {
      // 本 Stage 完成，保存答案并生成反馈
      setAllAnswers({ ...allAnswers, [currentStage]: newStageAnswers });
      await generateFeedback(currentStage, newStageAnswers);
    }
  };

  const generateFeedback = async (stage: number, answers: Answer[]) => {
    const action = () => generateFeedback(stage, answers);

    setIsLoading(true);
    setLoadingText("AI 正在分析您的回答...");
    setError("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_profile: userProfile,
          stage,
          answers,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "生成反馈失败");

      setFeedback(result.feedback);
      setShowingInsight(true); // 显示洞察视图
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        handleError(new Error("请求超时，服务器响应时间过长"), action);
      } else {
        handleError(err, action);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStage = async () => {
    setShowingInsight(false); // 隐藏洞察视图
    const nextStage = currentStage + 1;
    if (nextStage <= 3) {
      await startStage(nextStage);
    } else {
      // 全部完成，生成最终报告
      await generateReport();
    }
  };

  // 处理回溯修改答案
  const handleEditAnswer = (questionIndex: number) => {
    if (confirm(`确定要修改第 ${questionIndex + 1} 题吗？这会清除该题之后的所有答案。`)) {
      // 重置到指定题目
      setQuestionIndex(questionIndex);
      setShowingInsight(false);

      // 清除该题之后的答案
      const newStageAnswers = stageAnswers.slice(0, questionIndex);
      setStageAnswers(newStageAnswers);

      // 重新生成该题
      generateQuestion(currentStage, questionIndex);
    }
  };

  const generateReport = async () => {
    const action = () => generateReport();

    setIsLoading(true);
    setLoadingText("正在生成您的深度分析报告...");
    setError("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_profile: userProfile,
          all_answers: allAnswers,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "生成报告失败");

      setReport(result.report);
      setCurrentStage(4);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        handleError(new Error("请求超时，服务器响应时间过长"), action);
      } else {
        handleError(err, action);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 重新开始测试
  const handleRestart = () => {
    if (confirm("确定要清除所有数据并重新开始吗？此操作不可撤销。")) {
      clearSession();
      setUserProfile(null);
      setCurrentStage(0);
      setQuestionIndex(0);
      setCurrentQuestion(null);
      setStageAnswers([]);
      setAllAnswers({});
      setFeedback("");
      setReport(null);
      setError("");
      console.log("🔄 数据已清除，重新开始");
    }
  };

  // 生成并下载报告长图
  const handleGenerateShareCard = async () => {
    if (!report) {
      console.error("报告数据不存在");
      return;
    }

    const success = await generateAndDownload(reportContainerRef);
    if (success) {
      console.log("✅ 报告长图已生成并下载");
    }
  };

  // 计算当前进度百分比
  const calculateProgress = (): number => {
    // 总步骤数：Stage 0 (1步) + Stage 1 (3题) + Stage 2 (3题) + Stage 3 (2题) = 9步
    const TOTAL_STEPS = 9;

    // Stage 0 完成
    if (currentStage === 0) {
      return userProfile ? 11 : 0; // 完成 Stage 0 后是 11%
    }

    // 已完成的步骤数
    let completedSteps = 1; // Stage 0 完成

    // Stage 1-3 的进度
    const stageConfigs = [
      { stage: 1, questions: 3 },
      { stage: 2, questions: 3 },
      { stage: 3, questions: 2 },
    ];

    for (const config of stageConfigs) {
      if (currentStage > config.stage) {
        // 该 Stage 已完成
        completedSteps += config.questions;
      } else if (currentStage === config.stage) {
        // 当前 Stage，根据 questionIndex 计算
        if (showingInsight) {
          // 显示洞察卡片时，该 Stage 所有题目已答完
          completedSteps += config.questions;
        } else {
          // 正在答题，已完成的题目数 = stageAnswers.length
          completedSteps += stageAnswers.length;
        }
        break;
      }
    }

    // Stage 4 (最终报告)
    if (currentStage === 4) {
      return 100;
    }

    // 计算百分比
    const percentage = (completedSteps / TOTAL_STEPS) * 100;
    return Math.min(Math.round(percentage), 100);
  };

  // 获取当前 Stage 的总题数（用于进度条显示）
  const getCurrentStageTotalQuestions = (): number => {
    if (currentStage >= 1 && currentStage <= 3) {
      return STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG]?.questionCount || 0;
    }
    return 0;
  };

  // 加载会话时显示加载状态
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex flex-col">
      {/* 进度条 - 固定在顶部 */}
      {currentStage > 0 && (
        <div className="sticky top-0 z-50">
          <ProgressBar
            percentage={calculateProgress()}
            stage={currentStage}
            questionIndex={questionIndex}
            totalQuestions={getCurrentStageTotalQuestions()}
          />
        </div>
      )}

      {/* 🔑 自动保存提示 - 浮动 Toast (顶部中央) */}
      {showSavedIndicator && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gray-900/90 backdrop-blur-sm border-l-4 border-purple-500 rounded-lg px-6 py-3 shadow-2xl flex items-center gap-3">
            <span className="text-purple-400 text-lg">✓</span>
            <span className="text-purple-100 text-sm font-medium">已保存</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* 标题 */}
          <div className="text-center mb-12 relative">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              深度之镜
            </h1>
            <p className="text-gray-400 text-lg">The Deep Mirror</p>
            <p className="text-gray-500 mt-2">比你自己更懂你的 AI 深度自我察觉工具</p>

            {/* 顶部工具栏 */}
            {currentStage > 0 && (
              <div className="absolute top-0 right-0 flex items-center gap-3">
                {/* 🔑 重新开始按钮 (幽灵样式) */}
                <button
                  onClick={handleRestart}
                  className="text-gray-500 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors group"
                  title="清除所有数据并重新开始"
                >
                  <svg className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>重新开始</span>
                </button>
              </div>
            )}
          </div>

        {/* Loading 状态 */}
        {isLoading && (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-12 border border-gray-800 shadow-2xl">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold mb-2">{loadingText}</p>
                <p className="text-gray-500 text-sm">AI 正在为您定制专属测试</p>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <ErrorDisplay
            error={error}
            errorType={errorType}
            onRetry={lastFailedAction || undefined}
            onDismiss={() => setError("")}
          />
        )}

        {/* Stage 0: 锚定现状 (使用新的 StageZero 组件) */}
        {currentStage === 0 && !isLoading && (
          <StageZero onComplete={handleStageZeroComplete} />
        )}

        {/* Stage 1-3: 测试界面 */}
        {currentStage >= 1 && currentStage <= 3 && !isLoading && (
          <div className="space-y-6">
            {/* 洞察视图：Stage 完成后显示 */}
            {showingInsight && feedback ? (
              <>
                {/* 洞察卡片 */}
                <InsightCard
                  stage={currentStage}
                  feedback={feedback}
                  onContinue={handleNextStage}
                  onRestart={handleRestart}
                />

                {/* 回答回顾列表 */}
                <StageAnswerReview
                  stage={currentStage}
                  answers={stageAnswers}
                  onEditAnswer={handleEditAnswer}
                />
              </>
            ) : currentQuestion ? (
              <>
                {/* 做题视图：显示题目和选项 */}
                {STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG] && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-purple-400">
                        Stage {currentStage}: {STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG].name}
                      </span>
                      <span className="text-sm text-gray-400">
                        {questionIndex + 1} / {STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG].questionCount}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${((questionIndex + 1) / STAGE_CONFIG[currentStage as keyof typeof STAGE_CONFIG].questionCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 🔑 答题界面 - 深度优化排版 */}
                <div className="space-y-6 px-4">
                  {/* 题目文字区域 - 左对齐 + 装饰线 + 仪式感 */}
                  <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h2 className="text-lg font-normal leading-relaxed text-gray-100 text-left whitespace-pre-wrap">
                        {currentQuestion.question}
                      </h2>
                    </div>
                  </div>

                  {/* 换题按钮 - 题目卡片下方，选项上方 */}
                  <div className="max-w-2xl mx-auto flex justify-center">
                    <button
                      onClick={() => setShowRegeneratePopover(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all group text-sm"
                      title="换个问题"
                    >
                      <span className="text-base group-hover:rotate-180 transition-transform duration-300">
                        🔄
                      </span>
                      <span>换个问题</span>
                    </button>
                  </div>

                  {/* 选项区域 */}
                  <div className="max-w-2xl mx-auto space-y-3 pb-8">
                    {currentQuestion.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(option)}
                        className="w-full p-5 rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-purple-500/60 hover:bg-purple-500/5 transition-all text-left group"
                      >
                        <div className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-800/80 group-hover:bg-purple-500/20 flex items-center justify-center transition-all">
                            <span className="text-sm font-semibold text-purple-400">{option.id}</span>
                          </span>
                          <p className="flex-1 text-base text-gray-300 group-hover:text-white leading-relaxed transition-all whitespace-pre-wrap">
                            {option.text}
                          </p>
                        </div>
                      </button>
                    ))}

                    {/* 提示文字 */}
                    <p className="text-center text-gray-600 text-xs pt-4">
                      选择最接近您本能反应的选项
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}


        {/* 最终报告 */}
        {currentStage === 4 && !isLoading && report && (
          <div ref={reportContainerRef} className="space-y-6">
            {/* 报告标题 */}
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-2 bg-purple-500/20 rounded-full mb-4">
                <span className="text-purple-400 text-sm font-semibold">深度分析报告</span>
              </div>
              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                {report.core_identity.title}
              </h2>
              <p className="text-gray-500 text-sm mb-6">您的个人使用说明书</p>

              {/* 分享按钮容器 - 在截图时排除 */}
              <div className="generate-button-container">
                <button
                  onClick={handleGenerateShareCard}
                  disabled={isGeneratingImage}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isGeneratingImage ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>生成中...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">📷</span>
                      <span>生成报告长图</span>
                      <span className="text-sm opacity-75 group-hover:opacity-100 transition-opacity">
                        PNG
                      </span>
                    </>
                  )}
                </button>

                {/* 分享错误提示 */}
                {shareError && (
                  <p className="text-red-400 text-sm mt-3">{shareError}</p>
                )}
              </div>
            </div>

            {/* 1. 核心画像 */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <h3 className="text-2xl font-bold text-purple-300">核心画像</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-lg">
                {report.core_identity.description}
              </p>
            </div>

            {/* 2. 内在死结 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-red-500/30 shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-red-400">{report.inner_conflict.title}</h3>
                  <p className="text-sm text-gray-500">The Inner Conflict</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {report.inner_conflict.description}
              </p>
            </div>

            {/* 3. 行为预测 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/30 shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-2xl">🔮</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-400">{report.risk_prediction.title}</h3>
                  <p className="text-sm text-gray-500">Risk Prediction</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed">
                {report.risk_prediction.description}
              </p>
            </div>

            {/* 4. 进化路径 */}
            <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 shadow-2xl">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl">🌱</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-400">{report.evolution_path.title}</h3>
                  <p className="text-sm text-gray-500">Evolution Path</p>
                </div>
              </div>
              <div className="space-y-4">
                {report.evolution_path.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-4">
                        <span className="font-bold text-green-400">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-300 mb-2">{suggestion.label}</h4>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 答案回顾 - 在截图时排除 */}
            <div className="exclude-from-capture print:hidden">
              <AnswerReview allAnswers={allAnswers} />
            </div>

            {/* 底部说明 */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 text-center">
              <p className="text-gray-500 text-sm mb-4">
                这是一面镜子，不是一碗鸡汤。
              </p>
              <p className="text-gray-600 text-xs">
                基于 AI 深度分析 · Stage 1-3 共 {Object.values(allAnswers).flat().length} 道题 ·
                荣格心理学 + 行为经济学模型
              </p>
            </div>
          </div>
        )}

          {/* 重新生成题目弹窗 */}
          <RegeneratePopover
            isOpen={showRegeneratePopover}
            onClose={() => setShowRegeneratePopover(false)}
            onSubmit={handleRegenerate}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 动画样式 */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
