/**
 * Panel showing source analysis and authenticity feedback
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Info, Clock, BookOpen, Scale } from 'lucide-react';
import { SourceAnalysis, Anachronism } from '../services/sourceAnalysisService';

interface SourceAnalysisPanelProps {
  analysis: SourceAnalysis;
  feedback: string[];
  isVisible: boolean;
}

const SourceAnalysisPanel: React.FC<SourceAnalysisPanelProps> = ({
  analysis,
  feedback,
  isVisible
}) => {
  if (!isVisible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-900/30 border-green-700/50';
    if (score >= 60) return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
    return 'text-red-400 bg-red-900/30 border-red-700/50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4" />;
    if (score >= 60) return <Info className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900/50 border-red-700/50 text-red-300';
      case 'major': return 'bg-orange-900/50 border-orange-700/50 text-orange-300';
      case 'minor': return 'bg-yellow-900/50 border-yellow-700/50 text-yellow-300';
      default: return 'bg-slate-900/50 border-slate-700/50 text-slate-300';
    }
  };

  const getSourceTypeIcon = (type: string) => {
    switch (type) {
      case 'legal': return <Scale className="w-4 h-4" />;
      case 'religious': return '⛪';
      case 'personal': return '✍️';
      case 'commercial': return '💰';
      case 'literary': return <BookOpen className="w-4 h-4" />;
      case 'scientific': return '🔬';
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-600/50 rounded-lg p-4 mb-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-blue-300">Source Analysis</h3>
      </div>

      {/* Authenticity Score */}
      <div className={`flex items-center justify-between p-3 rounded-lg border ${getScoreColor(analysis.authenticityScore)}`}>
        <div className="flex items-center gap-2">
          {getScoreIcon(analysis.authenticityScore)}
          <span className="font-medium">Authenticity Score</span>
        </div>
        <span className="text-2xl font-bold">{analysis.authenticityScore}%</span>
      </div>

      {/* Source Type */}
      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
        <div className="flex items-center gap-2">
          {getSourceTypeIcon(analysis.sourceType)}
          <span className="text-sm font-medium text-slate-300">Document Type:</span>
        </div>
        <span className="text-amber-400 font-medium capitalize">
          {analysis.sourceType.replace('_', ' ')}
        </span>
      </div>

      {/* Anachronisms */}
      {analysis.anachronisms.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">
              Potential Anachronisms ({analysis.anachronisms.length})
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {analysis.anachronisms.map((anachronism, index) => (
              <div
                key={index}
                className={`p-2 rounded border text-xs ${getSeverityColor(anachronism.severity)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">"{anachronism.term}"</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{anachronism.earliestPossibleDate}</span>
                  </div>
                </div>
                <p className="opacity-90">{anachronism.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Terms */}
      {analysis.keyTerms.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">Historical Terms</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {analysis.keyTerms.slice(0, 8).map((term, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-900/30 border border-green-700/50 text-green-300 text-xs rounded"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Historical Context */}
      <div className="p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">Historical Context</span>
        </div>
        <p className="text-xs text-purple-200 leading-relaxed">
          {analysis.historicalContext}
        </p>
      </div>

      {/* Feedback */}
      {feedback.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Feedback</span>
          </div>
          <div className="space-y-1">
            {feedback.map((item, index) => (
              <p key={index} className="text-xs text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700/30">
                {item}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceAnalysisPanel;