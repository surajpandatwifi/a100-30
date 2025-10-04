import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight, FileCode, FolderPlus, Trash2, Move } from 'lucide-react';
import { ExecutionPlan, FileOperation } from '../services/ai/executionPlanner';

interface ExecutionPlanViewerProps {
  plan: ExecutionPlan;
  onApprove?: (plan: ExecutionPlan) => void;
  onReject?: (plan: ExecutionPlan) => void;
  onModify?: (plan: ExecutionPlan) => void;
  readonly?: boolean;
}

export function ExecutionPlanViewer({
  plan,
  onApprove,
  onReject,
  onModify,
  readonly = false
}: ExecutionPlanViewerProps) {
  const [expandedOps, setExpandedOps] = useState<Set<string>>(new Set());

  const toggleOperation = (opId: string) => {
    setExpandedOps(prev => {
      const next = new Set(prev);
      if (next.has(opId)) {
        next.delete(opId);
      } else {
        next.add(opId);
      }
      return next;
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'executing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'rolled_back': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'create_file': return <FileCode className="w-4 h-4" />;
      case 'modify_file': return <FileText className="w-4 h-4" />;
      case 'delete_file': return <Trash2 className="w-4 h-4" />;
      case 'rename_file': return <Move className="w-4 h-4" />;
      case 'create_directory': return <FolderPlus className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{plan.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                {plan.status}
              </span>
            </div>
            <p className="text-gray-600">{plan.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Est. {Math.ceil(plan.estimatedDuration / 60)} min
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {plan.operations.length} operations
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {plan.risks.length} risks identified
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {plan.prerequisites.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Prerequisites</h3>
            <ul className="space-y-1">
              {plan.prerequisites.map((prereq, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{prereq}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Operations</h3>
          <div className="space-y-2">
            {plan.operations.map((op, idx) => (
              <OperationCard
                key={op.id}
                operation={op}
                index={idx}
                expanded={expandedOps.has(op.id)}
                onToggle={() => toggleOperation(op.id)}
                getRiskColor={getRiskColor}
                getOperationIcon={getOperationIcon}
              />
            ))}
          </div>
        </div>

        {plan.risks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Risks</h3>
            <ul className="space-y-1">
              {plan.risks.map((risk, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {plan.successCriteria.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Success Criteria</h3>
            <ul className="space-y-1">
              {plan.successCriteria.map((criteria, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{criteria}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Rollback Strategy</h3>
          <p className="text-sm text-gray-600">{plan.rollbackStrategy}</p>
        </div>
      </div>

      {!readonly && plan.status === 'draft' && (
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          {onReject && (
            <button
              onClick={() => onReject(plan)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reject
            </button>
          )}
          {onModify && (
            <button
              onClick={() => onModify(plan)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Modify
            </button>
          )}
          {onApprove && (
            <button
              onClick={() => onApprove(plan)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Approve & Execute
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface OperationCardProps {
  operation: FileOperation;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  getRiskColor: (risk: string) => string;
  getOperationIcon: (type: string) => React.ReactNode;
}

function OperationCard({
  operation,
  index,
  expanded,
  onToggle,
  getRiskColor,
  getOperationIcon
}: OperationCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-medium flex items-center justify-center">
            {index + 1}
          </span>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            {getOperationIcon(operation.type)}
            <span className="font-medium text-gray-900">{operation.description}</span>
            <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${getRiskColor(operation.estimatedRisk)}`}>
              {operation.estimatedRisk} risk
            </span>
          </div>
          <p className="text-sm text-gray-500">{operation.targetPath}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 bg-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Type</p>
            <p className="text-sm text-gray-600">{operation.type}</p>
          </div>

          {operation.newPath && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">New Path</p>
              <p className="text-sm text-gray-600">{operation.newPath}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Reasoning</p>
            <p className="text-sm text-gray-600">{operation.reasoning}</p>
          </div>

          {operation.dependencies.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Dependencies</p>
              <ul className="text-sm text-gray-600">
                {operation.dependencies.map((dep, idx) => (
                  <li key={idx}>• {dep}</li>
                ))}
              </ul>
            </div>
          )}

          {operation.content && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Content Preview</p>
              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto max-h-48">
                {operation.content.substring(0, 500)}
                {operation.content.length > 500 ? '...' : ''}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
