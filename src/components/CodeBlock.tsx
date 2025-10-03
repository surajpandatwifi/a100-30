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
    <div className="my-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">{language}</span>
          {filePath && onFileClick && (
            <>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => onFileClick(filePath)}
                className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                {filePath}
              </button>
            </>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
        <code className="text-slate-200 font-mono">{code}</code>
      </pre>
    </div>
  );
}
