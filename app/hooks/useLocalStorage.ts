import { useState, useEffect } from 'react';

/**
 * 通用 localStorage hook
 * @param key - localStorage 键名
 * @param initialValue - 默认值
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 初始化状态
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 更新 localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // 清除数据
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue] as const;
}

/**
 * 深度之镜专用的数据管理
 */
export interface DeepMirrorData {
  version: string;
  userProfile: any;
  currentStage: number;
  questionIndex: number;
  currentQuestion: any;
  stageAnswers: any[];
  allAnswers: { [key: number]: any[] };
  feedback: string;
  report: any;
  lastUpdated: number;
}

const STORAGE_KEY = 'deep-mirror-session';
const STORAGE_VERSION = '2.0';

export function useDeepMirrorStorage() {
  const [data, setData, removeData] = useLocalStorage<DeepMirrorData | null>(STORAGE_KEY, null);

  // 保存会话数据
  const saveSession = (sessionData: Partial<DeepMirrorData>) => {
    setData((prev) => ({
      version: STORAGE_VERSION,
      userProfile: prev?.userProfile || null,
      currentStage: prev?.currentStage || 0,
      questionIndex: prev?.questionIndex || 0,
      currentQuestion: prev?.currentQuestion || null,
      stageAnswers: prev?.stageAnswers || [],
      allAnswers: prev?.allAnswers || {},
      feedback: prev?.feedback || '',
      report: prev?.report || null,
      lastUpdated: Date.now(),
      ...sessionData,
    }));
  };

  // 清除会话
  const clearSession = () => {
    removeData();
  };

  // 检查是否有保存的会话
  const hasSession = () => {
    return data !== null && data.version === STORAGE_VERSION;
  };

  // 获取会话数据
  const getSession = () => {
    if (!hasSession()) return null;
    return data;
  };

  return {
    saveSession,
    clearSession,
    hasSession,
    getSession,
  };
}
