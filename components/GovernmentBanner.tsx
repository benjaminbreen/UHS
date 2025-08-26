/**
 * components/GovernmentBanner.tsx - Animated banner for government buildings
 */
import React from 'react';
import { HistoricalEra } from '../types';

export type GovernmentType = 'forum' | 'palace_complex' | 'commandery' | 'tribal_council' | 
                              'great_hall' | 'diwan' | 'prefecture' | 'royal_palace' |
                              'town_hall' | 'pasha_court' | 'colonial_admin' |
                              'municipal' | 'modern_complex' | 'default';

interface GovernmentBannerProps {
    type: GovernmentType;
    name: string;
    location: string;
    dominantPower: string;
    era: HistoricalEra;
}

const GovernmentBanner: React.FC<GovernmentBannerProps> = ({ type, name, location, dominantPower, era }) => {
    const getBannerStyle = () => {
        switch (type) {
            case 'forum':
                return {
                    gradient: 'from-purple-900 via-red-800 to-amber-700',
                    pattern: 'Roman columns and laurel wreaths',
                    icon: '🏛️'
                };
            case 'palace_complex':
                return {
                    gradient: 'from-amber-900 via-yellow-700 to-orange-600',
                    pattern: 'Islamic geometric patterns',
                    icon: '🕌'
                };
            case 'commandery':
                return {
                    gradient: 'from-red-900 via-red-700 to-yellow-600',
                    pattern: 'Chinese cloud motifs',
                    icon: '⛩️'
                };
            case 'tribal_council':
                return {
                    gradient: 'from-green-900 via-brown-700 to-amber-600',
                    pattern: 'Natural elements and totems',
                    icon: '🏕️'
                };
            case 'great_hall':
                return {
                    gradient: 'from-gray-800 via-blue-800 to-purple-700',
                    pattern: 'Medieval heraldry',
                    icon: '🏰'
                };
            case 'diwan':
                return {
                    gradient: 'from-teal-900 via-cyan-700 to-blue-600',
                    pattern: 'Ottoman calligraphy',
                    icon: '📜'
                };
            case 'prefecture':
                return {
                    gradient: 'from-indigo-900 via-blue-700 to-cyan-600',
                    pattern: 'East Asian roof tiles',
                    icon: '🏯'
                };
            case 'royal_palace':
                return {
                    gradient: 'from-purple-900 via-pink-700 to-red-600',
                    pattern: 'Royal regalia',
                    icon: '👑'
                };
            case 'town_hall':
                return {
                    gradient: 'from-amber-800 via-orange-700 to-red-600',
                    pattern: 'Renaissance architecture',
                    icon: '🏛️'
                };
            case 'pasha_court':
                return {
                    gradient: 'from-green-900 via-teal-700 to-cyan-600',
                    pattern: 'Ottoman tulips and crescents',
                    icon: '☪️'
                };
            case 'colonial_admin':
                return {
                    gradient: 'from-blue-900 via-gray-700 to-slate-600',
                    pattern: 'European flags and seals',
                    icon: '🏴'
                };
            case 'municipal':
                return {
                    gradient: 'from-slate-800 via-gray-700 to-zinc-600',
                    pattern: 'Victorian ironwork',
                    icon: '🏢'
                };
            case 'modern_complex':
                return {
                    gradient: 'from-blue-800 via-slate-700 to-gray-600',
                    pattern: 'Modern glass and steel',
                    icon: '🏙️'
                };
            default:
                return {
                    gradient: 'from-blue-900 to-purple-900',
                    pattern: 'Official seals',
                    icon: '🏛️'
                };
        }
    };

    const style = getBannerStyle();

    return (
        <div className={`relative bg-gradient-to-r ${style.gradient} p-6 rounded-t-2xl border-b border-slate-600 overflow-hidden`}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-repeat animate-pulse"
                     style={{
                         backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='white' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                         backgroundSize: '30px 30px'
                     }}
                />
            </div>

            {/* Floating emblems */}
            <div className="absolute -top-4 -right-4 text-8xl opacity-20 animate-float">
                {style.icon}
            </div>
            <div className="absolute -bottom-4 -left-4 text-8xl opacity-20 animate-float-delayed">
                {style.icon}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 drop-shadow-lg flex items-center gap-2">
                        <span className="text-2xl">{style.icon}</span>
                        {name}
                    </h1>
                    <p className="text-lg text-white/80 mb-1">
                        {location}
                    </p>
                    <p className="text-sm text-white/60">
                        Era: {era.replace(/_/g, ' ')}
                    </p>
                </div>
                <div className="text-right">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30">
                        <div className="text-lg font-bold text-yellow-300 drop-shadow">
                            {dominantPower}
                        </div>
                        <div className="text-sm text-white/80">
                            Ruling Authority
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative elements based on type */}
            {type === 'forum' && (
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 via-red-600 to-amber-600 opacity-50" />
            )}
            {type === 'palace_complex' && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 opacity-40" />
            )}
            {(type === 'commandery' || type === 'prefecture') && (
                <>
                    <div className="absolute top-2 right-2 w-16 h-16 border-2 border-yellow-400/30 rounded-full animate-spin-slow" />
                    <div className="absolute bottom-2 left-2 w-12 h-12 border-2 border-red-400/30 rounded animate-spin-reverse" />
                </>
            )}

            <style jsx="true">{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(-5deg); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 6s ease-in-out infinite;
                    animation-delay: 3s;
                }
                .animate-spin-slow {
                    animation: spin-slow 20s linear infinite;
                }
                .animate-spin-reverse {
                    animation: spin-reverse 15s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default GovernmentBanner;