import { LLMService } from '../llm/llmService';
import { ChatMessage, ModelConfig } from '../../types/llm';
import { ProjectContext } from './contextBuilder';
import { PromptTemplate } from './promptTemplates';

export type OperationType =
  | 'create_file'
  | 'modify_file'
  | 'delete_file'
  | 'rename_file'
  | 'create_directory';

export interface FileOperation {
  id: string;
  type: OperationType;
  targetPath: string;
  description: string;
  content?: string;
  newPath?: string;
  dependencies: string[];
  estimatedRisk: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface ExecutionPlan {
  id: string;
  title: string;
  description: string;
  operations: FileOperation[];
  estimatedDuration: number;
  risks: string[];
  prerequisites: string[];
  successCriteria: string[];
  rollbackStrategy: string;
  createdAt: string;
  status: 'draft' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed' | 'rolled_back';
}

export interface PlanningResult {
  plan: ExecutionPlan;
  rawResponse: string;
  confidence: number;
}

export class ExecutionPlanner {
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  async generatePlan(
    taskDescription: string,
    context: ProjectContext,
    template: PromptTemplate,
    modelConfig: ModelConfig
  ): Promise<PlanningResult> {
    const systemPrompt = this.buildPlanningSystemPrompt();
    const userPrompt = this.buildPlanningUserPrompt(taskDescription, context, template);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await this.llmService.chat(messages, modelConfig);
      const plan = this.parsePlanFromResponse(response.content, taskDescription);

      return {
        plan,
        rawResponse: response.content,
        confidence: this.calculateConfidence(plan, response.content)
      };
    } catch (error) {
      throw new Error(`Failed to generate execution plan: ${error}`);
    }
  }

  private buildPlanningSystemPrompt(): string {
    return `You are an AI planning assistant for Unity game development. Your role is to create detailed, step-by-step execution plans for code generation and file operations.

CRITICAL REQUIREMENTS:
1. Generate plans in valid JSON format
2. Break down complex tasks into atomic file operations
3. Identify dependencies between operations
4. Assess risk levels for each operation
5. Provide clear reasoning for each step
6. Include rollback strategies
7. Define success criteria

OPERATION TYPES:
- create_file: Create a new file with content
- modify_file: Modify an existing file
- delete_file: Delete a file
- rename_file: Rename or move a file
- create_directory: Create a new directory

RISK ASSESSMENT:
- low: New files, isolated changes
- medium: Modifications to existing files, refactoring
- high: Deletions, renames, changes affecting multiple files

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "title": "Brief plan title",
  "description": "Detailed description of what this plan accomplishes",
  "operations": [
    {
      "type": "operation_type",
      "targetPath": "path/to/file",
      "description": "What this operation does",
      "content": "File content (for create/modify)",
      "newPath": "new/path (for rename)",
      "dependencies": ["id_of_operation_this_depends_on"],
      "estimatedRisk": "low|medium|high",
      "reasoning": "Why this operation is necessary"
    }
  ],
  "estimatedDuration": 300,
  "risks": ["List of potential risks"],
  "prerequisites": ["Things that must be true before execution"],
  "successCriteria": ["How to verify success"],
  "rollbackStrategy": "How to undo changes if something fails"
}`;
  }

  private buildPlanningUserPrompt(
    taskDescription: string,
    context: ProjectContext,
    template: PromptTemplate
  ): string {
    return `Create an execution plan for the following task:

TASK: ${taskDescription}

PROJECT CONTEXT:
${JSON.stringify(context.projectInfo, null, 2)}

RELEVANT FILES:
${context.relevantFiles.map(f => `- ${f.path} (${f.type})`).join('\n')}

${context.dependencies.length > 0 ? `DEPENDENCIES:\n${context.dependencies.join('\n')}` : ''}

TEMPLATE GUIDANCE:
${template.description}
${template.userPromptTemplate({ description: taskDescription })}

Generate a detailed execution plan in JSON format.`;
  }

  private parsePlanFromResponse(response: string, taskDescription: string): ExecutionPlan {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      const operations: FileOperation[] = (parsed.operations || []).map((op: any, index: number) => ({
        id: `op_${Date.now()}_${index}`,
        type: op.type || 'modify_file',
        targetPath: op.targetPath || '',
        description: op.description || '',
        content: op.content,
        newPath: op.newPath,
        dependencies: op.dependencies || [],
        estimatedRisk: op.estimatedRisk || 'medium',
        reasoning: op.reasoning || ''
      }));

      return {
        id: `plan_${Date.now()}`,
        title: parsed.title || taskDescription.substring(0, 50),
        description: parsed.description || taskDescription,
        operations,
        estimatedDuration: parsed.estimatedDuration || 60,
        risks: parsed.risks || [],
        prerequisites: parsed.prerequisites || [],
        successCriteria: parsed.successCriteria || [],
        rollbackStrategy: parsed.rollbackStrategy || 'Manual rollback using file snapshots',
        createdAt: new Date().toISOString(),
        status: 'draft'
      };
    } catch (error) {
      return this.createFallbackPlan(taskDescription, response);
    }
  }

  private createFallbackPlan(taskDescription: string, rawResponse: string): ExecutionPlan {
    return {
      id: `plan_${Date.now()}`,
      title: taskDescription.substring(0, 50),
      description: taskDescription,
      operations: [{
        id: `op_${Date.now()}_0`,
        type: 'modify_file',
        targetPath: 'UnknownFile.cs',
        description: 'Unable to parse specific operations from AI response',
        content: rawResponse,
        dependencies: [],
        estimatedRisk: 'high',
        reasoning: 'Fallback operation due to parsing failure'
      }],
      estimatedDuration: 60,
      risks: ['Plan parsing failed - review manually'],
      prerequisites: ['Manual review required'],
      successCriteria: ['Manual verification'],
      rollbackStrategy: 'Use file snapshots to restore',
      createdAt: new Date().toISOString(),
      status: 'draft'
    };
  }

  private calculateConfidence(plan: ExecutionPlan, rawResponse: string): number {
    let confidence = 0.5;

    if (plan.operations.length > 0) confidence += 0.2;
    if (plan.operations.every(op => op.targetPath && op.targetPath !== 'UnknownFile.cs')) confidence += 0.1;
    if (plan.successCriteria.length > 0) confidence += 0.1;
    if (plan.risks.length > 0) confidence += 0.05;
    if (rawResponse.includes('{') && rawResponse.includes('}')) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  validatePlan(plan: ExecutionPlan): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!plan.title || plan.title.length === 0) {
      errors.push('Plan must have a title');
    }

    if (!plan.operations || plan.operations.length === 0) {
      errors.push('Plan must have at least one operation');
    }

    plan.operations.forEach((op, index) => {
      if (!op.targetPath) {
        errors.push(`Operation ${index}: Missing target path`);
      }

      if (op.type === 'rename_file' && !op.newPath) {
        errors.push(`Operation ${index}: Rename operation missing newPath`);
      }

      if ((op.type === 'create_file' || op.type === 'modify_file') && !op.content) {
        errors.push(`Operation ${index}: ${op.type} missing content`);
      }

      op.dependencies.forEach(depId => {
        if (!plan.operations.some(o => o.id === depId)) {
          errors.push(`Operation ${index}: Invalid dependency ${depId}`);
        }
      });
    });

    return { valid: errors.length === 0, errors };
  }

  optimizePlan(plan: ExecutionPlan): ExecutionPlan {
    const optimizedOperations = [...plan.operations];

    const independentOps = optimizedOperations.filter(op => op.dependencies.length === 0);
    const dependentOps = optimizedOperations.filter(op => op.dependencies.length > 0);

    const sortedOps = [...independentOps, ...this.topologicalSort(dependentOps)];

    return {
      ...plan,
      operations: sortedOps
    };
  }

  private topologicalSort(operations: FileOperation[]): FileOperation[] {
    const sorted: FileOperation[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (op: FileOperation) => {
      if (temp.has(op.id)) {
        return;
      }
      if (visited.has(op.id)) {
        return;
      }

      temp.add(op.id);

      op.dependencies.forEach(depId => {
        const depOp = operations.find(o => o.id === depId);
        if (depOp) visit(depOp);
      });

      temp.delete(op.id);
      visited.add(op.id);
      sorted.push(op);
    };

    operations.forEach(op => {
      if (!visited.has(op.id)) {
        visit(op);
      }
    });

    return sorted;
  }

  estimateTotalRisk(plan: ExecutionPlan): { score: number; level: 'low' | 'medium' | 'high' } {
    const riskScores = { low: 1, medium: 3, high: 5 };
    const totalScore = plan.operations.reduce((sum, op) => sum + riskScores[op.estimatedRisk], 0);
    const avgScore = totalScore / plan.operations.length;

    let level: 'low' | 'medium' | 'high';
    if (avgScore <= 1.5) level = 'low';
    else if (avgScore <= 3.5) level = 'medium';
    else level = 'high';

    return { score: avgScore, level };
  }
}
