import React, { useState } from 'react';
import { X, BookOpen, Copy, ExternalLink, Download } from 'lucide-react';
import { primarySourceService, PrimarySourceMetadata } from '../services/primarySourceService';

interface PrimarySourceModalProps {
  source: PrimarySourceMetadata;
  onClose: () => void;
}

export const PrimarySourceModal: React.FC<PrimarySourceModalProps> = ({ source, onClose }) => {
  const [activeTab, setActiveTab] = useState<'excerpt' | 'fulltext' | 'citation'>('excerpt');

  const copyCitation = () => {
    const citation = formatCitation();
    navigator.clipboard.writeText(citation);
  };

  const formatCitation = () => {
    const year = source.year < 0 ? `${Math.abs(source.year)} BCE` : `${source.year} CE`;
    const translator = source.citation.translator ? `, trans. ${source.citation.translator}` : '';
    const publication = source.citation.originalPublication || '';
    
    return `${source.author}. "${source.title}"${translator}. ${publication} (${year}).`;
  };

  const downloadText = () => {
    const content = source.longExcerpt || source.excerpt;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${source.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInWikisource = () => {
    if (source.wikisourceTitle) {
      window.open(`https://en.wikisource.org/wiki/${source.wikisourceTitle}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-700 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{source.title}</h2>
              <p className="text-gray-400">
                by {source.author} • {source.year < 0 ? `${Math.abs(source.year)} BCE` : `${source.year} CE`}
              </p>
              {source.citation.translator && (
                <p className="text-sm text-gray-500 mt-1">
                  Translated by {source.citation.translator}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('excerpt')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'excerpt'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Brief Excerpt
            </button>
            <button
              onClick={() => setActiveTab('fulltext')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'fulltext'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-1" /> Extended Text
            </button>
            <button
              onClick={() => setActiveTab('citation')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'citation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Citation
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'excerpt' && (
            <div className="prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed text-gray-300">
                {source.excerpt}
              </p>
              
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h3 className="text-white font-semibold mb-4">Keywords & Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {source.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {source.citation.originalPublication && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-white font-semibold mb-2">Original Publication</h3>
                  <p className="text-gray-400">{source.citation.originalPublication}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fulltext' && (
            <div className="prose prose-invert max-w-none">
              {source.longExcerpt ? (
                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                  {source.longExcerpt}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-12">
                  <BookOpen className="w-12 h-12 mb-4 opacity-50 mx-auto" />
                  <p>Extended excerpt not available for this source.</p>
                  <p className="mt-4 text-sm">Here is the brief excerpt:</p>
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg text-gray-300 text-left">
                    {source.excerpt}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'citation' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-semibold mb-3">Formatted Citation</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-300">{formatCitation()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-3">BibTeX</h3>
                <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
                  <pre className="text-gray-300">{`@book{${source.id.replace(/-/g, '_')},
  title={${source.title}},
  author={${source.author}},
  year={${Math.abs(source.year)}},
  ${source.citation.translator ? `translator={${source.citation.translator}},\n  ` : ''}${source.citation.originalPublication ? `note={${source.citation.originalPublication}}` : ''}
}`}</pre>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyCitation}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  <Copy className="w-4 h-4 inline mr-1" /> Copy Citation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-700 p-4 flex justify-between">
          <div className="flex gap-3">
            {source.wikisourceTitle && (
              <button
                onClick={openInWikisource}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Wikisource
              </button>
            )}
            <button
              onClick={downloadText}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Text
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};