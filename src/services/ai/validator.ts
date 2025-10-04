export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error';
  code: string;
}

export interface ValidationWarning {
  line: number;
  column: number;
  message: string;
  severity: 'warning';
  code: string;
}

export class CSharpValidator {
  static validate(code: string, filePath: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    this.checkSyntax(code, errors);
    this.checkUnityAPIs(code, warnings);
    this.checkBestPractices(code, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static checkSyntax(code: string, errors: ValidationError[]): void {
    const lines = code.split('\n');

    let braceCount = 0;
    let inString = false;
    let inComment = false;
    let inMultilineComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (inMultilineComment) {
        if (line.includes('*/')) {
          inMultilineComment = false;
        }
        continue;
      }

      if (trimmed.startsWith('//')) continue;

      if (line.includes('/*')) {
        inMultilineComment = true;
        continue;
      }

      for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"' && (j === 0 || line[j - 1] !== '\\')) {
          inString = !inString;
        }

        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;

          if (braceCount < 0) {
            errors.push({
              line: i + 1,
              column: j + 1,
              message: 'Unmatched closing brace',
              severity: 'error',
              code: 'CS1513'
            });
            braceCount = 0;
          }
        }
      }

      if (trimmed.includes('class ') && !trimmed.includes('{') && !trimmed.includes(';')) {
        const nextLine = lines[i + 1]?.trim();
        if (!nextLine?.startsWith('{')) {
          errors.push({
            line: i + 1,
            column: 0,
            message: 'Class declaration must be followed by opening brace',
            severity: 'error',
            code: 'CS1514'
          });
        }
      }

      if (trimmed.match(/^\s*(public|private|protected|internal)\s+\w+\s+\w+\s*\(/)) {
        if (!trimmed.includes(')')) {
          errors.push({
            line: i + 1,
            column: 0,
            message: 'Method declaration missing closing parenthesis',
            severity: 'error',
            code: 'CS1026'
          });
        }
      }
    }

    if (braceCount > 0) {
      errors.push({
        line: lines.length,
        column: 0,
        message: `Missing ${braceCount} closing brace(s)`,
        severity: 'error',
        code: 'CS1513'
      });
    }
  }

  private static checkUnityAPIs(code: string, warnings: ValidationWarning[]): void {
    const lines = code.split('\n');

    const deprecatedAPIs = [
      { old: 'FindObjectOfType', new: 'FindFirstObjectByType', message: 'Use FindFirstObjectByType for better performance' },
      { old: 'FindObjectsOfType', new: 'FindObjectsByType', message: 'Use FindObjectsByType for better performance' },
      { old: 'GetComponent', new: 'TryGetComponent', message: 'Consider using TryGetComponent to avoid null reference exceptions' }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('GameObject.Find(')) {
        warnings.push({
          line: i + 1,
          column: line.indexOf('GameObject.Find('),
          message: 'GameObject.Find is expensive. Consider caching the reference or using tags',
          severity: 'warning',
          code: 'UNITY1001'
        });
      }

      if (line.includes('Camera.main')) {
        const isInUpdate = this.isInMethod(lines, i, ['Update', 'FixedUpdate', 'LateUpdate']);
        if (isInUpdate) {
          warnings.push({
            line: i + 1,
            column: line.indexOf('Camera.main'),
            message: 'Camera.main in Update methods causes performance issues. Cache the reference',
            severity: 'warning',
            code: 'UNITY1002'
          });
        }
      }

      if (line.match(/new\s+\w+\s*\[/)) {
        const isInUpdate = this.isInMethod(lines, i, ['Update', 'FixedUpdate', 'LateUpdate']);
        if (isInUpdate) {
          warnings.push({
            line: i + 1,
            column: line.indexOf('new'),
            message: 'Array allocation in Update method causes GC pressure. Consider object pooling',
            severity: 'warning',
            code: 'UNITY1003'
          });
        }
      }

      deprecatedAPIs.forEach(api => {
        if (line.includes(api.old)) {
          warnings.push({
            line: i + 1,
            column: line.indexOf(api.old),
            message: api.message,
            severity: 'warning',
            code: 'UNITY1004'
          });
        }
      });

      if (line.includes('SendMessage')) {
        warnings.push({
          line: i + 1,
          column: line.indexOf('SendMessage'),
          message: 'SendMessage uses reflection and is slow. Use direct method calls or events',
          severity: 'warning',
          code: 'UNITY1005'
        });
      }
    }
  }

  private static checkBestPractices(code: string, warnings: ValidationWarning[]): void {
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.match(/public\s+\w+\s+\w+\s*;/) && !trimmed.includes('[')) {
        if (!trimmed.includes('const') && !trimmed.includes('readonly')) {
          warnings.push({
            line: i + 1,
            column: 0,
            message: 'Public field should use [SerializeField] private or property instead',
            severity: 'warning',
            code: 'BP1001'
          });
        }
      }

      if (trimmed.startsWith('void Update()') || trimmed.startsWith('private void Update()')) {
        if (!code.includes('void FixedUpdate()') && line.includes('Rigidbody')) {
          warnings.push({
            line: i + 1,
            column: 0,
            message: 'Physics operations should be in FixedUpdate, not Update',
            severity: 'warning',
            code: 'BP1002'
          });
        }
      }

      if (trimmed.includes('== null') && !trimmed.includes('!=')) {
        const hasNullCheck = code.includes('if (') && code.includes('== null');
        if (!hasNullCheck) {
          warnings.push({
            line: i + 1,
            column: line.indexOf('== null'),
            message: 'Unity null check should use ReferenceEquals or != null',
            severity: 'warning',
            code: 'BP1003'
          });
        }
      }

      if (trimmed.includes('Instantiate') && !trimmed.includes('Destroy')) {
        const hasDestroy = code.includes('Destroy(');
        if (!hasDestroy) {
          warnings.push({
            line: i + 1,
            column: line.indexOf('Instantiate'),
            message: 'Instantiated objects should be cleaned up. Consider object pooling',
            severity: 'warning',
            code: 'BP1004'
          });
        }
      }
    }
  }

  private static isInMethod(lines: string[], lineIndex: number, methodNames: string[]): boolean {
    for (let i = lineIndex; i >= 0; i--) {
      const line = lines[i].trim();

      if (methodNames.some(name => line.includes(`void ${name}(`))) {
        return true;
      }

      if (line.includes('void ') && line.includes('(') && line !== lines[lineIndex].trim()) {
        return false;
      }
    }
    return false;
  }

  static validateUnityVersion(code: string, targetVersion: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const versionNumber = parseFloat(targetVersion);

    if (versionNumber < 2021 && code.includes('FindFirstObjectByType')) {
      errors.push({
        line: 0,
        column: 0,
        message: 'FindFirstObjectByType is only available in Unity 2021+',
        severity: 'error',
        code: 'VERSION001'
      });
    }

    if (versionNumber < 2022 && code.includes('Awaitable')) {
      errors.push({
        line: 0,
        column: 0,
        message: 'Awaitable is only available in Unity 2022+',
        severity: 'error',
        code: 'VERSION002'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  static formatValidationResults(result: ValidationResult): string {
    const lines: string[] = [];

    if (result.errors.length > 0) {
      lines.push('ERRORS:');
      result.errors.forEach(error => {
        lines.push(`  Line ${error.line}:${error.column} - ${error.message} (${error.code})`);
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push('WARNINGS:');
      result.warnings.forEach(warning => {
        lines.push(`  Line ${warning.line}:${warning.column} - ${warning.message} (${warning.code})`);
      });
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      lines.push('No issues found.');
    }

    return lines.join('\n');
  }
}
