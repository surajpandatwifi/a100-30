import { useState, useEffect } from 'react';
import { ChatSession, Message } from '../types';
import { ApiService } from '../services/api';

export function useChatSession(sessionId: string | null) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      setLoading(true);
      setError(null);

      try {
        const [sessionData, messagesData] = await Promise.all([
          ApiService.getChatSession(sessionId),
          ApiService.getMessages(sessionId),
        ]);

        setSession(sessionData);
        setMessages(messagesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const unsubscribe = ApiService.subscribeToMessages(sessionId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return unsubscribe;
  }, [sessionId]);

  const sendMessage = async (content: string, role: 'user' | 'assistant' | 'system' = 'user') => {
    if (!sessionId) return null;

    setError(null);
    const message = await ApiService.createMessage({
      session_id: sessionId,
      role,
      content,
      metadata: {},
    });

    if (!message) {
      setError('Failed to send message');
    }

    return message;
  };

  const updateSession = async (updates: Partial<ChatSession>) => {
    if (!sessionId) return null;

    setError(null);
    const updated = await ApiService.updateChatSession(sessionId, updates);

    if (updated) {
      setSession(updated);
      return updated;
    }

    setError('Failed to update session');
    return null;
  };

  return {
    session,
    messages,
    loading,
    error,
    sendMessage,
    updateSession,
  };
}
