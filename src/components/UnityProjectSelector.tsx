import { useState } from 'react';
import { FolderOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { Project } from '../types';
import { ApiService } from '../services/api';

interface UnityProjectSelectorProps {
  onProjectSelected: (project: Project) => void;
  onClose: () => void;
}

export default function UnityProjectSelector({ onProjectSelected, onClose }: UnityProjectSelectorProps) {
  const [selectedPath, setSelectedPath] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');

  const handleBrowse = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');

    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const path = file.webkitRelativePath.split('/')[0];
        setSelectedPath(path);
        validateUnityProject(path);
      }
    };

    input.click();
  };

  const validateUnityProject = async (path: string) => {
    setIsValidating(true);
    setValidationStatus('idle');

    try {
      const hasAssets = path.includes('Assets');
      const hasProjectSettings = path.includes('ProjectSettings');

      if (hasAssets || hasProjectSettings) {
        setValidationStatus('valid');
        setValidationMessage('Valid Unity project detected');

        const folderName = path.split('/').pop() || 'Unity Project';
        setProjectName(folderName);
      } else {
        setValidationStatus('invalid');
        setValidationMessage('Not a valid Unity project. Must contain Assets or ProjectSettings folder.');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationMessage('Failed to validate project structure');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedPath || !projectName) return;

    try {
      const project = await ApiService.createProject({
        name: projectName,
        path: selectedPath,
        unity_version: '2022.3.0f1',
      });

      if (project) {
        onProjectSelected(project);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#36454F] rounded-lg p-6 w-[600px] border border-[#2F4F4F]">
        <h2 className="text-xl font-semibold text-white mb-6">Select Unity Project</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Path
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedPath}
                readOnly
                placeholder="Click Browse to select a Unity project folder"
                className="flex-1 px-4 py-2 bg-black border border-[#2F4F4F] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white"
              />
              <button
                onClick={handleBrowse}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Browse
              </button>
            </div>
          </div>

          {isValidating && (
            <div className="flex items-center gap-2 text-gray-300">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Validating project structure...</span>
            </div>
          )}

          {validationStatus === 'valid' && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">{validationMessage}</span>
            </div>
          )}

          {validationStatus === 'invalid' && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{validationMessage}</span>
            </div>
          )}

          {validationStatus === 'valid' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-4 py-2 bg-black border border-[#2F4F4F] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#2F4F4F] text-white rounded-lg hover:bg-[#1F3F3F] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={validationStatus !== 'valid' || !projectName}
            className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
