export interface DiffLine {
  lineNumber: number;
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  oldContent?: string;
  newContent?: string;
  content: string;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface FileDiff {
  filePath: string;
  oldContent: string;
  newContent: string;
  hunks: DiffHunk[];
  stats: {
    additions: number;
    deletions: number;
    changes: number;
  };
}

export class DiffGenerator {
  static generateDiff(
    oldContent: string,
    newContent: string,
    filePath: string
  ): FileDiff {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const diffLines = this.computeDiff(oldLines, newLines);
    const hunks = this.groupIntoHunks(diffLines);
    const stats = this.calculateStats(diffLines);

    return {
      filePath,
      oldContent,
      newContent,
      hunks,
      stats
    };
  }

  private static computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
    const lcs = this.longestCommonSubsequence(oldLines, newLines);
    const diffLines: DiffLine[] = [];

    let oldIndex = 0;
    let newIndex = 0;
    let lineNumber = 0;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex];
      const newLine = newLines[newIndex];

      if (lcs[oldIndex]?.[newIndex]) {
        diffLines.push({
          lineNumber: ++lineNumber,
          type: 'unchanged',
          content: oldLine,
          oldContent: oldLine,
          newContent: newLine
        });
        oldIndex++;
        newIndex++;
      } else if (oldIndex < oldLines.length && !lcs[oldIndex]?.[newIndex]) {
        if (newIndex < newLines.length && this.areSimilar(oldLine, newLine)) {
          diffLines.push({
            lineNumber: ++lineNumber,
            type: 'modified',
            content: newLine,
            oldContent: oldLine,
            newContent: newLine
          });
          oldIndex++;
          newIndex++;
        } else if (newIndex >= newLines.length || !lcs[oldIndex + 1]?.[newIndex]) {
          diffLines.push({
            lineNumber: ++lineNumber,
            type: 'removed',
            content: oldLine,
            oldContent: oldLine
          });
          oldIndex++;
        } else {
          diffLines.push({
            lineNumber: ++lineNumber,
            type: 'added',
            content: newLine,
            newContent: newLine
          });
          newIndex++;
        }
      } else {
        diffLines.push({
          lineNumber: ++lineNumber,
          type: 'added',
          content: newLine,
          newContent: newLine
        });
        newIndex++;
      }
    }

    return diffLines;
  }

  private static longestCommonSubsequence(
    oldLines: string[],
    newLines: string[]
  ): boolean[][] {
    const m = oldLines.length;
    const n = newLines.length;
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const lcs: boolean[][] = Array(m).fill(0).map(() => Array(n).fill(false));
    let i = m;
    let j = n;

    while (i > 0 && j > 0) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        lcs[i - 1][j - 1] = true;
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }

  private static areSimilar(line1: string, line2: string): boolean {
    const similarity = this.calculateSimilarity(line1, line2);
    return similarity > 0.5;
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private static groupIntoHunks(diffLines: DiffLine[]): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    const contextLines = 3;

    let currentHunk: DiffHunk | null = null;
    let unchangedCount = 0;

    for (let i = 0; i < diffLines.length; i++) {
      const line = diffLines[i];

      if (line.type === 'unchanged') {
        unchangedCount++;

        if (currentHunk) {
          if (unchangedCount <= contextLines * 2) {
            currentHunk.lines.push(line);
          } else {
            for (let j = 0; j < contextLines; j++) {
              if (currentHunk.lines.length > 0) {
                currentHunk.lines.push(diffLines[i - unchangedCount + j]);
              }
            }
            hunks.push(currentHunk);
            currentHunk = null;
            unchangedCount = 0;
          }
        }
      } else {
        unchangedCount = 0;

        if (!currentHunk) {
          const startContext = Math.max(0, i - contextLines);
          currentHunk = {
            oldStart: startContext + 1,
            oldLines: 0,
            newStart: startContext + 1,
            newLines: 0,
            lines: []
          };

          for (let j = startContext; j < i; j++) {
            if (diffLines[j]) {
              currentHunk.lines.push(diffLines[j]);
            }
          }
        }

        currentHunk.lines.push(line);

        if (line.type === 'removed') {
          currentHunk.oldLines++;
        } else if (line.type === 'added') {
          currentHunk.newLines++;
        } else if (line.type === 'modified') {
          currentHunk.oldLines++;
          currentHunk.newLines++;
        }
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return hunks;
  }

  private static calculateStats(diffLines: DiffLine[]): {
    additions: number;
    deletions: number;
    changes: number;
  } {
    let additions = 0;
    let deletions = 0;
    let changes = 0;

    for (const line of diffLines) {
      switch (line.type) {
        case 'added':
          additions++;
          break;
        case 'removed':
          deletions++;
          break;
        case 'modified':
          changes++;
          break;
      }
    }

    return { additions, deletions, changes };
  }

  static formatDiffForDisplay(diff: FileDiff): string {
    const lines: string[] = [
      `--- ${diff.filePath}`,
      `+++ ${diff.filePath}`,
      `@@ Changes: +${diff.stats.additions} -${diff.stats.deletions} ~${diff.stats.changes} @@`,
      ''
    ];

    for (const hunk of diff.hunks) {
      lines.push(
        `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`
      );

      for (const line of hunk.lines) {
        let prefix = ' ';
        if (line.type === 'added') prefix = '+';
        else if (line.type === 'removed') prefix = '-';
        else if (line.type === 'modified') prefix = '~';

        lines.push(`${prefix} ${line.content}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  static generateSideBySideDiff(
    oldContent: string,
    newContent: string
  ): Array<{ left: string | null; right: string | null; type: string }> {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diffLines = this.computeDiff(oldLines, newLines);

    const result: Array<{ left: string | null; right: string | null; type: string }> = [];

    for (const line of diffLines) {
      switch (line.type) {
        case 'unchanged':
          result.push({
            left: line.oldContent || null,
            right: line.newContent || null,
            type: 'unchanged'
          });
          break;
        case 'added':
          result.push({
            left: null,
            right: line.newContent || null,
            type: 'added'
          });
          break;
        case 'removed':
          result.push({
            left: line.oldContent || null,
            right: null,
            type: 'removed'
          });
          break;
        case 'modified':
          result.push({
            left: line.oldContent || null,
            right: line.newContent || null,
            type: 'modified'
          });
          break;
      }
    }

    return result;
  }
}
