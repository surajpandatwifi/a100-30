import { useState } from 'react';
import { X, Key, Save, Brain } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [apiKeys, setApiKeys] = useState({
    openai: localStorage.getItem('openai_key') || '',
    claude: localStorage.getItem('claude_key') || '',
    gemini: localStorage.getItem('gemini_key') || '',
  });

  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'claude' | 'gemini'>(
    (localStorage.getItem('selected_provider') as any) || 'openai'
  );

  const handleSave = () => {
    Object.entries(apiKeys).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(`${key}_key`, value);
      }
    });
    localStorage.setItem('selected_provider', selectedProvider);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#2F4F4F] rounded-xl shadow-2xl w-full max-w-2xl border border-[#36454F]">
        <div className="flex items-center justify-between p-6 border-b border-[#36454F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
              <Key className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <p className="text-sm text-gray-300">Configure AI providers and API keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-2 bg-white text-black rounded-lg transition-colors hover:bg-gray-200 font-medium"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              <Brain className="w-4 h-4 inline mr-2" />
              Preferred AI Provider
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'openai', name: 'OpenAI', desc: 'GPT-4 Turbo' },
                { id: 'claude', name: 'Anthropic', desc: 'Claude 3.5' },
                { id: 'gemini', name: 'Google', desc: 'Gemini 2.0' },
              ].map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id as any)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedProvider === provider.id
                      ? 'border-white bg-white text-black'
                      : 'border-[#36454F] bg-black hover:border-white text-white'
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    selectedProvider === provider.id ? 'text-black' : 'text-white'
                  }`}>{provider.name}</div>
                  <div className={`text-xs mt-1 ${
                    selectedProvider === provider.id ? 'text-gray-700' : 'text-gray-400'
                  }`}>{provider.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-white mb-2">API Keys</label>

            <div>
              <label className="block text-xs text-gray-300 mb-1.5">OpenAI API Key</label>
              <input
                type="password"
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-black border border-[#36454F] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1.5">Anthropic API Key</label>
              <input
                type="password"
                value={apiKeys.claude}
                onChange={(e) => setApiKeys({ ...apiKeys, claude: e.target.value })}
                placeholder="sk-ant-..."
                className="w-full bg-black border border-[#36454F] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1.5">Google AI API Key</label>
              <input
                type="password"
                value={apiKeys.gemini}
                onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                placeholder="AIza..."
                className="w-full bg-black border border-[#36454F] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>

          <div className="bg-black border border-[#36454F] rounded-lg p-4">
            <p className="text-xs text-gray-300 leading-relaxed">
              Your API keys are stored locally in your browser and never sent to any server except
              the respective AI provider APIs. Stage 4 will integrate these providers for actual AI
              code generation.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#36454F]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-white hover:bg-gray-200 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
