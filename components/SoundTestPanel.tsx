/**
 * components/SoundTestPanel.tsx
 * Developer panel for testing all game sounds
 */

import React, { useState } from 'react';
import gameSoundsService from '../services/gameSoundsService';
import { Volume2, Music, Bell, Sword, Coins, Package, Anchor, Sparkles, Footprints, Bug } from 'lucide-react';

interface SoundTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SoundCategory {
  name: string;
  icon: React.ReactNode;
  sounds: {
    name: string;
    method: () => void;
    description: string;
  }[];
}

const SoundTestPanel: React.FC<SoundTestPanelProps> = ({ isOpen, onClose }) => {
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const playSound = (soundName: string, soundMethod: () => void) => {
    setPlayingSound(soundName);
    soundMethod();
    // Clear playing indicator after a reasonable time
    setTimeout(() => setPlayingSound(null), 3000);
  };

  const soundCategories: SoundCategory[] = [
    {
      name: 'Combat & Damage',
      icon: <Sword className="w-4 h-4" />,
      sounds: [
        { name: 'Light Damage', method: () => gameSoundsService.playDamageSound('light'), description: 'Minor injury sound' },
        { name: 'Medium Damage', method: () => gameSoundsService.playDamageSound('medium'), description: 'Moderate injury sound' },
        { name: 'Heavy Damage', method: () => gameSoundsService.playDamageSound('heavy'), description: 'Severe injury sound' },
        { name: 'Death', method: () => gameSoundsService.playDeathSound(), description: 'Character death sound' },
        { name: 'Combat Start', method: () => gameSoundsService.playRoguelikeCombatSound(), description: 'Combat initiation sound' },
        { name: 'Chop Attack', method: () => gameSoundsService.playChopSound(), description: 'Axe or cleaver chop' },
        { name: 'Slash Attack', method: () => gameSoundsService.playSlashSound(), description: 'Sword or blade slash' },
        { name: 'Stab Attack', method: () => gameSoundsService.playStabSound(), description: 'Spear or dagger thrust' },
        { name: 'Crush Attack', method: () => gameSoundsService.playCrushSound(), description: 'Hammer or mace impact' },
        { name: 'Arrow Attack', method: () => gameSoundsService.playArrowSound(), description: 'Bow or crossbow shot' },
      ]
    },
    {
      name: 'Items & Inventory',
      icon: <Package className="w-4 h-4" />,
      sounds: [
        { name: 'Item Pickup', method: () => gameSoundsService.playItemPickupSound('common'), description: 'Picking up an item' },
        { name: 'Weapon Pickup', method: () => gameSoundsService.playItemPickupSound('weapon'), description: 'Picking up a weapon' },
        { name: 'Document Pickup', method: () => gameSoundsService.playItemPickupSound('document'), description: 'Picking up a document' },
        { name: 'Gold Pickup', method: () => gameSoundsService.playGoldPickupSound(), description: 'Collecting coins' },
        { name: 'Item Drop', method: () => gameSoundsService.playItemDropSound(), description: 'Dropping an item' },
        { name: 'Menu Open', method: () => gameSoundsService.playMenuOpenSound(), description: 'Opening a menu' },
        { name: 'Menu Close', method: () => gameSoundsService.playMenuCloseSound(), description: 'Closing a menu' },
      ]
    },
    {
      name: 'Containers',
      icon: <Package className="w-4 h-4" />,
      sounds: [
        { name: 'Open Chest', method: () => gameSoundsService.playContainerOpenSound('CHEST'), description: 'Opening a treasure chest' },
        { name: 'Open Barrel', method: () => gameSoundsService.playContainerOpenSound('BARREL'), description: 'Opening a barrel' },
        { name: 'Open Cabinet', method: () => gameSoundsService.playContainerOpenSound('CABINET'), description: 'Opening a cabinet' },
        { name: 'Close Chest', method: () => gameSoundsService.playContainerCloseSound('CHEST'), description: 'Closing a treasure chest' },
        { name: 'Close Barrel', method: () => gameSoundsService.playContainerCloseSound('BARREL'), description: 'Closing a barrel' },
      ]
    },
    {
      name: 'Movement & Travel',
      icon: <Anchor className="w-4 h-4" />,
      sounds: [
        { name: 'Footsteps (Sand)', method: () => gameSoundsService.playEmbarkSound(), description: 'Realistic footsteps on sand' },
        { name: 'Ship Movement', method: () => gameSoundsService.playShipMovementSplash(), description: 'Ship moving through water' },
        { name: 'Wall Bump', method: () => gameSoundsService.playWallBumpSound(), description: 'Hitting a wall' },
        { name: 'Fire Spread', method: () => gameSoundsService.playFireSpreadSound(), description: 'Fire spreading sound' },
        { name: 'Step', method: () => gameSoundsService.playStepSound(), description: 'Single footstep' },
      ]
    },
    {
      name: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      sounds: [
        { name: 'Success', method: () => gameSoundsService.playNotificationSound('success'), description: 'Achievement or success' },
        { name: 'Warning', method: () => gameSoundsService.playNotificationSound('warning'), description: 'Warning or alert' },
        { name: 'Error', method: () => gameSoundsService.playNotificationSound('error'), description: 'Error or failure' },
        { name: 'Info', method: () => gameSoundsService.playNotificationSound('info'), description: 'Information notification' },
      ]
    },
    {
      name: 'Special Effects (Test)',
      icon: <Sparkles className="w-4 h-4" />,
      sounds: [
        { name: 'Treasure Opening (Zelda)', method: () => gameSoundsService.playTreasureOpeningSound(), description: 'Magical harp arpeggio' },
        { name: 'Victory Fanfare (Old)', method: () => gameSoundsService.playFinalFantasySound(), description: 'Old victory music' },
        { name: 'Victory Melody (FF6)', method: () => gameSoundsService.playVictoryMelody(), description: 'FF6-style victory fanfare' },
        { name: 'UI Click', method: () => gameSoundsService.playUIClickSound(), description: 'Subtle modal button click' },
        { name: 'Generic Music (FF Style)', method: () => gameSoundsService.playGenericMusic(), description: 'Charming orchestral theme with fade-in' },
        { name: 'Marketplace Ambient', method: () => gameSoundsService.playMarketplaceAmbient(), description: 'Crowd voices, flute, merchant calls' },
        { name: 'Intense Battle Music', method: () => gameSoundsService.playIntenseBattleMusic(), description: 'Dark FF6-style combat theme' },
        { name: 'Peaceful Fishing Music', method: () => gameSoundsService.playFishingMusic(), description: 'Soft, looping ambient music for fishing' },
        { name: 'Dungeon Music', method: () => gameSoundsService.playDungeonMusic(), description: 'Mysterious, peaceful dungeon exploration music' },
        { name: 'Government Forum Music', method: () => gameSoundsService.playGovernmentMusic(), description: 'Memorable FF6-style theme with powerful melody and driving beat' },
        { name: 'Estates Music', method: () => gameSoundsService.playEstatesMusic(), description: 'Warm, Stardew Valley-style music for elite leaders\' abodes' },
        { name: 'Temple/Sacred Music', method: () => gameSoundsService.playTempleMusic(), description: 'Reverent, mystical music for religious buildings' },
        { name: 'Danger Music', method: () => gameSoundsService.playDangerMusic(), description: 'Dark, atmospheric FF6-style music for arrests and confrontations' },
        { name: 'Modern City Music', method: () => gameSoundsService.playModernCityMusic(), description: 'Upbeat urban theme for modern city settings' },
        { name: 'FF6 Combat Music', method: () => gameSoundsService.playFF6CombatMusic(), description: 'Intense FF6-style combat with looping Bach-fugue melodic fragments' },
        { name: 'Stop All Music', method: () => gameSoundsService.stopAllMusic(), description: 'Stops all background music' },
      ]
    },
    {
      name: 'Footsteps (Special Maps)',
      icon: <Footprints className="w-4 h-4" />,
      sounds: [
        { name: 'Stone Floor', method: () => gameSoundsService.playFootstepSound('stone'), description: 'Hard stone footstep' },
        { name: 'Marble Floor', method: () => gameSoundsService.playFootstepSound('marble'), description: 'Polished marble echo' },
        { name: 'Wood Floor', method: () => gameSoundsService.playFootstepSound('wood'), description: 'Hollow wood thump' },
        { name: 'Carpet Floor', method: () => gameSoundsService.playFootstepSound('carpet'), description: 'Muffled carpet step' },
        { name: 'Tile Floor', method: () => gameSoundsService.playFootstepSound('tile'), description: 'Ceramic tile click' },
        { name: 'Tatami Mat', method: () => gameSoundsService.playFootstepSound('tatami'), description: 'Soft mat sound' },
        { name: 'Metal Floor', method: () => gameSoundsService.playFootstepSound('metal'), description: 'Metallic clang' },
        { name: 'Sand', method: () => gameSoundsService.playFootstepSound('sand'), description: 'Sand shuffling' },
      ]
    },
    {
      name: 'Animals - Domestic',
      icon: <Bug className="w-4 h-4" />,
      sounds: [
        { name: 'Sheep', method: () => gameSoundsService.playSheepSound(), description: 'Sheep bleating' },
        { name: 'Cow', method: () => gameSoundsService.playCowSound(), description: 'Cow mooing' },
        { name: 'Goat', method: () => gameSoundsService.playSheepSound(), description: 'Goat bleating' },
        { name: 'Horse', method: () => gameSoundsService.playHorseSound(), description: 'Horse neighing' },
        { name: 'Dog', method: () => gameSoundsService.playDogSound(), description: 'Dog barking' },
        { name: 'Cat', method: () => gameSoundsService.playCatSound(), description: 'Cat meowing' },
        { name: 'Pig', method: () => gameSoundsService.playPigSound(), description: 'Pig grunting' },
        { name: 'Chicken', method: () => gameSoundsService.playBirdSound(), description: 'Chicken clucking' },
        { name: 'Duck', method: () => gameSoundsService.playDuckSound(), description: 'Duck quacking' },
        { name: 'Rooster', method: () => gameSoundsService.playRoosterSound(), description: 'Rooster crowing' },
        { name: 'Camel', method: () => gameSoundsService.playCamelSound(), description: 'Camel bellowing' },
      ]
    },
    {
      name: 'Animals - Wild Predators',
      icon: <Bug className="w-4 h-4" />,
      sounds: [
        { name: 'Wolf', method: () => gameSoundsService.playWolfSound(), description: 'Wolf howling' },
        { name: 'Bear', method: () => gameSoundsService.playBearSound(), description: 'Bear growling' },
        { name: 'Tiger', method: () => gameSoundsService.playTigerSound(), description: 'Tiger roaring' },
        { name: 'Lion', method: () => gameSoundsService.playTigerSound(), description: 'Lion roaring' },
        { name: 'Crocodile', method: () => gameSoundsService.playCrocodileSound(), description: 'Crocodile hissing' },
        { name: 'Snake', method: () => gameSoundsService.playSnakeSound(), description: 'Snake hissing' },
        { name: 'Eagle', method: () => gameSoundsService.playEagleSound(), description: 'Eagle screeching' },
      ]
    },
    {
      name: 'Animals - Wild Prey',
      icon: <Bug className="w-4 h-4" />,
      sounds: [
        { name: 'Deer', method: () => gameSoundsService.playDogSound(), description: 'Deer call' },
        { name: 'Rabbit', method: () => gameSoundsService.playRabbitSound(), description: 'Rabbit squeak' },
        { name: 'Fish', method: () => gameSoundsService.playFishSound(), description: 'Fish splash' },
        { name: 'Elephant', method: () => gameSoundsService.playElephantSound(), description: 'Elephant trumpeting' },
        { name: 'Monkey', method: () => gameSoundsService.playMonkeySound(), description: 'Monkey chattering' },
        { name: 'Frog', method: () => gameSoundsService.playFrogSound(), description: 'Frog croaking' },
        { name: 'Cricket', method: () => gameSoundsService.playCricketSound(), description: 'Cricket chirping' },
        { name: 'Owl', method: () => gameSoundsService.playOwlSound(), description: 'Owl hooting' },
      ]
    },
    {
      name: 'Gameplay Effects (Proposed)',
      icon: <Bell className="w-4 h-4" />,
      sounds: [
        { name: 'NPC Talking', method: () => gameSoundsService.playNpcTalkSound(), description: 'SNES-style speech beeps' },
        { name: 'Level Up', method: () => gameSoundsService.playLevelUpFanfareSound(), description: 'Character progression fanfare' },
        { name: 'Spell Cast', method: () => gameSoundsService.playSpellCastSound(), description: 'Magic casting effect' },
        { name: 'Merchant Bell', method: () => gameSoundsService.playMerchantBellSound(), description: 'Shop entrance bell' },
        { name: 'Puzzle Solved', method: () => gameSoundsService.playPuzzleSolvedSound(), description: 'Quest completion chord' },
      ]
    },
    {
      name: 'Weather Effects',
      icon: <Bell className="w-4 h-4" />,
      sounds: [
        { name: 'Rain', method: () => gameSoundsService.playRainSound(), description: 'Gentle looping rain sounds' },
        { name: 'Heavy Rain & Thunder', method: () => gameSoundsService.playHeavyRainSound(), description: 'Intense storm with thunder' },
        { name: 'Stop Rain', method: () => gameSoundsService.stopRainSounds(), description: 'Stops all rain effects' },
      ]
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Sound Test Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {soundCategories.map((category) => (
              <div key={category.name} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-purple-400">{category.icon}</div>
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {category.sounds.map((sound) => (
                    <button
                      key={sound.name}
                      onClick={() => playSound(sound.name, sound.method)}
                      className={`relative p-3 rounded-lg border transition-all duration-200 ${
                        playingSound === sound.name
                          ? 'bg-purple-600/30 border-purple-500 scale-95'
                          : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="text-sm font-medium text-white mb-1">
                        {sound.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {sound.description}
                      </div>
                      {playingSound === sound.name && (
                        <div className="absolute top-1 right-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Volume Control */}
          <div className="mt-6 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Master Volume</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  onChange={(e) => gameSoundsService.setVolume(parseInt(e.target.value) / 100)}
                  className="w-32"
                />
                <button
                  onClick={() => gameSoundsService.toggleMute()}
                  className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                >
                  {gameSoundsService.getIsMuted() ? 'Unmute' : 'Mute'}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-xs text-slate-500 text-center">
            Click any button to test the sound. The purple pulse indicates the sound is playing.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundTestPanel;