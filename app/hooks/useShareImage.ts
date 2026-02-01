import { useState, RefObject } from "react";
import { toPng } from "html-to-image";

export const useShareImage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAndDownload = async (
    elementRef: RefObject<HTMLDivElement>,
    filename?: string
  ) => {
    const node = elementRef.current;
    if (!node) {
      setError("无法找到要生成的元素");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // 等待一小段时间确保所有样式都已应用
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 🔑 关键：获取完整的滚动尺寸，并加上安全缓冲防止截断
      // 左右各增加 30px，上下各增加 30px，总共加 60px
      const targetWidth = node.scrollWidth + 60;
      const targetHeight = node.scrollHeight + 60;

      console.log(`📐 截图尺寸 (含缓冲): ${targetWidth}x${targetHeight}px`);
      console.log(`📐 原始尺寸: ${node.scrollWidth}x${node.scrollHeight}px`);

      // 生成图片，使用 filter 排除特定元素
      const dataUrl = await toPng(node, {
        quality: 1,
        pixelRatio: 2, // 2倍分辨率，确保清晰度
        cacheBust: true,
        // 🔑 显式设置宽高（加上缓冲值）
        width: targetWidth,
        height: targetHeight,
        // 过滤函数：排除不需要的元素
        filter: (domNode: HTMLElement) => {
          // 排除答案回顾组件
          if (domNode.classList && domNode.classList.contains('exclude-from-capture')) {
            return false;
          }
          // 排除生成按钮容器
          if (domNode.classList && domNode.classList.contains('generate-button-container')) {
            return false;
          }
          // 排除进度条
          if (domNode.classList && domNode.classList.contains('exclude-progress-bar')) {
            return false;
          }
          return true;
        },
        // 🔑 样式配置 - 防止内容溢出和被截断
        style: {
          backgroundColor: '#0f172a', // 深色背景
          padding: '40px', // 内边距
          width: `${targetWidth}px`, // 显式设置样式宽度
          height: `${targetHeight}px`, // 显式设置样式高度
          boxSizing: 'border-box', // 🔑 关键：防止 padding 撑破容器
          transform: 'none', // 移除可能的位移
          margin: '0', // 移除外边距
          borderRadius: '0px', // 移除圆角
          overflow: 'visible', // 确保内容可见
        },
      });

      // 创建下载链接
      const link = document.createElement("a");
      const timestamp = new Date().getTime();
      link.download = filename || `DeepMirror_Report_${timestamp}.png`;
      link.href = dataUrl;
      link.click();

      console.log("✅ 报告长图生成成功");
      return true;
    } catch (err) {
      console.error("❌ 生成图片失败:", err);
      setError("生成图片失败，请重试");
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAndDownload,
    isGenerating,
    error,
  };
};
