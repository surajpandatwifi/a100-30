const STORAGE_KEYS = {
  LAST_SESSION_ID: 'shunya_last_session_id',
  LAST_PROJECT_ID: 'shunya_last_project_id',
  UNSAVED_INPUT: 'shunya_unsaved_input',
  WINDOW_STATE: 'shunya_window_state',
  USER_PREFERENCES: 'shunya_user_preferences',
} as const;

export class Storage {
  static setLastSessionId(sessionId: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SESSION_ID, sessionId);
  }

  static getLastSessionId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_SESSION_ID);
  }

  static clearLastSessionId(): void {
    localStorage.removeItem(STORAGE_KEYS.LAST_SESSION_ID);
  }

  static setLastProjectId(projectId: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_PROJECT_ID, projectId);
  }

  static getLastProjectId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_PROJECT_ID);
  }

  static clearLastProjectId(): void {
    localStorage.removeItem(STORAGE_KEYS.LAST_PROJECT_ID);
  }

  static setUnsavedInput(input: string): void {
    localStorage.setItem(STORAGE_KEYS.UNSAVED_INPUT, input);
  }

  static getUnsavedInput(): string | null {
    return localStorage.getItem(STORAGE_KEYS.UNSAVED_INPUT);
  }

  static clearUnsavedInput(): void {
    localStorage.removeItem(STORAGE_KEYS.UNSAVED_INPUT);
  }

  static setWindowState(state: { width?: number; height?: number; x?: number; y?: number }): void {
    localStorage.setItem(STORAGE_KEYS.WINDOW_STATE, JSON.stringify(state));
  }

  static getWindowState(): { width?: number; height?: number; x?: number; y?: number } | null {
    const state = localStorage.getItem(STORAGE_KEYS.WINDOW_STATE);
    return state ? JSON.parse(state) : null;
  }

  static setUserPreferences(preferences: Record<string, any>): void {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  }

  static getUserPreferences(): Record<string, any> | null {
    const prefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return prefs ? JSON.parse(prefs) : null;
  }

  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }
}
