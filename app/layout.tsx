import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "深度之镜 - The Deep Mirror",
  description: "比你自己更懂你的 AI 深度自我察觉工具",
  // 🔑 PWA Manifest
  manifest: "/manifest.json",
  // 🔑 Apple iOS PWA 配置
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "深度之镜",
  },
  // 🔑 Open Graph (社交媒体分享)
  openGraph: {
    title: "深度之镜 - The Deep Mirror",
    description: "比你自己更懂你的 AI 深度自我察觉工具",
    type: "website",
    locale: "zh_CN",
  },
};

// 🔑 移动端优化：禁止缩放、刘海屏适配、主题颜色
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // 刘海屏适配
  themeColor: "#0f172a", // 主题颜色
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased safe-area-container">
        {children}
      </body>
    </html>
  );
}
