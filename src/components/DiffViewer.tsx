import React from 'react';
import { FileDiff, DiffLine } from '../services/ai/diffGenerator';
import { FileText, Plus, Minus, CreditCard as Edit } from 'lucide-react';

interface DiffViewerProps {
  diff: FileDiff;
  mode?: 'unified' | 'split';
}

export function DiffViewer({ diff, mode = 'unified' }: DiffViewerProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="font-mono text-sm text-gray-900">{diff.filePath}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <Plus className="w-3 h-3" />
              {diff.stats.additions}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <Minus className="w-3 h-3" />
              {diff.stats.deletions}
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <Edit className="w-3 h-3" />
              {diff.stats.changes}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {mode === 'unified' ? (
          <UnifiedDiffView diff={diff} />
        ) : (
          <SplitDiffView diff={diff} />
        )}
      </div>
    </div>
  );
}

function UnifiedDiffView({ diff }: { diff: FileDiff }) {
  return (
    <div className="font-mono text-xs">
      {diff.hunks.map((hunk, hunkIdx) => (
        <div key={hunkIdx}>
          <div className="bg-blue-50 px-4 py-1 text-blue-700 border-y border-blue-200">
            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
          </div>
          {hunk.lines.map((line, lineIdx) => (
            <DiffLineComponent key={`${hunkIdx}-${lineIdx}`} line={line} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SplitDiffView({ diff }: { diff: FileDiff }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-gray-200 font-mono text-xs">
      <div>
        <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700 border-b border-gray-200">
          Original
        </div>
        {diff.hunks.map((hunk, hunkIdx) => (
          <div key={`old-${hunkIdx}`}>
            {hunk.lines
              .filter(line => line.type !== 'added')
              .map((line, lineIdx) => (
                <SplitLineComponent
                  key={`old-${hunkIdx}-${lineIdx}`}
                  line={line}
                  side="old"
                />
              ))}
          </div>
        ))}
      </div>
      <div>
        <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700 border-b border-gray-200">
          Modified
        </div>
        {diff.hunks.map((hunk, hunkIdx) => (
          <div key={`new-${hunkIdx}`}>
            {hunk.lines
              .filter(line => line.type !== 'removed')
              .map((line, lineIdx) => (
                <SplitLineComponent
                  key={`new-${hunkIdx}-${lineIdx}`}
                  line={line}
                  side="new"
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DiffLineComponent({ line }: { line: DiffLine }) {
  const getLineStyle = () => {
    switch (line.type) {
      case 'added':
        return 'bg-green-50 text-green-900';
      case 'removed':
        return 'bg-red-50 text-red-900';
      case 'modified':
        return 'bg-yellow-50 text-yellow-900';
      default:
        return 'bg-white text-gray-700';
    }
  };

  const getPrefix = () => {
    switch (line.type) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'modified':
        return '~';
      default:
        return ' ';
    }
  };

  return (
    <div className={`flex hover:bg-gray-50 ${getLineStyle()}`}>
      <span className="px-4 py-1 text-gray-400 select-none min-w-[4rem] text-right">
        {line.lineNumber}
      </span>
      <span className="px-2 py-1 select-none">{getPrefix()}</span>
      <span className="px-2 py-1 flex-1 whitespace-pre">{line.content}</span>
    </div>
  );
}

function SplitLineComponent({ line, side }: { line: DiffLine; side: 'old' | 'new' }) {
  const content = side === 'old' ? line.oldContent : line.newContent;

  if (!content && line.type === 'unchanged') {
    return null;
  }

  const getLineStyle = () => {
    if (side === 'old' && (line.type === 'removed' || line.type === 'modified')) {
      return 'bg-red-50 text-red-900';
    }
    if (side === 'new' && (line.type === 'added' || line.type === 'modified')) {
      return 'bg-green-50 text-green-900';
    }
    return 'bg-white text-gray-700';
  };

  const getPrefix = () => {
    if (side === 'old' && (line.type === 'removed' || line.type === 'modified')) {
      return '-';
    }
    if (side === 'new' && (line.type === 'added' || line.type === 'modified')) {
      return '+';
    }
    return ' ';
  };

  return (
    <div className={`flex hover:bg-gray-50 ${getLineStyle()}`}>
      <span className="px-4 py-1 text-gray-400 select-none min-w-[4rem] text-right">
        {line.lineNumber}
      </span>
      <span className="px-2 py-1 select-none">{getPrefix()}</span>
      <span className="px-2 py-1 flex-1 whitespace-pre">{content || '\u00A0'}</span>
    </div>
  );
}
