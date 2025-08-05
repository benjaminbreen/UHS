/**
 * contexts/UIContext.tsx - Provides UI state and handlers to the application.
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useUIState } from '../hooks/useUIState';

// The full return type of useUIState
type UIContextType = ReturnType<typeof useUIState>;

// Create the context with an undefined default value
const UIContext = createContext<UIContextType | undefined>(undefined);

// The provider component that will wrap parts of our app
export const UIProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    // The useUIState hook now consumes other contexts, so it doesn't need props.
    const uiStateAndHandlers = useUIState();
    return (
        <UIContext.Provider value={uiStateAndHandlers}>
            {children}
        </UIContext.Provider>
    );
};

// Custom hook to easily consume the context
export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};