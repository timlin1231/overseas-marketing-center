
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAuditHistory } from '../services/SeoService';
import { getAiAuditHistory } from '../services/AiSeoService';

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  // SEO Audit State
  const [seoAuditState, setSeoAuditState] = useState({
    loading: false,
    progress: 0,
    result: null,
    error: null,
    domain: '',
    history: []
  });

  // AI SEO Audit State
  const [aiAuditState, setAiAuditState] = useState({
    loading: false,
    progress: 0,
    result: null,
    error: null,
    domain: '',
    history: []
  });

  // Load History on Mount
  useEffect(() => {
    const loadHistories = async () => {
      try {
        const seoHistory = await getAuditHistory();
        setSeoAuditState(prev => ({ ...prev, history: seoHistory }));

        const aiHistory = await getAiAuditHistory();
        setAiAuditState(prev => ({ ...prev, history: aiHistory }));
      } catch (e) {
        console.error('Failed to load histories:', e);
      }
    };
    loadHistories();
  }, []);

  const updateSeoAudit = useCallback((updates) => {
    setSeoAuditState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateAiAudit = useCallback((updates) => {
    setAiAuditState(prev => ({ ...prev, ...updates }));
  }, []);

  const refreshSeoHistory = useCallback(async () => {
    const history = await getAuditHistory();
    setSeoAuditState(prev => ({ ...prev, history }));
  }, []);

  const refreshAiHistory = useCallback(async () => {
    const history = await getAiAuditHistory();
    setAiAuditState(prev => ({ ...prev, history }));
  }, []);

  const value = {
    seoAuditState,
    updateSeoAudit,
    refreshSeoHistory,
    aiAuditState,
    updateAiAudit,
    refreshAiHistory
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
