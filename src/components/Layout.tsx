import { useState } from 'react';
import { Settings, FolderTree, MessageSquare, Terminal as TerminalIcon } from 'lucide-react';
import ChatPanel from './ChatPanel';
import FileExplorer from './FileExplorer';
import FileViewer from './FileViewer';
import Terminal from './Terminal';
import SettingsModal from './SettingsModal';

export default function Layout() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeRightPanel, setActiveRightPanel] = useState<'files' | 'viewer'>('files');

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Shunya</h1>
          <span className="text-xs text-slate-400 px-2 py-1 bg-slate-800 rounded">
            Unity AI Studio
          </span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[500px] border-r border-slate-800 flex flex-col">
          <ChatPanel onFileSelect={setSelectedFile} />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col">
              <div className="h-10 border-b border-slate-800 flex items-center px-3 bg-slate-900">
                <button
                  onClick={() => setActiveRightPanel('files')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeRightPanel === 'files'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  Files
                </button>
                <button
                  onClick={() => setActiveRightPanel('viewer')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ml-2 ${
                    activeRightPanel === 'viewer'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Preview
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {activeRightPanel === 'files' ? (
                  <FileExplorer onFileSelect={setSelectedFile} />
                ) : (
                  <FileViewer filePath={selectedFile} />
                )}
              </div>
            </div>
          </div>

          <div className="h-[250px] border-t border-slate-800">
            <Terminal />
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
