import { useState } from 'react';
import { Settings, FolderTree, MessageSquare, Terminal as TerminalIcon, Boxes } from 'lucide-react';
import ChatPanel from './ChatPanel';
import FileExplorer from './FileExplorer';
import FileViewer from './FileViewer';
import Terminal from './Terminal';
import SettingsModal from './SettingsModal';
import UnityAnalysisView from './UnityAnalysisView';

export default function Layout() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeRightPanel, setActiveRightPanel] = useState<'files' | 'viewer' | 'unity'>('unity');

  return (
    <div className="h-screen flex flex-col bg-black">
      <header className="h-14 border-b border-[#2F4F4F] flex items-center justify-between px-4 bg-[#2F4F4F]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-bold text-sm">S</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Shunya</h1>
          <span className="text-xs text-gray-300 px-2 py-1 bg-[#36454F] rounded">
            Unity AI Studio
          </span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="px-4 py-2 bg-white text-black rounded-lg transition-colors hover:bg-gray-200 font-medium text-sm"
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[500px] border-r border-[#2F4F4F] flex flex-col">
          <ChatPanel onFileSelect={setSelectedFile} />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col">
              <div className="h-10 border-b border-[#2F4F4F] flex items-center px-3 bg-[#36454F]">
                <button
                  onClick={() => setActiveRightPanel('unity')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeRightPanel === 'unity'
                      ? 'bg-white text-black font-medium'
                      : 'text-gray-300 hover:text-white hover:bg-[#2F4F4F]'
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  Unity Analysis
                </button>
                <button
                  onClick={() => setActiveRightPanel('files')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ml-2 ${
                    activeRightPanel === 'files'
                      ? 'bg-white text-black font-medium'
                      : 'text-gray-300 hover:text-white hover:bg-[#2F4F4F]'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  Files
                </button>
                <button
                  onClick={() => setActiveRightPanel('viewer')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ml-2 ${
                    activeRightPanel === 'viewer'
                      ? 'bg-white text-black font-medium'
                      : 'text-gray-300 hover:text-white hover:bg-[#2F4F4F]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Preview
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {activeRightPanel === 'unity' && <UnityAnalysisView />}
                {activeRightPanel === 'files' && <FileExplorer onFileSelect={setSelectedFile} />}
                {activeRightPanel === 'viewer' && <FileViewer filePath={selectedFile} />}
              </div>
            </div>
          </div>

          <div className="h-[250px] border-t border-[#2F4F4F]">
            <Terminal />
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
