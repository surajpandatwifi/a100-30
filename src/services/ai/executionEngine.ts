import { ExecutionPlan, FileOperation } from './executionPlanner';
import { supabase } from '../../lib/supabase';

export type OperationStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';

export interface OperationResult {
  operationId: string;
  status: OperationStatus;
  result?: any;
  error?: string;
  duration: number;
  snapshotId?: string;
}

export interface ExecutionProgress {
  planId: string;
  totalOperations: number;
  completedOperations: number;
  failedOperations: number;
  currentOperation?: FileOperation;
  operationResults: OperationResult[];
  startedAt: string;
  completedAt?: string;
}

export class ExecutionEngine {
  private sessionId: string;
  private projectPath: string;
  private snapshots: Map<string, string> = new Map();

  constructor(sessionId: string, projectPath: string) {
    this.sessionId = sessionId;
    this.projectPath = projectPath;
  }

  async executePlan(
    plan: ExecutionPlan,
    onProgress?: (progress: ExecutionProgress) => void
  ): Promise<ExecutionProgress> {
    const progress: ExecutionProgress = {
      planId: plan.id,
      totalOperations: plan.operations.length,
      completedOperations: 0,
      failedOperations: 0,
      operationResults: [],
      startedAt: new Date().toISOString()
    };

    try {
      for (const operation of plan.operations) {
        progress.currentOperation = operation;
        onProgress?.(progress);

        const result = await this.executeOperation(operation, plan);
        progress.operationResults.push(result);

        if (result.status === 'completed') {
          progress.completedOperations++;
        } else if (result.status === 'failed') {
          progress.failedOperations++;
          throw new Error(`Operation failed: ${result.error}`);
        }

        onProgress?.(progress);
      }

      progress.completedAt = new Date().toISOString();
      await this.savePlanExecution(plan.id, progress);

      return progress;
    } catch (error) {
      progress.completedAt = new Date().toISOString();
      await this.savePlanExecution(plan.id, progress);
      throw error;
    }
  }

  private async executeOperation(
    operation: FileOperation,
    plan: ExecutionPlan
  ): Promise<OperationResult> {
    const startTime = Date.now();

    try {
      let snapshotId: string | undefined;

      if (operation.type === 'modify_file' || operation.type === 'delete_file') {
        snapshotId = await this.createSnapshot(operation.targetPath);
      }

      switch (operation.type) {
        case 'create_file':
          await this.createFile(operation);
          break;
        case 'modify_file':
          await this.modifyFile(operation);
          break;
        case 'delete_file':
          await this.deleteFile(operation);
          break;
        case 'rename_file':
          await this.renameFile(operation);
          break;
        case 'create_directory':
          await this.createDirectory(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      const duration = Date.now() - startTime;

      await this.logOperation(operation, 'success', duration);

      return {
        operationId: operation.id,
        status: 'completed',
        duration,
        snapshotId
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logOperation(operation, 'failed', duration, errorMessage);

      return {
        operationId: operation.id,
        status: 'failed',
        error: errorMessage,
        duration
      };
    }
  }

  private async createSnapshot(filePath: string): Promise<string> {
    try {
      const content = await this.readFile(filePath);
      const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.snapshots.set(snapshotId, content);

      const { error } = await supabase
        .from('file_snapshots')
        .insert({
          session_id: this.sessionId,
          file_path: filePath,
          content_before: content,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      return snapshotId;
    } catch (error) {
      console.error('Failed to create snapshot:', error);
      return '';
    }
  }

  private async readFile(filePath: string): Promise<string> {
    return '';
  }

  private async createFile(operation: FileOperation): Promise<void> {
    const fullPath = `${this.projectPath}/${operation.targetPath}`;

    console.log(`Creating file: ${fullPath}`);
    console.log(`Content length: ${operation.content?.length || 0} characters`);
  }

  private async modifyFile(operation: FileOperation): Promise<void> {
    const fullPath = `${this.projectPath}/${operation.targetPath}`;

    console.log(`Modifying file: ${fullPath}`);
    console.log(`New content length: ${operation.content?.length || 0} characters`);
  }

  private async deleteFile(operation: FileOperation): Promise<void> {
    const fullPath = `${this.projectPath}/${operation.targetPath}`;

    console.log(`Deleting file: ${fullPath}`);
  }

  private async renameFile(operation: FileOperation): Promise<void> {
    const fullPath = `${this.projectPath}/${operation.targetPath}`;
    const newFullPath = `${this.projectPath}/${operation.newPath}`;

    console.log(`Renaming file: ${fullPath} -> ${newFullPath}`);
  }

  private async createDirectory(operation: FileOperation): Promise<void> {
    const fullPath = `${this.projectPath}/${operation.targetPath}`;

    console.log(`Creating directory: ${fullPath}`);
  }

  private async logOperation(
    operation: FileOperation,
    status: string,
    duration: number,
    error?: string
  ): Promise<void> {
    await supabase
      .from('execution_logs')
      .insert({
        session_id: this.sessionId,
        action_type: operation.type,
        target_path: operation.targetPath,
        status,
        details: {
          operationId: operation.id,
          description: operation.description,
          duration,
          error
        },
        created_at: new Date().toISOString()
      });
  }

  private async savePlanExecution(
    planId: string,
    progress: ExecutionProgress
  ): Promise<void> {
    await supabase
      .from('plan_executions')
      .insert({
        plan_id: planId,
        session_id: this.sessionId,
        total_operations: progress.totalOperations,
        completed_operations: progress.completedOperations,
        failed_operations: progress.failedOperations,
        operation_results: progress.operationResults,
        started_at: progress.startedAt,
        completed_at: progress.completedAt,
        created_at: new Date().toISOString()
      });
  }

  async rollbackOperation(
    operationResult: OperationResult
  ): Promise<void> {
    if (!operationResult.snapshotId) {
      throw new Error('No snapshot available for rollback');
    }

    const content = this.snapshots.get(operationResult.snapshotId);
    if (!content) {
      throw new Error('Snapshot content not found');
    }

    console.log(`Rolling back operation ${operationResult.operationId}`);
  }

  async rollbackPlan(
    progress: ExecutionProgress
  ): Promise<void> {
    const completedOps = progress.operationResults
      .filter(r => r.status === 'completed')
      .reverse();

    for (const result of completedOps) {
      try {
        await this.rollbackOperation(result);
      } catch (error) {
        console.error(`Failed to rollback operation ${result.operationId}:`, error);
      }
    }
  }

  async getExecutionHistory(planId: string): Promise<ExecutionProgress | null> {
    const { data, error } = await supabase
      .from('plan_executions')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      planId: data.plan_id,
      totalOperations: data.total_operations,
      completedOperations: data.completed_operations,
      failedOperations: data.failed_operations,
      operationResults: data.operation_results,
      startedAt: data.started_at,
      completedAt: data.completed_at
    };
  }
}
