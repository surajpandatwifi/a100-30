import { User, Bot } from 'lucide-react';
import { Message } from '../types';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
  onFileClick: (filePath: string) => void;
}

export default function MessageBubble({ message, onFileClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const renderContent = () => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: message.content.slice(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.content.length) {
      parts.push({
        type: 'text',
        content: message.content.slice(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: message.content }];
  };

  if (isSystem) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#36454F] rounded-lg border border-[#2F4F4F]">
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
        <span className="text-xs text-gray-300">{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-white'
            : 'bg-white'
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-black" /> : <Bot className="w-4 h-4 text-black" />}
      </div>

      <div className={`flex-1 space-y-2 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`rounded-lg px-4 py-3 max-w-[85%] ${
            isUser ? 'bg-[#2F4F4F] text-white' : 'bg-black border border-[#2F4F4F] text-white'
          }`}
        >
          {renderContent().map((part, index) =>
            part.type === 'code' ? (
              <CodeBlock
                key={index}
                code={part.content}
                language={part.language}
                onFileClick={onFileClick}
              />
            ) : (
              <div key={index} className="whitespace-pre-wrap text-sm leading-relaxed">
                {part.content}
              </div>
            )
          )}
        </div>
        <span className="text-xs text-gray-500 px-2">
          {new Date(message.created_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
