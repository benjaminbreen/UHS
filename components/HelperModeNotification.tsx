/**
 * components/HelperModeNotification.tsx - Pixel art style notification for NPC helper mode
 */

import React, { useEffect, useState } from 'react';
import { eventBus } from '../services/eventBus';
import { MapPin, Gift, Home, UserPlus } from 'lucide-react';

interface HelperNotification {
    npcName: string;
    mode: 'follow' | 'lead' | 'gift' | 'show';
    destination?: string;
    message?: string;
}

export function HelperModeNotification() {
    const [notification, setNotification] = useState<HelperNotification | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleHelperModeStart = (event: any) => {
            const { npc, helperData } = event;

            // Create notification message
            let message = '';
            switch (helperData.mode) {
                case 'lead':
                    message = `Follow ${npc.name} to ${helperData.destinationName || 'their destination'}!`;
                    break;
                case 'gift':
                    message = `${npc.name} has something for you!`;
                    break;
                case 'show':
                    message = `${npc.name} wants to show you something!`;
                    break;
                case 'follow':
                    message = `${npc.name} is following you!`;
                    break;
            }

            setNotification({
                npcName: npc.name,
                mode: helperData.mode,
                destination: helperData.destinationName,
                message
            });
            setIsVisible(true);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                setIsVisible(false);
            }, 5000);
        };

        const handleHelperModeEnd = () => {
            setIsVisible(false);
            setTimeout(() => setNotification(null), 300);
        };

        eventBus.on('npcHelperModeStarted', handleHelperModeStart);
        eventBus.on('npcHelperModeEnded', handleHelperModeEnd);

        return () => {
            eventBus.off('npcHelperModeStarted', handleHelperModeStart);
            eventBus.off('npcHelperModeEnded', handleHelperModeEnd);
        };
    }, []);

    if (!notification) return null;

    const getIcon = () => {
        switch (notification.mode) {
            case 'lead': return <MapPin className="w-6 h-6" />;
            case 'gift': return <Gift className="w-6 h-6" />;
            case 'show': return <Home className="w-6 h-6" />;
            case 'follow': return <UserPlus className="w-6 h-6" />;
        }
    };

    return (
        <div
            className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
            style={{
                pointerEvents: 'none',
                imageRendering: 'pixelated',
                fontSize: '14px'
            }}
        >
            {/* Classic FF6-style dialogue box */}
            <div
                style={{
                    background: 'linear-gradient(to bottom, #001846 0%, #001030 50%, #000820 100%)',
                    border: '4px solid #ffffff',
                    borderRadius: '8px',
                    padding: '16px 20px',
                    minWidth: '320px',
                    maxWidth: '480px',
                    boxShadow: `
                        inset 0 0 0 2px #6c6c9c,
                        inset 0 0 0 4px #001030,
                        0 8px 0 0 rgba(0, 0, 0, 0.5),
                        0 12px 24px rgba(0, 0, 0, 0.8)
                    `,
                    position: 'relative'
                }}
            >
                {/* Corner decorations */}
                <div style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    width: '8px',
                    height: '8px',
                    background: '#ffffff',
                    borderRadius: '2px'
                }} />
                <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    background: '#ffffff',
                    borderRadius: '2px'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '-2px',
                    width: '8px',
                    height: '8px',
                    background: '#ffffff',
                    borderRadius: '2px'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    background: '#ffffff',
                    borderRadius: '2px'
                }} />

                {/* Content */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Icon with glow effect */}
                    <div style={{
                        fontSize: '20px',
                        filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
                        animation: 'pulse 2s infinite'
                    }}>
                        {notification.mode === 'lead' ? '➤' :
                         notification.mode === 'gift' ? '◆' :
                         notification.mode === 'show' ? '▶' : '●'}
                    </div>

                    {/* Text content */}
                    <div style={{ flex: 1 }}>
                        <p style={{
                            color: '#ffffff',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            lineHeight: '16px',
                            letterSpacing: '0.3px',
                            textShadow: '1px 1px 0 #000000',
                            marginBottom: '4px',
                            fontWeight: 'normal'
                        }}>
                            {notification.message}
                        </p>

                        {/* Animated arrow pointing down */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '4px'
                        }}>
                            <span style={{
                                color: '#9c9cce',
                                fontFamily: 'monospace',
                                fontSize: '8px',
                                letterSpacing: '0.3px',
                                textShadow: '1px 1px 0 #000000',
                                fontWeight: 'bold',
                                textTransform: 'uppercase'
                            }}>
                                {notification.mode === 'lead' ? 'FOLLOW' : 'INTERACT'}
                            </span>
                            <span style={{
                                display: 'inline-block',
                                animation: 'bounce 1s infinite',
                                color: '#ffff00',
                                fontSize: '10px',
                                textShadow: '1px 1px 0 #000000'
                            }}>
                                ▼
                            </span>
                        </div>
                    </div>
                </div>

                {/* Classic FF progress dots */}
                <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '8px',
                    display: 'flex',
                    gap: '3px'
                }}>
                    <div style={{
                        width: '4px',
                        height: '4px',
                        background: '#ffff00',
                        borderRadius: '1px',
                        animation: 'pulse 1s infinite',
                        animationDelay: '0ms'
                    }} />
                    <div style={{
                        width: '4px',
                        height: '4px',
                        background: '#ffff00',
                        borderRadius: '1px',
                        animation: 'pulse 1s infinite',
                        animationDelay: '333ms'
                    }} />
                    <div style={{
                        width: '4px',
                        height: '4px',
                        background: '#ffff00',
                        borderRadius: '1px',
                        animation: 'pulse 1s infinite',
                        animationDelay: '666ms'
                    }} />
                </div>
            </div>

            {/* Add pulse animation and font */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(2px); }
                }
                @font-face {
                    font-family: 'PixelFont';
                    font-style: normal;
                    font-weight: 400;
                    src: local('Courier New');
                }
            `}</style>
        </div>
    );
}