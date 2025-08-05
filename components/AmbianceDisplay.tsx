/**
 * components/AmbianceDisplay.tsx - Renders the ambiance text with a dismiss button.
 */
import React, { useState, useEffect } from 'react';

interface AmbianceDisplayProps {
    ambianceText: string;
}

const AmbianceDisplay: React.FC<AmbianceDisplayProps> = ({ ambianceText }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [key, setKey] = useState(0);

    useEffect(() => {
        // When ambiance text changes, make it visible again and reset animation key
        setIsVisible(true);
        setKey(prev => prev + 1);
    }, [ambianceText]);

    if (!isVisible) {
        return null;
    }

    return (
        <div 
            key={key}
            className="shrink-0 w-full flex justify-center items-center py-2 px-8 animate-popIn"
        >
            <div className="relative max-w-4xl w-full text-center p-3 bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-700/50">
                <p className="font-lora italic text-sm text-blue-300 leading-relaxed">
                    {ambianceText}
                </p>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-1/2 -translate-y-1/2 right-2 text-slate-500 hover:text-white transition-colors text-xl leading-none"
                    aria-label="Dismiss ambiance message"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default AmbianceDisplay;
