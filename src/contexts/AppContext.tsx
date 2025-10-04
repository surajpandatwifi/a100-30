import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, ChatSession } from '../types';
import { LLMProvider, ModelName } from '../types/llm';
import { useProjects } from '../hooks/useProjects';
import { useSessionRecovery } from '../hooks/useSessionRecovery';
import { ApiService } from '../services/api';
import { Storage } from '../utils/storage';
import { LLMService } from '../services/llm/llmService';

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
  llmService: LLMService | null;
  selectedProvider: LLMProvider;
  selectedModel: ModelName;
  setSelectedProvider: (provider: LLMProvider) => void;
  setSelectedModel: (model: ModelName) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [selectedModel, setSelectedModel] = useState<ModelName>('gpt-4o');
  const [llmService, setLlmService] = useState<LLMService | null>(null);
  const { projects } = useProjects();
  const { recoveryState, recoverSession: doRecover, dismissRecovery } = useSessionRecovery();

  useEffect(() => {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const googleKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;

    const service = new LLMService({
      openai: openaiKey && openaiKey !== 'your_openai_api_key_here' ? openaiKey : undefined,
      anthropic: anthropicKey && anthropicKey !== 'your_anthropic_api_key_here' ? anthropicKey : undefined,
      google: googleKey && googleKey !== 'your_google_ai_api_key_here' ? googleKey : undefined,
    });

    setLlmService(service);

    const availableProviders = service.getAvailableProviders();
    if (availableProviders.length > 0 && !availableProviders.includes(selectedProvider)) {
      setSelectedProvider(availableProviders[0]);
    }
  }, []);

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
      model_provider: selectedProvider as 'openai' | 'claude' | 'gemini' | 'codex',
      model_name: selectedModel,
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
        llmService,
        selectedProvider,
        selectedModel,
        setSelectedProvider,
        setSelectedModel,
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
