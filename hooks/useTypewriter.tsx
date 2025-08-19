/**
 * Hook for creating a typewriter effect for text display
 */
import React, { useState, useEffect, useRef } from 'react';

interface TypewriterOptions {
    speed?: number; // milliseconds per character
    startDelay?: number; // delay before starting
    wordMode?: boolean; // type word by word instead of character by character
}

export function useTypewriter(
    text: string,
    options: TypewriterOptions = {}
): [string, boolean] {
    const { 
        speed = 15, // Fast enough to not be annoying, slow enough to see
        startDelay = 0,
        wordMode = false
    } = options;
    
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        // Reset when text changes
        setDisplayedText('');
        setIsTyping(true);
        
        if (!text) {
            setIsTyping(false);
            return;
        }
        
        // Split into units (characters or words)
        const units = wordMode ? text.split(' ') : text.split('');
        let currentIndex = 0;
        
        // Start typing after delay
        const startTimeout = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                if (currentIndex < units.length) {
                    if (wordMode) {
                        // Add word with space
                        setDisplayedText(prev => {
                            const newText = prev + (prev ? ' ' : '') + units[currentIndex];
                            return newText;
                        });
                    } else {
                        // Add character
                        setDisplayedText(prev => prev + units[currentIndex]);
                    }
                    currentIndex++;
                } else {
                    // Finished typing
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                    setIsTyping(false);
                }
            }, speed);
        }, startDelay);
        
        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            clearTimeout(startTimeout);
        };
    }, [text, speed, startDelay, wordMode]);
    
    // Allow instant completion on click/tap
    useEffect(() => {
        const handleClick = () => {
            if (isTyping && text) {
                setDisplayedText(text);
                setIsTyping(false);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            }
        };
        
        if (isTyping) {
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [isTyping, text]);
    
    return [displayedText, isTyping];
}

/**
 * Component wrapper for typewriter effect
 */
export function TypewriterText({ 
    text, 
    className = '',
    speed = 15,
    wordMode = false,
    showCursor = true 
}: {
    text: string;
    className?: string;
    speed?: number;
    wordMode?: boolean;
    showCursor?: boolean;
}) {
    const [displayedText, isTyping] = useTypewriter(text, { speed, wordMode });
    
    return (
        <span className={className}>
            {displayedText}
            {showCursor && isTyping && (
                <span className="animate-pulse">▊</span>
            )}
        </span>
    );
}