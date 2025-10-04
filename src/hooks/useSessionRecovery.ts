import { useState, useEffect } from 'react';
import { ChatSession } from '../types';
import { ApiService } from '../services/api';
import { Storage } from '../utils/storage';

interface RecoveryState {
  hasRecoverableSession: boolean;
  sessionId: string | null;
  session: ChatSession | null;
  unsavedInput: string | null;
}

export function useSessionRecovery() {
  const [recoveryState, setRecoveryState] = useState<RecoveryState>({
    hasRecoverableSession: false,
    sessionId: null,
    session: null,
    unsavedInput: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForRecoverableSession();
  }, []);

  const checkForRecoverableSession = async () => {
    setLoading(true);

    const lastSessionId = Storage.getLastSessionId();
    const unsavedInput = Storage.getUnsavedInput();

    if (!lastSessionId) {
      setLoading(false);
      return;
    }

    const session = await ApiService.getChatSession(lastSessionId);

    if (session && session.status === 'active') {
      setRecoveryState({
        hasRecoverableSession: true,
        sessionId: lastSessionId,
        session,
        unsavedInput,
      });
    } else {
      Storage.clearLastSessionId();
      Storage.clearUnsavedInput();
    }

    setLoading(false);
  };

  const recoverSession = (): ChatSession | null => {
    if (!recoveryState.session) return null;

    return recoveryState.session;
  };

  const dismissRecovery = () => {
    Storage.clearLastSessionId();
    Storage.clearUnsavedInput();
    setRecoveryState({
      hasRecoverableSession: false,
      sessionId: null,
      session: null,
      unsavedInput: null,
    });
  };

  const saveCurrentSession = (sessionId: string, input?: string) => {
    Storage.setLastSessionId(sessionId);
    if (input) {
      Storage.setUnsavedInput(input);
    } else {
      Storage.clearUnsavedInput();
    }
  };

  return {
    recoveryState,
    loading,
    recoverSession,
    dismissRecovery,
    saveCurrentSession,
    refresh: checkForRecoverableSession,
  };
}
