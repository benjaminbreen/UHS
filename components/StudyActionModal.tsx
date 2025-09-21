/**
 * components/StudyActionModal.tsx - Modal for student-guided study actions
 */
import React, { useState, useEffect } from 'react';
import { StudyAction } from '../types/studyTypes';

interface StudyActionModalProps {
  item: any; // Flexible type for different studyables
  action: StudyAction;
  onSubmit: (input: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

const StudyActionModal: React.FC<StudyActionModalProps> = ({
  item,
  action,
  onSubmit,
  onClose,
  isProcessing = false
}) => {
  const [studentInput, setStudentInput] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const length = studentInput.trim().length;
    setCharCount(length);
    setIsValid(length >= action.minInputLength);
  }, [studentInput, action.minInputLength]);

  const handleSubmit = () => {
    if (isValid && !isProcessing) {
      onSubmit(studentInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && isValid) {
      handleSubmit();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-modal-title"
    >
      <div
        className="bg-modal-bg-gradient border border-slate-600 rounded-2xl shadow-glow-blue text-slate-200 w-full max-w-2xl p-6 flex flex-col animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-gray-700">
          <div className="flex items-center">
            <span className="mr-4 text-4xl">{item.emoji || '📦'}</span>
            <div>
              <h3 id="study-modal-title" className="text-xl font-bold text-blue-300">
                {action.emoji} {action.name}: {item.name || 'Unknown Item'}
              </h3>
              <p className="text-sm text-gray-400 capitalize">
                {item.material ? `${item.material} ` : ''}{item.category || 'Study Specimen'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-3xl font-thin leading-none text-gray-400 transition-colors hover:text-white"
            disabled={isProcessing}
          >
            &times;
          </button>
        </div>

        {/* Action Prompt */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-blue-200 mb-2">
            {action.prompt}
          </h4>
          {action.exampleInput && (
            <p className="text-sm text-gray-500 italic">
              Example: {action.exampleInput}
            </p>
          )}
        </div>

        {/* Student Input Area */}
        <div className="flex-grow mb-4">
          <textarea
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={action.exampleInput || 'Share your thoughts...'}
            className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessing}
            autoFocus
          />

          {/* Character Counter */}
          <div className="flex justify-between items-center mt-2 text-sm">
            <span className={`${isValid ? 'text-green-400' : 'text-yellow-400'}`}>
              {charCount} / {action.minInputLength} characters minimum
            </span>
            <span className="text-gray-500">
              Ctrl+Enter to submit
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-300 transition duration-150 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isProcessing}
            className="px-6 py-2 text-sm font-semibold text-white transition duration-150 bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                {action.emoji} Analyze
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          Your analysis will be added to your journal automatically
        </div>
      </div>
    </div>
  );
};

export default StudyActionModal;