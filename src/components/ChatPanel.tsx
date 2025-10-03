import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Plus, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Message, ChatSession } from '../types';
import MessageBubble from './MessageBubble';

interface ChatPanelProps {
  onFileSelect: (filePath: string) => void;
}

export default function ChatPanel({ onFileSelect }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    if (currentSession) {
      loadMessages();
      subscribeToMessages();
    }
  }, [currentSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSession = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        title: 'New Chat Session',
        model_provider: 'openai',
        model_name: 'gpt-4',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return;
    }

    setCurrentSession(data);
  };

  const loadMessages = async () => {
    if (!currentSession) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', currentSession.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    if (!currentSession) return;

    const channel = supabase
      .channel(`messages:${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!input.trim() || !currentSession || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    const { error } = await supabase.from('messages').insert({
      session_id: currentSession.id,
      role: 'user',
      content: userMessage,
      metadata: {},
    });

    if (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      return;
    }

    setTimeout(async () => {
      await supabase.from('messages').insert({
        session_id: currentSession.id,
        role: 'assistant',
        content: `I received your message: "${userMessage}"\n\nIn the full implementation, I would:\n1. Parse your Unity project structure\n2. Generate appropriate code/modifications\n3. Show you a detailed plan\n4. Execute changes with your approval\n\nThis is the Stage 1 preview. AI integration comes in Stage 4!`,
        metadata: { preview: true },
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleNewChat = () => {
    initializeSession();
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
        <h2 className="text-sm font-medium text-slate-300">Chat</h2>
        <button
          onClick={handleNewChat}
          className="p-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-white"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Welcome to Shunya</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
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
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe what you want to build or modify..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-2"
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
