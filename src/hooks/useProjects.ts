import { useState, useEffect } from 'react';
import { Project } from '../types';
import { ApiService } from '../services/api';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const createProject = async (projectData: Partial<Project>) => {
    setError(null);
    const project = await ApiService.createProject(projectData);
    if (project) {
      setProjects((prev) => [project, ...prev]);
      return project;
    }
    setError('Failed to create project');
    return null;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setError(null);
    const updated = await ApiService.updateProject(id, updates);
    if (updated) {
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    }
    setError('Failed to update project');
    return null;
  };

  const deleteProject = async (id: string) => {
    setError(null);
    const success = await ApiService.deleteProject(id);
    if (success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      return true;
    }
    setError('Failed to delete project');
    return false;
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refresh: loadProjects,
  };
}
