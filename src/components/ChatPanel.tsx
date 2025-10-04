import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Plus, MessageSquare, RefreshCw } from 'lucide-react';
import { useChatSession } from '../hooks/useChatSession';
import { useApp } from '../contexts/AppContext';
import { Storage } from '../utils/storage';
import MessageBubble from './MessageBubble';

interface ChatPanelProps {
  onFileSelect: (filePath: string) => void;
}

export default function ChatPanel({ onFileSelect }: ChatPanelProps) {
  const { currentSession, createNewSession, hasRecoverableSession, recoverSession, dismissRecovery } = useApp();
  const { messages, sendMessage, loading: sessionLoading } = useChatSession(currentSession?.id || null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasRecoverableSession) {
      setShowRecovery(true);
    } else if (!currentSession) {
      handleNewChat();
    }
  }, []);

  useEffect(() => {
    const unsavedInput = Storage.getUnsavedInput();
    if (unsavedInput) {
      setInput(unsavedInput);
      Storage.clearUnsavedInput();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (input) {
      Storage.setUnsavedInput(input);
    } else {
      Storage.clearUnsavedInput();
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !currentSession || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    await sendMessage(userMessage, 'user');

    setTimeout(async () => {
      await sendMessage(
        `I received your message: "${userMessage}"\n\nIn the full implementation, I would:\n1. Parse your Unity project structure\n2. Generate appropriate code/modifications\n3. Show you a detailed plan\n4. Execute changes with your approval\n\nThis is Stage 2 with full database persistence!`,
        'assistant'
      );
      setIsLoading(false);
    }, 1000);
  };

  const handleNewChat = async () => {
    await createNewSession();
    setInput('');
  };

  const handleRecover = () => {
    recoverSession();
    setShowRecovery(false);
  };

  const handleDismissRecovery = () => {
    dismissRecovery();
    setShowRecovery(false);
    handleNewChat();
  };

  return (
    <div className="flex flex-col h-full bg-[#36454F]">
      <div className="h-12 border-b border-[#2F4F4F] flex items-center justify-between px-4">
        <h2 className="text-sm font-medium text-white">Chat</h2>
        <button
          onClick={handleNewChat}
          className="px-3 py-1.5 bg-white text-black rounded-md transition-colors hover:bg-gray-200 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showRecovery && (
        <div className="m-4 p-4 bg-[#2F4F4F] border border-white rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-white" />
              <div>
                <p className="text-sm font-medium text-white">Resume Previous Session</p>
                <p className="text-xs text-gray-300 mt-1">
                  You have an unfinished session. Would you like to continue?
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDismissRecovery}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleRecover}
                className="px-4 py-1.5 bg-white text-black rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-xl bg-white flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-lg font-semibold text-white">Welcome to Shunya</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Your AI-powered Unity development assistant. Describe what you want to build or
                modify, and I'll help you plan and execute changes safely.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} onFileClick={onFileSelect} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-[#2F4F4F]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe what you want to build or modify..."
            className="flex-1 bg-black border border-[#2F4F4F] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-white hover:bg-gray-200 disabled:bg-[#36454F] disabled:text-gray-600 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
