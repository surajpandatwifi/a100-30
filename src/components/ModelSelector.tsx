import { useState } from 'react';
import { ChevronDown, Cpu, Zap, Sparkles } from 'lucide-react';
import { LLMProvider, ModelName } from '../types/llm';

interface ModelOption {
  provider: LLMProvider;
  model: ModelName;
  displayName: string;
  description: string;
  icon: typeof Cpu;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    description: 'Fast, multimodal flagship model',
    icon: Sparkles,
  },
  {
    provider: 'openai',
    model: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    description: 'Most capable OpenAI model',
    icon: Zap,
  },
  {
    provider: 'openai',
    model: 'gpt-4',
    displayName: 'GPT-4',
    description: 'Reliable and powerful',
    icon: Cpu,
  },
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    description: 'Fast and affordable',
    icon: Zap,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    description: 'Best Claude model for most tasks',
    icon: Sparkles,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    description: 'Most powerful Claude model',
    icon: Cpu,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    displayName: 'Claude 3 Sonnet',
    description: 'Balanced performance',
    icon: Zap,
  },
  {
    provider: 'google',
    model: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash',
    description: 'Experimental, blazing fast',
    icon: Zap,
  },
  {
    provider: 'google',
    model: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Advanced reasoning',
    icon: Sparkles,
  },
  {
    provider: 'google',
    model: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Fast and efficient',
    icon: Zap,
  },
];

interface ModelSelectorProps {
  selectedProvider: LLMProvider;
  selectedModel: ModelName;
  onModelChange: (provider: LLMProvider, model: ModelName) => void;
  availableProviders: LLMProvider[];
  disabled?: boolean;
}

export function ModelSelector({
  selectedProvider,
  selectedModel,
  onModelChange,
  availableProviders,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = MODEL_OPTIONS.find(
    opt => opt.provider === selectedProvider && opt.model === selectedModel
  );

  const filteredOptions = MODEL_OPTIONS.filter(opt =>
    availableProviders.includes(opt.provider)
  );

  const groupedOptions = filteredOptions.reduce((acc, option) => {
    if (!acc[option.provider]) {
      acc[option.provider] = [];
    }
    acc[option.provider].push(option);
    return acc;
  }, {} as Record<LLMProvider, ModelOption[]>);

  const providerLabels: Record<LLMProvider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google AI',
  };

  const handleSelect = (option: ModelOption) => {
    onModelChange(option.provider, option.model);
    setIsOpen(false);
  };

  if (!selectedOption) {
    return null;
  }

  const Icon = selectedOption.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon className="w-4 h-4" />
        <span className="font-medium">{selectedOption.displayName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-xl z-20 border border-slate-700 max-h-96 overflow-y-auto">
            {Object.entries(groupedOptions).map(([provider, options]) => (
              <div key={provider} className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {providerLabels[provider as LLMProvider]}
                </div>
                {options.map(option => {
                  const OptionIcon = option.icon;
                  const isSelected =
                    option.provider === selectedProvider &&
                    option.model === selectedModel;

                  return (
                    <button
                      key={`${option.provider}-${option.model}`}
                      onClick={() => handleSelect(option)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${
                        isSelected ? 'bg-slate-700' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <OptionIcon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                            {option.displayName}
                          </div>
                          <div className="text-sm text-slate-400">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
