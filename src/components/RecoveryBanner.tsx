import { RefreshCw } from 'lucide-react';

interface RecoveryBannerProps {
  onRecover: () => void;
  onDismiss: () => void;
}

export default function RecoveryBanner({ onRecover, onDismiss }: RecoveryBannerProps) {
  return (
    <div className="m-4 p-4 bg-[#2F4F4F] border border-white rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-white" />
          <div>
            <p className="text-sm font-medium text-white">Resume Previous Session</p>
            <p className="text-xs text-gray-300 mt-1">
              You have an unfinished session. Would you like to continue where you left off?
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={onRecover}
            className="px-4 py-1.5 bg-white text-black rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
