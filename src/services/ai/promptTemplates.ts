export interface PromptTemplate {
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: (context: Record<string, any>) => string;
  category: 'generation' | 'refactoring' | 'analysis' | 'debugging';
}

export const UnityPromptTemplates: Record<string, PromptTemplate> = {
  createMonoBehaviour: {
    name: 'Create MonoBehaviour Script',
    description: 'Generate a new MonoBehaviour script with specified functionality',
    category: 'generation',
    systemPrompt: `You are an expert Unity C# developer. Generate clean, well-documented MonoBehaviour scripts following Unity best practices.

Requirements:
- Use proper Unity naming conventions
- Include XML documentation comments
- Follow Unity lifecycle method order (Awake, Start, Update, etc.)
- Use SerializeField for inspector-exposed fields
- Include appropriate using statements
- Add #region blocks for organization when appropriate
- Follow C# coding standards`,
    userPromptTemplate: (context) => `Create a MonoBehaviour script with the following specifications:

Script Name: ${context.scriptName}
Namespace: ${context.namespace || 'DefaultNamespace'}
Description: ${context.description}

${context.baseClass ? `Inherit from: ${context.baseClass}` : ''}
${context.interfaces ? `Implement interfaces: ${context.interfaces.join(', ')}` : ''}
${context.fields ? `Required fields: ${JSON.stringify(context.fields, null, 2)}` : ''}
${context.methods ? `Required methods: ${JSON.stringify(context.methods, null, 2)}` : ''}

Generate a complete, production-ready script.`
  },

  refactorScript: {
    name: 'Refactor C# Script',
    description: 'Refactor existing Unity script with improvements',
    category: 'refactoring',
    systemPrompt: `You are an expert Unity C# developer specializing in code refactoring and optimization.

Focus on:
- Improving code readability and maintainability
- Following SOLID principles
- Optimizing performance (avoiding allocations, caching references)
- Proper error handling
- Unity-specific best practices
- Maintaining existing functionality`,
    userPromptTemplate: (context) => `Refactor the following Unity script:

File: ${context.filePath}
Current Code:
\`\`\`csharp
${context.currentCode}
\`\`\`

Refactoring Goals:
${context.goals.map((goal: string) => `- ${goal}`).join('\n')}

${context.preserveFunctionality ? 'IMPORTANT: Preserve all existing functionality.' : ''}
${context.constraints ? `Constraints: ${context.constraints}` : ''}

Provide the refactored code with explanations of changes made.`
  },

  analyzeCode: {
    name: 'Analyze Code Quality',
    description: 'Analyze Unity script for issues and improvements',
    category: 'analysis',
    systemPrompt: `You are an expert Unity code reviewer. Analyze scripts for:
- Performance issues
- Memory allocation problems
- Incorrect Unity API usage
- Missing null checks
- Race conditions and timing issues
- Best practice violations
- Security concerns`,
    userPromptTemplate: (context) => `Analyze the following Unity script:

File: ${context.filePath}
\`\`\`csharp
${context.code}
\`\`\`

${context.focusAreas ? `Focus Areas: ${context.focusAreas.join(', ')}` : ''}

Provide:
1. Issues found (with severity: critical, high, medium, low)
2. Specific recommendations for each issue
3. Code examples for fixes`
  },

  fixBug: {
    name: 'Debug and Fix Issues',
    description: 'Diagnose and fix bugs in Unity scripts',
    category: 'debugging',
    systemPrompt: `You are an expert Unity debugger. Identify and fix bugs while:
- Explaining the root cause
- Providing a clear fix
- Suggesting preventive measures
- Maintaining code quality`,
    userPromptTemplate: (context) => `Debug the following Unity script:

File: ${context.filePath}
\`\`\`csharp
${context.code}
\`\`\`

Issue Description:
${context.issueDescription}

${context.errorMessage ? `Error Message: ${context.errorMessage}` : ''}
${context.stackTrace ? `Stack Trace:\n${context.stackTrace}` : ''}
${context.reproSteps ? `Reproduction Steps:\n${context.reproSteps}` : ''}

Provide:
1. Root cause analysis
2. Fixed code
3. Explanation of the fix
4. Preventive recommendations`
  },

  createScriptableObject: {
    name: 'Create ScriptableObject',
    description: 'Generate ScriptableObject for data management',
    category: 'generation',
    systemPrompt: `You are an expert Unity developer specializing in ScriptableObject architecture.

Generate ScriptableObjects that:
- Follow Unity naming conventions
- Include proper CreateAssetMenu attributes
- Use appropriate field types
- Include XML documentation
- Follow data-oriented design principles`,
    userPromptTemplate: (context) => `Create a ScriptableObject with:

Name: ${context.name}
Purpose: ${context.purpose}
Menu Path: ${context.menuPath || 'Data'}

Fields:
${JSON.stringify(context.fields, null, 2)}

${context.includeValidation ? 'Include OnValidate method for data validation.' : ''}
${context.includeReset ? 'Include Reset method for default values.' : ''}`
  },

  implementDesignPattern: {
    name: 'Implement Design Pattern',
    description: 'Implement a specific design pattern in Unity context',
    category: 'generation',
    systemPrompt: `You are an expert in software design patterns and Unity architecture.

Implement design patterns with:
- Unity-specific adaptations
- Clear documentation
- Example usage
- Thread-safety considerations
- Memory efficiency`,
    userPromptTemplate: (context) => `Implement the ${context.patternName} pattern in Unity:

Context: ${context.context}
Use Case: ${context.useCase}

${context.singletonRequirements ? `Singleton Requirements: ${context.singletonRequirements}` : ''}
${context.threadSafety ? 'Must be thread-safe.' : ''}
${context.persistAcrossScenes ? 'Must persist across scenes.' : ''}

Provide:
1. Complete implementation
2. Usage examples
3. Best practices and gotchas`
  },

  optimizePerformance: {
    name: 'Optimize Performance',
    description: 'Optimize Unity script for better performance',
    category: 'refactoring',
    systemPrompt: `You are a Unity performance optimization expert.

Focus on:
- Reducing GC allocations
- Caching component references
- Using object pooling where appropriate
- Optimizing Update loops
- Proper coroutine usage
- Reducing physics overhead
- Optimizing rendering calls`,
    userPromptTemplate: (context) => `Optimize this Unity script for performance:

File: ${context.filePath}
\`\`\`csharp
${context.code}
\`\`\`

Target Platform: ${context.targetPlatform || 'PC/Console'}
Performance Issues: ${context.performanceIssues || 'General optimization'}

${context.profileData ? `Profiler Data:\n${context.profileData}` : ''}

Provide optimized code with detailed explanations of improvements.`
  },

  generateTests: {
    name: 'Generate Unit Tests',
    description: 'Create unit tests for Unity scripts',
    category: 'generation',
    systemPrompt: `You are an expert in Unity Test Framework and TDD.

Generate tests that:
- Use NUnit framework
- Cover edge cases
- Test Unity-specific behavior
- Use proper setup/teardown
- Include PlayMode and EditMode tests as appropriate`,
    userPromptTemplate: (context) => `Generate unit tests for:

Script: ${context.scriptPath}
\`\`\`csharp
${context.code}
\`\`\`

Test Requirements:
- ${context.testPlayMode ? 'PlayMode tests' : ''}
- ${context.testEditMode ? 'EditMode tests' : ''}
- Coverage: ${context.coverageLevel || 'Basic'}

Focus on testing: ${context.focusAreas ? context.focusAreas.join(', ') : 'All public methods'}`
  },

  addFeature: {
    name: 'Add Feature to Existing Script',
    description: 'Add new functionality to an existing script',
    category: 'generation',
    systemPrompt: `You are an expert Unity developer specializing in feature implementation.

Add features while:
- Maintaining existing functionality
- Following the existing code style
- Preserving dependencies
- Keeping backward compatibility
- Adding appropriate documentation`,
    userPromptTemplate: (context) => `Add a feature to this script:

File: ${context.filePath}
Current Code:
\`\`\`csharp
${context.currentCode}
\`\`\`

Feature Description:
${context.featureDescription}

Requirements:
${context.requirements ? context.requirements.map((r: string) => `- ${r}`).join('\n') : ''}

${context.dependencies ? `New Dependencies: ${context.dependencies.join(', ')}` : ''}

Provide the complete modified script with the new feature integrated.`
  },

  convertToECS: {
    name: 'Convert to ECS/DOTS',
    description: 'Convert MonoBehaviour to ECS components and systems',
    category: 'refactoring',
    systemPrompt: `You are an expert in Unity DOTS (Data-Oriented Technology Stack) and ECS architecture.

Convert code following:
- ECS component design principles
- System implementation best practices
- Job system optimization
- Burst compiler compatibility
- Proper entity management`,
    userPromptTemplate: (context) => `Convert this MonoBehaviour to ECS:

Current Script:
\`\`\`csharp
${context.code}
\`\`\`

Target DOTS Version: ${context.dotsVersion || 'Latest'}

Provide:
1. Component definitions (IComponentData)
2. System implementations
3. Authoring component (if needed)
4. Explanation of the conversion`
  }
};

export function getPromptTemplate(templateName: string): PromptTemplate | undefined {
  return UnityPromptTemplates[templateName];
}

export function listPromptTemplates(category?: string): PromptTemplate[] {
  const templates = Object.values(UnityPromptTemplates);
  if (category) {
    return templates.filter(t => t.category === category);
  }
  return templates;
}
