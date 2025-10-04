import { UnityAsset, CSharpScript, CSharpMethod, CSharpField, UnityScene, UnityPrefab, UnityGameObject } from '../types';

export class MetaFileParser {
  static parse(content: string): { guid: string; fileFormatVersion: number } | null {
    try {
      const guidMatch = content.match(/guid:\s*([a-f0-9]+)/i);
      const versionMatch = content.match(/fileFormatVersion:\s*(\d+)/);

      if (guidMatch) {
        return {
          guid: guidMatch[1],
          fileFormatVersion: versionMatch ? parseInt(versionMatch[1]) : 2,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to parse meta file:', error);
      return null;
    }
  }
}

export class CSharpParser {
  private static readonly UNITY_MESSAGES = [
    'Awake', 'Start', 'Update', 'FixedUpdate', 'LateUpdate',
    'OnEnable', 'OnDisable', 'OnDestroy', 'OnApplicationQuit',
    'OnCollisionEnter', 'OnCollisionExit', 'OnTriggerEnter', 'OnTriggerExit',
  ];

  static parse(content: string, filePath: string): Partial<CSharpScript> | null {
    try {
      const namespace = this.extractNamespace(content);
      const className = this.extractClassName(content);
      const baseTypes = this.extractBaseTypes(content);
      const methods = this.extractMethods(content);
      const fields = this.extractFields(content);
      const unityMessages = methods
        .filter(m => this.UNITY_MESSAGES.includes(m.name))
        .map(m => m.name);
      const componentUsages = this.extractComponentUsages(content);

      return {
        namespace,
        class_name: className || '',
        base_types: baseTypes,
        methods,
        fields,
        unity_messages: unityMessages,
        component_usages: componentUsages,
      };
    } catch (error) {
      console.error('Failed to parse C# file:', error);
      return null;
    }
  }

  private static extractNamespace(content: string): string {
    const match = content.match(/namespace\s+([\w.]+)/);
    return match ? match[1] : '';
  }

  private static extractClassName(content: string): string | null {
    const match = content.match(/(?:public|internal|private)?\s*class\s+(\w+)/);
    return match ? match[1] : null;
  }

  private static extractBaseTypes(content: string): string[] {
    const match = content.match(/class\s+\w+\s*:\s*([^{]+)/);
    if (!match) return [];

    return match[1]
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  private static extractMethods(content: string): CSharpMethod[] {
    const methods: CSharpMethod[] = [];
    const methodRegex = /(?:public|private|protected|internal)?\s*(?:static)?\s*(?:virtual|override|async)?\s*(\w+(?:<[^>]+>)?)\s+(\w+)\s*\(([^)]*)\)/g;

    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const returnType = match[1];
      const name = match[2];
      const paramsStr = match[3];

      const parameters = paramsStr
        .split(',')
        .filter(p => p.trim().length > 0)
        .map(p => {
          const parts = p.trim().split(/\s+/);
          return {
            type: parts[0],
            name: parts[1] || '',
          };
        });

      const attributes = this.extractMethodAttributes(content, match.index);
      const isUnityMessage = this.UNITY_MESSAGES.includes(name);

      methods.push({
        name,
        returnType,
        parameters,
        attributes,
        isUnityMessage,
      });
    }

    return methods;
  }

  private static extractFields(content: string): CSharpField[] {
    const fields: CSharpField[] = [];
    const fieldRegex = /(?:public|private|protected|internal)?\s*(?:static|readonly)?\s*(\w+(?:<[^>]+>)?)\s+(\w+)\s*[;=]/g;

    let match;
    while ((match = fieldRegex.exec(content)) !== null) {
      const type = match[1];
      const name = match[2];
      const attributes = this.extractFieldAttributes(content, match.index);
      const isSerializedField = attributes.includes('SerializeField');

      fields.push({
        name,
        type,
        attributes,
        isSerializedField,
      });
    }

    return fields;
  }

  private static extractMethodAttributes(content: string, position: number): string[] {
    const before = content.substring(Math.max(0, position - 200), position);
    const attributeMatches = before.match(/\[(\w+)(?:\([^)]*\))?\]/g);
    return attributeMatches ? attributeMatches.map(a => a.replace(/[\[\]]/g, '').split('(')[0]) : [];
  }

  private static extractFieldAttributes(content: string, position: number): string[] {
    const before = content.substring(Math.max(0, position - 100), position);
    const attributeMatches = before.match(/\[(\w+)(?:\([^)]*\))?\]/g);
    return attributeMatches ? attributeMatches.map(a => a.replace(/[\[\]]/g, '').split('(')[0]) : [];
  }

  private static extractComponentUsages(content: string): string[] {
    const usages: string[] = [];
    const patterns = [
      /GetComponent<(\w+)>/g,
      /AddComponent<(\w+)>/g,
      /RequireComponent\(typeof\((\w+)\)\)/g,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        usages.push(match[1]);
      }
    });

    return [...new Set(usages)];
  }
}

export class UnityYAMLParser {
  static parseScene(content: string): Partial<UnityScene> | null {
    try {
      const gameObjects = this.extractGameObjects(content);
      const scriptReferences = this.extractScriptReferences(content);
      const prefabReferences = this.extractPrefabReferences(content);

      return {
        scene_name: '',
        game_objects: gameObjects,
        script_references: scriptReferences,
        prefab_references: prefabReferences,
      };
    } catch (error) {
      console.error('Failed to parse scene file:', error);
      return null;
    }
  }

  static parsePrefab(content: string): Partial<UnityPrefab> | null {
    try {
      const gameObjects = this.extractGameObjects(content);
      const scriptReferences = this.extractScriptReferences(content);
      const nestedPrefabReferences = this.extractPrefabReferences(content);

      const rootObject: UnityGameObject = gameObjects.length > 0 ? gameObjects[0] : {
        name: 'Root',
        fileID: '0',
        components: [],
        children: [],
      };

      return {
        prefab_name: rootObject.name,
        root_object: rootObject,
        components: rootObject.components,
        script_references: scriptReferences,
        nested_prefab_references: nestedPrefabReferences,
      };
    } catch (error) {
      console.error('Failed to parse prefab file:', error);
      return null;
    }
  }

  private static extractGameObjects(content: string): UnityGameObject[] {
    const gameObjects: UnityGameObject[] = [];
    const goRegex = /---\s*!u!\d+\s*&(\d+)\s*GameObject:\s*m_Name:\s*(\w+)/g;

    let match;
    while ((match = goRegex.exec(content)) !== null) {
      gameObjects.push({
        name: match[2],
        fileID: match[1],
        components: [],
        children: [],
      });
    }

    return gameObjects;
  }

  private static extractScriptReferences(content: string): string[] {
    const guids: string[] = [];
    const scriptRegex = /m_Script:.*?guid:\s*([a-f0-9]+)/gi;

    let match;
    while ((match = scriptRegex.exec(content)) !== null) {
      guids.push(match[1]);
    }

    return [...new Set(guids)];
  }

  private static extractPrefabReferences(content: string): string[] {
    const guids: string[] = [];
    const prefabRegex = /m_PrefabAsset:.*?guid:\s*([a-f0-9]+)/gi;

    let match;
    while ((match = prefabRegex.exec(content)) !== null) {
      guids.push(match[1]);
    }

    return [...new Set(guids)];
  }
}

export class FileHasher {
  static async hash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
