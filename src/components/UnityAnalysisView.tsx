import { useState, useEffect } from 'react';
import { Folder, TrendingUp, Network, FolderTree } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useUnityAnalyzer } from '../hooks/useUnityAnalyzer';
import UnityProjectSelector from './UnityProjectSelector';
import UnityProjectMap from './UnityProjectMap';
import DependencyGraphView from './DependencyGraphView';
import ProjectSummaryDashboard from './ProjectSummaryDashboard';

type ViewMode = 'summary' | 'structure' | 'dependencies';

export default function UnityAnalysisView() {
  const { currentProject, setCurrentProject } = useApp();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const {
    assets,
    dependencyGraph,
    projectSummary,
    isAnalyzing,
    error,
    analyzeProject,
  } = useUnityAnalyzer();

  useEffect(() => {
    if (!currentProject) {
      setShowProjectSelector(true);
    }
  }, [currentProject]);

  useEffect(() => {
    if (currentProject) {
      analyzeProject(currentProject.path, currentProject.id);
    }
  }, [currentProject, analyzeProject]);

  const handleProjectSelected = (project: any) => {
    setCurrentProject(project);
    setShowProjectSelector(false);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="h-14 border-b border-[#2F4F4F] flex items-center justify-between px-4 bg-[#36454F]">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Unity Project Analysis</h2>
          {currentProject && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Folder className="w-4 h-4" />
              <span>{currentProject.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentProject && (
            <>
              <button
                onClick={() => setViewMode('summary')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  viewMode === 'summary'
                    ? 'bg-white text-black font-medium'
                    : 'bg-[#2F4F4F] text-gray-300 hover:bg-[#1F3F3F]'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Summary
              </button>
              <button
                onClick={() => setViewMode('structure')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  viewMode === 'structure'
                    ? 'bg-white text-black font-medium'
                    : 'bg-[#2F4F4F] text-gray-300 hover:bg-[#1F3F3F]'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                Structure
              </button>
              <button
                onClick={() => setViewMode('dependencies')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  viewMode === 'dependencies'
                    ? 'bg-white text-black font-medium'
                    : 'bg-[#2F4F4F] text-gray-300 hover:bg-[#1F3F3F]'
                }`}
              >
                <Network className="w-4 h-4" />
                Dependencies
              </button>
            </>
          )}
          <button
            onClick={() => setShowProjectSelector(true)}
            className="px-4 py-1.5 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Change Project
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isAnalyzing && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-lg font-medium">Analyzing Unity Project...</p>
              <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
            </div>
          </div>
        )}

        {error && (
          <div className="h-full flex items-center justify-center">
            <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-md">
              <h3 className="text-white font-semibold mb-2">Analysis Error</h3>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!isAnalyzing && !error && currentProject && (
          <>
            {viewMode === 'summary' && projectSummary && (
              <ProjectSummaryDashboard summary={projectSummary} />
            )}

            {viewMode === 'structure' && (
              <UnityProjectMap
                projectId={currentProject.id}
                assets={assets}
              />
            )}

            {viewMode === 'dependencies' && dependencyGraph && (
              <DependencyGraphView graph={dependencyGraph} />
            )}
          </>
        )}

        {!currentProject && !isAnalyzing && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">No Project Selected</h3>
              <p className="text-gray-400 mb-6">Select a Unity project to begin analysis</p>
              <button
                onClick={() => setShowProjectSelector(true)}
                className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Select Unity Project
              </button>
            </div>
          </div>
        )}
      </div>

      {showProjectSelector && (
        <UnityProjectSelector
          onProjectSelected={handleProjectSelected}
          onClose={() => setShowProjectSelector(false)}
        />
      )}
    </div>
  );
}
