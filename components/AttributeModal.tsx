/**
 * components/AttributeModal.tsx - Detailed view of character attributes
 */

import React from 'react';
import { AttributeBadge, RARITY_COLORS } from '../types/attributeTypes';
import * as FaIcons from 'react-icons/fa';
import * as GiIcons from 'react-icons/gi';

interface AttributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  attributes: AttributeBadge[];
  characterName: string;
}

const AttributeModal: React.FC<AttributeModalProps> = ({
  isOpen,
  onClose,
  attributes,
  characterName
}) => {
  if (!isOpen) return null;
  
  const getIcon = (iconName: string) => {
    const allIcons = { ...FaIcons, ...GiIcons };
    const IconComponent = allIcons[iconName as keyof typeof allIcons] as React.ElementType;
    return IconComponent || FaIcons.FaQuestionCircle;
  };
  
  // Group attributes by category
  const groupedAttributes = attributes.reduce((acc, attr) => {
    if (!acc[attr.category]) {
      acc[attr.category] = [];
    }
    acc[attr.category].push(attr);
    return acc;
  }, {} as Record<string, AttributeBadge[]>);
  
  const categoryNames = {
    physical: 'Physical Traits',
    mental: 'Mental Traits',
    social: 'Social Traits',
    spiritual: 'Spiritual Traits',
    skill: 'Skills & Professions',
    cultural: 'Cultural Heritage',
    era: 'Historical Context'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100">
              {characterName}'s Attributes
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <FaIcons.FaTimes className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Unique traits and characteristics that shape personality and abilities
          </p>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {attributes.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              No special attributes
            </p>
          ) : (
            Object.entries(groupedAttributes).map(([category, attrs]) => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  {categoryNames[category as keyof typeof categoryNames] || category}
                </h3>
                
                <div className="space-y-3">
                  {attrs.map(attr => {
                    const Icon = getIcon(attr.icon);
                    const color = RARITY_COLORS[attr.rarity];
                    
                    return (
                      <div 
                        key={attr.id}
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2"
                            style={{ 
                              borderColor: color,
                              backgroundColor: `${color}20`
                            }}
                          >
                            <Icon className="w-5 h-5" style={{ color }} />
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-200">
                                {attr.name}
                              </h4>
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ 
                                  backgroundColor: `${color}30`,
                                  color: color
                                }}
                              >
                                {attr.rarity}
                              </span>
                            </div>
                            
                            <p className="text-sm text-slate-400 mb-2">
                              {attr.description}
                            </p>
                            
                            {attr.effect && (
                              <div className="text-xs text-blue-400 bg-blue-900/20 rounded px-2 py-1 inline-block">
                                <FaIcons.FaBolt className="inline w-3 h-3 mr-1" />
                                {attr.effect}
                              </div>
                            )}
                            
                            {attr.dialogueHint && (
                              <div className="text-xs text-purple-400 mt-2">
                                <FaIcons.FaComment className="inline w-3 h-3 mr-1" />
                                {attr.dialogueHint}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {attributes.length} attribute{attributes.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributeModal;