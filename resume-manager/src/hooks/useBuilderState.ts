'use client';

import { useCallback, useState } from 'react';
import type {
  PersonalInfo,
  Experience,
  Project,
  Skill,
  Education,
} from '@/lib/types';

export function useBuilderState() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');

  // Debounced save status handler
  const handleSaveStatusChange = useCallback(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => setSaveStatus('saved'), 500);
    return () => clearTimeout(timer);
  }, []);

  // Enhanced update functions with save status
  const createUpdateHandler = useCallback(
    (updateFn: Function) => (...args: any[]) => {
      updateFn(...args);
      handleSaveStatusChange();
    },
    [handleSaveStatusChange]
  );

  return {
    saveStatus,
    setSaveStatus,
    handleSaveStatusChange,
    createUpdateHandler,
  };
}
