import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, ChatSession } from '../types';
import { useProjects } from '../hooks/useProjects';
import { useSessionRecovery } from '../hooks/useSessionRecovery';
import { ApiService } from '../services/api';
import { Storage } from '../utils/storage';

interface AppContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  currentSession: ChatSession | null;
  setCurrentSession: (session: ChatSession | null) => void;
  projects: Project[];
  createNewSession: (projectId?: string) => Promise<ChatSession | null>;
  hasRecoverableSession: boolean;
  recoverSession: () => void;
  dismissRecovery: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const { projects } = useProjects();
  const { recoveryState, recoverSession: doRecover, dismissRecovery } = useSessionRecovery();

  useEffect(() => {
    const lastProjectId = Storage.getLastProjectId();
    if (lastProjectId && projects.length > 0) {
      const project = projects.find((p) => p.id === lastProjectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projects]);

  const createNewSession = async (projectId?: string): Promise<ChatSession | null> => {
    const session = await ApiService.createChatSession({
      project_id: projectId || currentProject?.id || null,
      title: 'New Session',
      model_provider: localStorage.getItem('selected_provider') || 'openai',
      model_name: 'gpt-4',
      status: 'active',
    });

    if (session) {
      setCurrentSession(session);
      Storage.setLastSessionId(session.id);
    }

    return session;
  };

  const recoverSession = () => {
    const session = doRecover();
    if (session) {
      setCurrentSession(session);
    }
  };

  const handleSetCurrentProject = (project: Project | null) => {
    setCurrentProject(project);
    if (project) {
      Storage.setLastProjectId(project.id);
    } else {
      Storage.clearLastProjectId();
    }
  };

  const handleSetCurrentSession = (session: ChatSession | null) => {
    setCurrentSession(session);
    if (session) {
      Storage.setLastSessionId(session.id);
    } else {
      Storage.clearLastSessionId();
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentProject,
        setCurrentProject: handleSetCurrentProject,
        currentSession,
        setCurrentSession: handleSetCurrentSession,
        projects,
        createNewSession,
        hasRecoverableSession: recoveryState.hasRecoverableSession,
        recoverSession,
        dismissRecovery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
