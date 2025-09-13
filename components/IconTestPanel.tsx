import React, { useState, useMemo } from 'react';
import { X, Palette } from 'lucide-react';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { Item } from '../types';

interface IconTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const IconTestPanel: React.FC<IconTestPanelProps> = ({ isOpen, onClose }) => {
  const [selectedQuality, setSelectedQuality] = useState<string>('Common');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');

  // All the icon cases from GenerativeItemIcon.tsx
  const iconCases = useMemo(() => [
    // Weapons
    'sword', 'dagger', 'axe', 'shield', 'bow', 'staff', 'flail', 'whip', 'pickaxe', 'hammer', 'mace', 'sickle',

    // Apparel
    'hat', 'helmet', 'crown', 'tunic', 'shirt', 'robe', 'boots', 'ring', 'necklace', 'trousers', 'sandals',
    'cloak', 'turban', 'headwrap', 'bracelet',

    // Modern Apparel
    'business_suit', 'blazer', 'dress_shirt', 'hoodie', 't_shirt', 'polo_shirt', 'jeans', 'slacks',
    'sneakers', 'dress_shoes', 'tie', 'watch', 'briefcase', 'backpack',

    // Items & Tools
    'potion', 'grain', 'bread', 'scroll', 'book', 'coin', 'bag', 'stick', 'torch', 'gourd', 'map',
    'compass', 'candle', 'lantern', 'flask', 'box',

    // Materials & Resources
    'ore', 'ingot', 'anvil', 'stone', 'wood', 'leather', 'cloth', 'feather', 'gem', 'herb', 'rope',

    // Food & Organic
    'meat', 'fish', 'fruit',

    // Crafted Items
    'pottery'
  ], []);

  const qualities = ['Poor', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const materials = ['', 'Iron', 'Steel', 'Gold', 'Silver', 'Bronze', 'Copper', 'Wood', 'Leather', 'Cloth', 'Stone'];

  // Create test items for each icon case
  // Remove memo to ensure updates when quality/material changes
  const testItems = iconCases.map(iconCase => {
    // Create more realistic item names that will trigger proper categorization
    let itemName = iconCase.charAt(0).toUpperCase() + iconCase.slice(1).replace('_', ' ');

    // Add prefixes/suffixes to match the categorization patterns
    switch(iconCase) {
      case 'rope': itemName = 'Hempen Rope'; break;
      case 'sword': itemName = 'Iron Sword'; break;
      case 'dagger': itemName = 'Sharp Dagger'; break;
      case 'axe': itemName = 'Battle Axe'; break;
      case 'shield': itemName = 'Wooden Shield'; break;
      case 'bow': itemName = 'Hunting Bow'; break;
      case 'staff': itemName = 'Wooden Staff'; break;
      case 'flail': itemName = 'Spiked Flail'; break;  // Changed to ensure it triggers
      case 'whip': itemName = 'Leather Whip'; break;
        case 'pickaxe': itemName = 'Mining Pickaxe'; break;
        case 'hammer': itemName = 'War Hammer'; break;
        case 'mace': itemName = 'Spiked Mace'; break;
        case 'sickle': itemName = 'Farming Sickle'; break;
        case 'hat': itemName = 'Felt Hat'; break;
        case 'helmet': itemName = 'Iron Helmet'; break;
        case 'crown': itemName = 'Golden Crown'; break;
        case 'tunic': itemName = 'Wool Tunic'; break;
        case 'shirt': itemName = 'Cotton Shirt'; break;
        case 'robe': itemName = 'Silk Robe'; break;
        case 'boots': itemName = 'Leather Boots'; break;
        case 'ring': itemName = 'Silver Ring'; break;
        case 'necklace': itemName = 'Pearl Necklace'; break;
        case 'trousers': itemName = 'Cloth Trousers'; break;
        case 'sandals': itemName = 'Leather Sandals'; break;
        case 'cloak': itemName = 'Woolen Cloak'; break;
        case 'turban': itemName = 'Silk Turban'; break;
        case 'headwrap': itemName = 'Cotton Headwrap'; break;
        case 'bracelet': itemName = 'Gold Bracelet'; break;
        case 'flask': itemName = 'Water Flask'; break;
        case 'box': itemName = 'Wooden Box'; break;
        case 'pottery': itemName = 'Clay Lamp'; break;
        case 'bread': itemName = 'Loaf of Bread'; break;
        case 'grain': itemName = 'Wheat Grain'; break;
        case 'meat': itemName = 'Fresh Meat'; break;
        case 'fish': itemName = 'Fresh Fish'; break;
        case 'fruit': itemName = 'Ripe Fruit'; break;
        case 'herb': itemName = 'Healing Herb'; break;
        case 'ore': itemName = 'Iron Ore'; break;
        case 'ingot': itemName = 'Iron Ingot'; break;
        case 'anvil': itemName = 'Blacksmith Anvil'; break;
        case 'stone': itemName = 'Rough Stone'; break;
        case 'wood': itemName = 'Oak Log'; break;
        case 'leather': itemName = 'Tanned Leather'; break;
        case 'cloth': itemName = 'Linen Cloth'; break;
        case 'feather': itemName = 'Eagle Feather'; break;
        case 'gem': itemName = 'Precious Gem'; break;
        case 'torch': itemName = 'Burning Torch'; break;
        case 'gourd': itemName = 'Water Gourd'; break;
        case 'map': itemName = 'Old Map'; break;
        case 'compass': itemName = 'Navigation Compass'; break;
        case 'candle': itemName = 'Wax Candle'; break;
        case 'lantern': itemName = 'Oil Lantern'; break;
        case 'potion': itemName = 'Health Potion'; break;
        case 'scroll': itemName = 'Ancient Scroll'; break;
        case 'book': itemName = 'Leather Book'; break;
        case 'coin': itemName = 'Gold Coin'; break;
        case 'bag': itemName = 'Leather Bag'; break;
        case 'stick': itemName = 'Wooden Stick'; break;
        case 'backpack': itemName = 'Travel Backpack'; break;
        case 'briefcase': itemName = 'Leather Briefcase'; break;
        case 'watch': itemName = 'Pocket Watch'; break;
        case 'tie': itemName = 'Silk Tie'; break;
        case 'business_suit': itemName = 'Business Suit'; break;
        case 'blazer': itemName = 'Navy Blazer'; break;
        case 'dress_shirt': itemName = 'Dress Shirt'; break;
        case 'hoodie': itemName = 'Cotton Hoodie'; break;
        case 't_shirt': itemName = 'Cotton T-Shirt'; break;
        case 'polo_shirt': itemName = 'Polo Shirt'; break;
        case 'jeans': itemName = 'Blue Jeans'; break;
        case 'slacks': itemName = 'Dress Slacks'; break;
        case 'sneakers': itemName = 'Running Sneakers'; break;
        case 'dress_shoes': itemName = 'Leather Dress Shoes'; break;
      }

      const baseItem: Item = {
        id: `test_${iconCase}`,
        baseId: iconCase.toUpperCase(),
        name: itemName,
        description: `Test ${iconCase} item`,
        emoji: '🔷',
        rarity: selectedQuality as any,
        value: 10,
        weight: 1,
        wearable: false,
        stackable: false,
        attack: 0,
        sustenance: 0,
        wieldable: false,
        throwable: false,
        craftingValue: 1,
        category: 'Special' as any,
        material: selectedMaterial || undefined,
        quality: selectedQuality as any
      };
      return baseItem;
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-amber-50 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border-4 border-amber-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6" />
            <h2 className="text-xl font-bold">Generative Icon Test Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-amber-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 bg-amber-100 border-b border-amber-200">
          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Quality:</label>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                className="border border-amber-300 rounded px-3 py-1 bg-white text-amber-900"
              >
                {qualities.map(quality => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">Material:</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="border border-amber-300 rounded px-3 py-1 bg-white text-amber-900"
              >
                {materials.map(material => (
                  <option key={material} value={material}>
                    {material || 'None'}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto text-sm text-amber-700">
              Total Icons: {iconCases.length}
            </div>
          </div>
        </div>

        {/* Icon Grid */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-8 gap-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
            {testItems.map((item, index) => (
              <div key={`${item.id}-${selectedQuality}-${selectedMaterial}`} className="flex flex-col items-center p-2 bg-white rounded border border-amber-200 hover:bg-amber-50 transition-colors">
                <div className="w-12 h-12 flex items-center justify-center mb-2">
                  <GenerativeItemIcon
                    key={`icon-${item.id}-${selectedQuality}-${selectedMaterial}`}
                    item={item}
                    size={48}
                    className="drop-shadow-sm"
                  />
                </div>
                <div className="text-xs text-center text-amber-900 font-medium leading-tight">
                  {iconCases[index]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-amber-100 p-3 border-t border-amber-200">
          <div className="text-xs text-amber-700 text-center">
            Use this panel to test all generative icon implementations. Change quality and material to see variations.
          </div>
        </div>
      </div>
    </div>
  );
};

export default IconTestPanel;