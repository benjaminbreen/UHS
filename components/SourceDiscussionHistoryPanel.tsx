/**
 * Panel for viewing history of source discussions with NPCs
 */

import React from 'react';
import { SubmittedSource, SourceDiscussion } from '../types/primarySource';
import { Scroll, MessageSquare, Clock, MapPin, User } from 'lucide-react';

interface SourceDiscussionHistoryPanelProps {
  discussions: SourceDiscussion[];
  sources: SubmittedSource[];
  onSelectDiscussion?: (discussion: SourceDiscussion) => void;
}

const SourceDiscussionHistoryPanel: React.FC<SourceDiscussionHistoryPanelProps> = ({
  discussions,
  sources,
  onSelectDiscussion
}) => {
  const getSourceById = (sourceId: string) => sources.find(s => s.id === sourceId);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (discussions.length === 0) {
    return (
      <div className="h-full p-4 text-center text-text-muted">
        <Scroll className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No source discussions yet</p>
        <p className="text-xs mt-2 opacity-75">
          Present documents to VIP NPCs in special locations
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 border-b border-surface-muted">
        <h3 className="text-sm font-semibold text-[var(--color-warning)] flex items-center gap-2">
          <Scroll className="w-4 h-4" />
          Source Discussion History
        </h3>
        <p className="text-xs text-text-muted mt-1">
          {discussions.length} discussion{discussions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="p-2 space-y-2">
        {discussions.map((discussion, index) => {
          const source = getSourceById(discussion.sourceId);
          if (!source) return null;

          return (
            <div
              key={`${discussion.sourceId}-${index}`}
              onClick={() => onSelectDiscussion?.(discussion)}
              className="surface-muted rounded-lg p-3 hover:surface-card hover:border-[var(--color-warning)]/30 transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-text-primary group-hover:text-[var(--color-warning)] transition-colors line-clamp-1">
                    {source.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {discussion.npcName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {discussion.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* NPC Response Preview */}
              <div className="bg-background-secondary rounded p-2 mb-2">
                <p className="text-xs text-text-secondary italic line-clamp-2">
                  "{discussion.dialogue[0]}"
                </p>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(discussion.timestamp)}
                </span>
                <span className="text-[var(--color-warning)] flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {discussion.dialogue.length} exchange{discussion.dialogue.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Educational Context Badge */}
              {source.era && (
                <div className="mt-2 inline-flex items-center px-2 py-1 bg-accent/10 border border-accent/30 rounded text-xs text-accent">
                  {source.era} • {source.culturalZone}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SourceDiscussionHistoryPanel;