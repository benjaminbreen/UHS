
import './styles/tailwind.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { enableMapSet } from 'immer';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Enable Immer MapSet plugin for NPC memory system (Maps/Sets)
enableMapSet();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <ErrorBoundary>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ErrorBoundary>
);
