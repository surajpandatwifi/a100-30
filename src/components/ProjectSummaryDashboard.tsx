import { ProjectSummary } from '../types';
import { FileCode, Film, Box, Package, TrendingUp, Network } from 'lucide-react';

interface ProjectSummaryDashboardProps {
  summary: ProjectSummary;
}

export default function ProjectSummaryDashboard({ summary }: ProjectSummaryDashboardProps) {
  const stats = [
    { label: 'Scripts', value: summary.total_scripts, icon: FileCode, color: '#00FF00' },
    { label: 'Scenes', value: summary.total_scenes, icon: Film, color: '#FF6B6B' },
    { label: 'Prefabs', value: summary.total_prefabs, icon: Box, color: '#4ECDC4' },
    { label: 'Total Assets', value: summary.total_assets, icon: Package, color: '#95A5A6' },
  ];

  const maxReferences = summary.most_referenced_assets[0]?.reference_count || 1;

  return (
    <div className="h-full overflow-auto bg-black p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Project Summary</h2>
          <p className="text-gray-400 text-sm">Overview of your Unity project structure and dependencies</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[#36454F] border border-[#2F4F4F] rounded-lg p-4 hover:border-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#36454F] border border-[#2F4F4F] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Script Categories</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(summary.script_categories).map(([category, count]) => {
              const percentage = (count / summary.total_scripts) * 100;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{category}</span>
                    <span className="text-sm font-medium text-white">{count}</span>
                  </div>
                  <div className="h-2 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#36454F] border border-[#2F4F4F] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Most Referenced Assets</h3>
          </div>
          <div className="space-y-3">
            {summary.most_referenced_assets.slice(0, 10).map((asset, index) => {
              const percentage = (asset.reference_count / maxReferences) * 100;
              return (
                <div key={asset.guid} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-400 w-6 text-right">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-gray-300 truncate">{asset.name}</span>
                    </div>
                    <span className="text-sm font-medium text-white ml-3">
                      {asset.reference_count} refs
                    </span>
                  </div>
                  <div className="h-1.5 bg-black rounded-full overflow-hidden ml-8">
                    <div
                      className="h-full bg-gradient-to-r from-white to-gray-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#36454F] border border-[#2F4F4F] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Dependency Analysis</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between p-4 bg-black rounded-lg">
              <span className="text-sm text-gray-300">Maximum Dependency Depth</span>
              <span className="text-xl font-bold text-white">{summary.dependency_depth}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black rounded-lg">
              <span className="text-sm text-gray-300">Average References per Asset</span>
              <span className="text-xl font-bold text-white">
                {(
                  summary.most_referenced_assets.reduce((sum, a) => sum + a.reference_count, 0) /
                  summary.most_referenced_assets.length
                ).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#36454F] border border-[#2F4F4F] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Project Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black rounded-lg">
              <span className="text-sm text-gray-300">Assets Analyzed</span>
              <span className="text-sm font-medium text-green-400">✓ Complete</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black rounded-lg">
              <span className="text-sm text-gray-300">Dependency Graph</span>
              <span className="text-sm font-medium text-green-400">✓ Generated</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black rounded-lg">
              <span className="text-sm text-gray-300">Script Parsing</span>
              <span className="text-sm font-medium text-green-400">✓ Complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
