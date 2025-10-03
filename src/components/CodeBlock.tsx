import { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  onFileClick?: (filePath: string) => void;
}

export default function CodeBlock({ code, language, onFileClick }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filePathMatch = code.match(/^\/\/.+\.(cs|unity|prefab|meta)/);
  const filePath = filePathMatch ? filePathMatch[0].replace('//', '').trim() : null;

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-[#2F4F4F] bg-black">
      <div className="flex items-center justify-between px-3 py-2 bg-[#36454F] border-b border-[#2F4F4F]">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-xs text-gray-300 font-mono">{language}</span>
          {filePath && onFileClick && (
            <>
              <span className="text-gray-600">•</span>
              <button
                onClick={() => onFileClick(filePath)}
                className="text-xs text-white hover:text-gray-200 hover:underline font-medium"
              >
                {filePath}
              </button>
            </>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="px-2 py-1 bg-white text-black rounded transition-colors hover:bg-gray-200 text-xs font-medium"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="text-gray-200 font-mono">{code}</code>
      </pre>
    </div>
  );
}
