"use client";

import { forwardRef } from "react";

interface ShareCardProps {
  coreTitle: string;
  coreDescription: string;
  userName?: string;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ coreTitle, coreDescription, userName }, ref) => {
    return (
      <div
        ref={ref}
        className="relative w-[1080px] h-[1350px] bg-gradient-to-br from-gray-900 via-purple-900/50 to-black overflow-hidden"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl" />
        </div>

        {/* 内容区域 */}
        <div className="relative h-full flex flex-col justify-between p-16">
          {/* 顶部 Logo 和标识 */}
          <div className="text-center">
            <div className="inline-block">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
                深度之镜
              </h1>
              <p className="text-2xl text-gray-400 tracking-widest">THE DEEP MIRROR</p>
            </div>
          </div>

          {/* 中间核心内容 */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-12 py-12">
            {/* 装饰线 */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

            {/* 核心标题 */}
            <div className="text-center space-y-6 max-w-4xl">
              <div className="inline-block px-8 py-3 bg-purple-500/20 rounded-full border border-purple-400/30 backdrop-blur-sm">
                <span className="text-purple-300 text-xl font-semibold">我的核心画像</span>
              </div>

              <h2 className="text-6xl font-bold text-white leading-tight px-8">
                {coreTitle}
              </h2>

              <p className="text-2xl text-gray-300 leading-relaxed px-12 line-clamp-4">
                {coreDescription.slice(0, 120)}
                {coreDescription.length > 120 ? "..." : ""}
              </p>
            </div>

            {/* 装饰线 */}
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent" />
          </div>

          {/* 底部信息 */}
          <div className="flex items-end justify-between">
            {/* 左侧用户信息 */}
            <div className="space-y-3">
              {userName && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <p className="text-2xl text-gray-300">{userName}</p>
                </div>
              )}
              <p className="text-xl text-gray-500">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* 右侧二维码 */}
            <div className="flex flex-col items-center gap-4">
              {/* 二维码占位 - 可以替换为实际的二维码 */}
              <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  <p className="text-4xl mb-2">🔮</p>
                  <p className="text-xs text-gray-600 font-semibold">扫码体验</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">AI 深度自我察觉工具</p>
            </div>
          </div>

          {/* 底部标语 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <p className="text-lg text-gray-500 text-center">
              这是一面镜子，不是一碗鸡汤
            </p>
          </div>
        </div>

        {/* 边框装饰 */}
        <div className="absolute inset-0 border-8 border-purple-500/20 rounded-3xl pointer-events-none" />

        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";

export default ShareCard;
