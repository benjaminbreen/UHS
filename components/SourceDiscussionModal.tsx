/**
 * Modal for source discussions with VIP NPCs in special maps
 * Creates a cutscene-like experience for document presentations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Book, ScrollText, FileText, MessageSquare } from 'lucide-react';
import { NpcEntity } from '../types';
import { SpecialMapArchetype } from '../types/specialMapTypes';
import { SubmittedSource } from '../types/primarySource';
import { getVIPNpc, generateSourceDiscussion, createSubmittedSource, createSourceDiscussion } from '../services/sourceDiscussionService';
import { useGame } from '../contexts/GameContext';
import { addDiscussionToHistory } from '../services/sourceDiscussionPersistence';
import EducationalTooltip from './EducationalTooltip';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import SourceAnalysisPanel from './SourceAnalysisPanel';
import { analyzeSource, generateAuthenticityFeedback } from '../services/sourceAnalysisService';

interface SourceDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  npcs: NpcEntity[];
  mapArchetype: SpecialMapArchetype | null;
  mapArea: string;
}

const SourceDiscussionModal: React.FC<SourceDiscussionModalProps> = ({
  isOpen,
  onClose,
  npcs,
  mapArchetype,
  mapArea
}) => {
  const { gameDate, currentZone } = useGame();
  const { playerCharacter } = usePlayer();
  const { mapData } = useMap();
  const [vipNpc, setVipNpc] = useState<NpcEntity | null>(null);
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [sourceNotes, setSourceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discussionResult, setDiscussionResult] = useState<string | null>(null);
  const [showCutscene, setShowCutscene] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const cutsceneTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cutsceneTimerRef.current) {
        clearTimeout(cutsceneTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && npcs.length > 0) {
      const vip = getVIPNpc(npcs, mapArchetype);
      setVipNpc(vip);
    }
  }, [isOpen, npcs, mapArchetype]);

  const handleSubmit = async () => {
    if (!vipNpc || !sourceContent.trim()) return;

    setIsSubmitting(true);
    try {
      const source = createSubmittedSource(
        sourceTitle || 'Untitled Document',
        sourceContent,
        'pasted_text',
        sourceNotes,
        'MEDIEVAL', // You'd get this from context
        currentZone as any
      );

      const response = await generateSourceDiscussion(
        source,
        vipNpc,
        sourceNotes,
        mapArea,
        gameDate?.year || 1500,
        playerCharacter,
        mapData
      );

      // Create discussion record
      const discussion = createSourceDiscussion(
        source,
        vipNpc,
        response,
        mapArea
      );

      // Save to persistent history
      addDiscussionToHistory(discussion, source);

      // Show success animation
      setSubmitSuccess(true);

      // Show cutscene
      setShowCutscene(true);

      // Clear any existing timer
      if (cutsceneTimerRef.current) {
        clearTimeout(cutsceneTimerRef.current);
      }

      // Set cutscene timer with cleanup
      cutsceneTimerRef.current = setTimeout(() => {
        setDiscussionResult(response);
        setSubmitSuccess(false);
        cutsceneTimerRef.current = null;
      }, 1000);
    } catch (error) {
      console.error('Failed to discuss source:', error);
      setDiscussionResult('The document is difficult to understand...');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
      {!showCutscene ? (
        /* Input Form */
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-amber-600/50 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <EducationalTooltip
              content="In medieval courts, presenting documents to nobles was a formal process requiring proper etiquette and deference. The content and authenticity of documents were crucial for establishing credibility."
              accuracy="high"
              era="Medieval Period"
              historicalContext="Court etiquette varied significantly across cultures but universally emphasized hierarchy and formality."
              sources={["Medieval Court Practices, Oxford Historical Review", "Document Authentication in Medieval Law"]}
            >
              <h2 className="text-2xl font-bold text-amber-400">Present Document to Court</h2>
            </EducationalTooltip>
              {vipNpc && (
                <p className="text-sm text-slate-400 mt-1">
                  {vipNpc.name}, {vipNpc.profession}, awaits your presentation
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Document Title</label>
              <input
                type="text"
                placeholder="e.g., 'Royal Decree' or 'Ancient Prophecy'"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                className="w-full px-3 py-2 text-white bg-slate-800/60 border border-slate-600 rounded-lg focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-slate-400 block">Document Text</label>
                <button
                  type="button"
                  onClick={() => {
                    if (sourceContent.trim()) {
                      const analysis = analyzeSource(
                        createSubmittedSource(
                          sourceTitle || 'Analysis',
                          sourceContent,
                          'pasted_text',
                          '',
                          'MEDIEVAL',
                          currentZone as any
                        ),
                        gameDate?.year || 1500
                      );
                      setCurrentAnalysis(analysis);
                      setShowAnalysis(!showAnalysis);
                    }
                  }}
                  disabled={!sourceContent.trim()}
                  className="text-xs px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-600/50 rounded transition-all disabled:opacity-50"
                >
                  {showAnalysis ? 'Hide Analysis' : 'Analyze 🔍'}
                </button>
              </div>
              <textarea
                placeholder="Paste or type the document you wish to present..."
                value={sourceContent}
                onChange={(e) => setSourceContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 text-white bg-slate-800/60 border border-slate-600 rounded-lg focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Source Analysis Panel */}
            {showAnalysis && currentAnalysis && (
              <SourceAnalysisPanel
                analysis={currentAnalysis}
                feedback={generateAuthenticityFeedback(currentAnalysis)}
                isVisible={showAnalysis}
              />
            )}

            <div>
              <EducationalTooltip
                content="In historical contexts, explaining your purpose when presenting documents was essential for establishing intent and gaining the audience's trust. Different motivations (petition, information, trade) required different approaches."
                accuracy="medium"
                era="Various Periods"
                historicalContext="Document presentation etiquette was crucial across all literate societies."
              >
                <label className="text-sm text-slate-400 mb-1 block">Your Explanation</label>
              </EducationalTooltip>
              <input
                type="text"
                placeholder="Why are you presenting this?"
                value={sourceNotes}
                onChange={(e) => setSourceNotes(e.target.value)}
                className="w-full px-3 py-2 text-white bg-slate-800/60 border border-slate-600 rounded-lg focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={useCallback(() => handleSubmit(), [])}
              disabled={!sourceContent.trim() || isSubmitting}
              className={`w-full py-3 text-white font-semibold rounded-lg transition-all disabled:opacity-50 ${
                submitSuccess
                  ? 'bg-gradient-to-r from-green-600 to-green-700 animate-pulse'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800'
              }`}
            >
              {isSubmitting
                ? 'Presenting...'
                : submitSuccess
                  ? '✓ Submitted Successfully!'
                  : 'Present to the Court'}
            </button>
          </div>
        </div>
      ) : (
        /* Cutscene Display */
        <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-600/50 rounded-xl p-8 max-w-4xl w-full mx-4 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-600/20 rounded-full mb-4">
              <ScrollText className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold text-amber-400 mb-2">Royal Audience</h2>
            <p className="text-slate-400">
              {vipNpc?.name} examines your document...
            </p>
          </div>

          {discussionResult ? (
            <div className="space-y-6">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{vipNpc?.emoji || '👑'}</span>
                  <div className="flex-1">
                    <p className="text-amber-400 font-semibold mb-2">
                      {vipNpc?.name}, {vipNpc?.profession}
                    </p>
                    <p className="text-lg text-slate-200 italic leading-relaxed">
                      "{discussionResult}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={useCallback(() => {
                    setShowCutscene(false);
                    setDiscussionResult(null);
                    setSourceTitle('');
                    setSourceContent('');
                    setSourceNotes('');
                  }, [])}
                  className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                >
                  Present Another Document
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/50 rounded-lg transition-all"
                >
                  Leave Audience
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <Book className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <p className="text-slate-400">The court deliberates...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SourceDiscussionModal;