import { DollarSign, TrendingUp, Hash } from 'lucide-react';
import { CostEstimate, TokenUsage } from '../types/llm';

interface CostEstimatorProps {
  estimate: CostEstimate | null;
  showDetails?: boolean;
  className?: string;
}

export function CostEstimator({
  estimate,
  showDetails = true,
  className = '',
}: CostEstimatorProps) {
  if (!estimate) {
    return null;
  }

  const formatCost = (cost: number): string => {
    if (cost === 0) return 'Free';
    if (cost < 0.001) return '<$0.001';
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number): string => {
    return tokens.toLocaleString();
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-4 border border-slate-700 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-green-400" />
        <h3 className="text-sm font-semibold text-white">Cost Estimate</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Total Cost</span>
          <span className="text-lg font-bold text-green-400">
            {formatCost(estimate.totalCost)}
          </span>
        </div>

        {showDetails && (
          <>
            <div className="h-px bg-slate-700" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Prompt Cost
                </span>
                <span className="text-slate-300">{formatCost(estimate.promptCost)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Completion Cost
                </span>
                <span className="text-slate-300">{formatCost(estimate.completionCost)}</span>
              </div>
            </div>

            <div className="h-px bg-slate-700" />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Prompt Tokens
                </span>
                <span className="text-slate-300">{formatTokens(estimate.tokens.promptTokens)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Completion Tokens
                </span>
                <span className="text-slate-300">{formatTokens(estimate.tokens.completionTokens)}</span>
              </div>

              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-300 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Total Tokens
                </span>
                <span className="text-white">{formatTokens(estimate.tokens.totalTokens)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface SessionCostSummaryProps {
  costs: CostEstimate[];
  className?: string;
}

export function SessionCostSummary({ costs, className = '' }: SessionCostSummaryProps) {
  const totalCost = costs.reduce((sum, cost) => sum + cost.totalCost, 0);
  const totalTokens = costs.reduce((sum, cost) => sum + cost.tokens.totalTokens, 0);

  return (
    <div className={`bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-4 border border-slate-600 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-green-400" />
        <h3 className="text-sm font-semibold text-white">Session Summary</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-400 mb-1">Total Cost</div>
          <div className="text-2xl font-bold text-green-400">
            {totalCost === 0 ? 'Free' : `$${totalCost.toFixed(4)}`}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 mb-1">Total Tokens</div>
          <div className="text-2xl font-bold text-blue-400">
            {totalTokens.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 mb-1">Requests</div>
          <div className="text-lg font-semibold text-slate-300">
            {costs.length}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-400 mb-1">Avg Cost/Request</div>
          <div className="text-lg font-semibold text-slate-300">
            {costs.length > 0
              ? totalCost === 0
                ? 'Free'
                : `$${(totalCost / costs.length).toFixed(4)}`
              : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
