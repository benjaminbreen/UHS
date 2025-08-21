import React, { useMemo } from 'react';
import { Item } from '../../types';

interface GenerativeItemIconProps {
  item: Item;
  size?: number;
  className?: string;
}

const GenerativeItemIcon: React.FC<GenerativeItemIconProps> = ({ item, size = 48, className = '' }) => {
  
  // Enhanced color extraction with navy and more colors
  const getItemColor = (): { primary: string; secondary: string; accent: string } => {
    const name = item.name.toLowerCase();
    const material = (item.material || '').toLowerCase();
    
    // Extended color map with more specific colors
    const colorMap: Record<string, string> = {
      // Blues
      'navy': '#001f3f',
      'blue': '#4169e1',
      'royal blue': '#4169e1',
      'cobalt': '#0047ab',
      'indigo': '#4b0082',
      'sapphire': '#0f52ba',
      'turquoise': '#40e0d0',
      'teal': '#008080',
      'azure': '#007fff',
      'cerulean': '#007ba7',
      
      // Reds
      'red': '#dc143c',
      'crimson': '#dc143c',
      'scarlet': '#ff2400',
      'ruby': '#e0115f',
      'burgundy': '#800020',
      'maroon': '#800000',
      'rose': '#ff007f',
      'coral': '#ff7f50',
      'vermillion': '#e34234',
      
      // Greens
      'green': '#228b22',
      'emerald': '#50c878',
      'jade': '#00a86b',
      'olive': '#808000',
      'forest': '#228b22',
      'mint': '#98ff98',
      'sage': '#9caf88',
      
      // Yellows/Golds
      'yellow': '#ffd700',
      'gold': '#ffd700',
      'golden': '#ffd700',
      'amber': '#ffbf00',
      'honey': '#ffb300',
      'mustard': '#ffdb58',
      'saffron': '#f4c430',
      
      // Purples
      'purple': '#800080',
      'violet': '#8b00ff',
      'lavender': '#b57edc',
      'plum': '#8e4585',
      'mauve': '#e0b0ff',
      
      // Neutrals
      'black': '#1a1a1a',
      'white': '#f8f8f8',
      'gray': '#808080',
      'grey': '#808080',
      'silver': '#c0c0c0',
      'bronze': '#cd7f32',
      'copper': '#b87333',
      'brass': '#b5a642',
      'iron': '#434b4d',
      'steel': '#71797e',
      
      // Browns/Tans
      'brown': '#8b4513',
      'tan': '#d2b48c',
      'beige': '#f5f5dc',
      'khaki': '#c3b091',
      'chocolate': '#7b3f00',
      'sienna': '#a0522d',
      'umber': '#635147',
      
      // Other
      'orange': '#ff8c00',
      'pink': '#ffc0cb',
      'ivory': '#fffff0',
      'pearl': '#faf0e6',
      'obsidian': '#1a1a1a',
      'crystal': '#e0f7fa',
      'diamond': '#b9f2ff'
    };
    
    // First check if item has a color field (from character generation)
    let primaryColor = '#8b7355'; // Default brownish
    if (item.color) {
      const itemColorLower = item.color.toLowerCase();
      if (colorMap[itemColorLower]) {
        primaryColor = colorMap[itemColorLower];
      }
    } else {
      // Otherwise check name for colors
      for (const [color, hex] of Object.entries(colorMap)) {
        if (name.includes(color)) {
          primaryColor = hex;
          break;
        }
      }
    }
    
    // If no color in name, check material
    if (primaryColor === '#8b7355') {
      // Material-based colors
      const materialColors: Record<string, string> = {
        'leather': '#8b4513',
        'hide': '#704214',
        'fur': '#5c4033',
        'pelt': '#654321',
        'iron': '#434b4d',
        'steel': '#71797e',
        'bronze': '#cd7f32',
        'copper': '#b87333',
        'brass': '#b5a642',
        'gold': '#ffd700',
        'silver': '#c0c0c0',
        'wood': '#966f33',
        'oak': '#806517',
        'pine': '#8b7355',
        'bamboo': '#d2b48c',
        'stone': '#918e85',
        'marble': '#f0f0f0',
        'granite': '#696969',
        'obsidian': '#1a1a1a',
        'cloth': '#e5e5e5',
        'cotton': '#f0f0f0',
        'wool': '#d3d3d3',
        'silk': '#f5f5dc',
        'linen': '#faf0e6',
        'velvet': '#4b0049',
        'satin': '#faebd7',
        'hemp': '#907874',
        'jute': '#c4b5a0',
        'straw': '#d4a76a',
        'glass': '#a8d8ea',
        'crystal': '#e0f7fa',
        'bone': '#f5f5dc',
        'ivory': '#fffff0',
        'horn': '#4a4a4a',
        'feather': '#daa520',
        'plant': '#567d46',
        'herb': '#567d46',
        'flower': '#ff69b4',
        'clay': '#b87333',
        'ceramic': '#d4a76a',
        'porcelain': '#ffffff'
      };
      
      for (const [mat, color] of Object.entries(materialColors)) {
        if (material.includes(mat)) {
          primaryColor = color;
          break;
        }
      }
    }
    
    // Generate secondary and accent colors based on primary
    const darken = (hex: string, percent: number) => {
      const num = parseInt(hex.slice(1), 16);
      const r = Math.max(0, (num >> 16) - Math.round(255 * percent));
      const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * percent));
      const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * percent));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };
    
    const lighten = (hex: string, percent: number) => {
      const num = parseInt(hex.slice(1), 16);
      const r = Math.min(255, (num >> 16) + Math.round(255 * percent));
      const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * percent));
      const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * percent));
      return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    };
    
    return {
      primary: primaryColor,
      secondary: darken(primaryColor, 0.2),
      accent: lighten(primaryColor, 0.2)
    };
  };

  // Comprehensive item categorization
  const getItemCategory = (): string => {
    const name = item.name.toLowerCase();
    const slot = item.equipmentSlot;
    const cat = item.category?.toLowerCase() || '';
    const baseId = item.baseId?.toLowerCase() || '';
    
    // === WEAPONS ===
    if (slot === 'main_hand' || slot === 'off_hand' || item.wieldable || cat.includes('weapon')) {
      if (name.includes('sword') || name.includes('blade') || name.includes('sabre') || name.includes('scimitar') || name.includes('cutlass')) return 'sword';
      if (name.includes('dagger') || name.includes('knife') || name.includes('dirk') || name.includes('stiletto')) return 'dagger';
      if (name.includes('axe') || name.includes('hatchet') || name.includes('tomahawk')) return 'axe';
      if (name.includes('hammer') || name.includes('mace') || name.includes('club') || name.includes('mallet')) return 'hammer';
      if (name.includes('spear') || name.includes('lance') || name.includes('pike') || name.includes('javelin') || name.includes('trident')) return 'spear';
      if (name.includes('bow') || name.includes('crossbow')) return 'bow';
      if (name.includes('arrow') || name.includes('bolt') || name.includes('quiver')) return 'arrow';
      if (name.includes('staff') || name.includes('wand') || name.includes('rod') || name.includes('scepter')) return 'staff';
      if (name.includes('whip') || name.includes('flail') || name.includes('lash')) return 'whip';
      if (name.includes('shield') || name.includes('buckler')) return 'shield';
      if (name.includes('stick') || baseId.includes('stick')) return 'stick';
      if (name.includes('sickle') || name.includes('scythe')) return 'sickle';
    }
    
    // === HEADGEAR ===
    if (slot === 'head') {
      // Veils and wraps
      if (name.includes('veil') || name.includes('wimple') || name.includes('coif') || name.includes('hijab')) return 'veil';
      if (name.includes('keffiyeh') || name.includes('headwrap') || name.includes('gele') || name.includes('bandana')) return 'headwrap';
      
      // Formal headwear
      if (name.includes('crown') || name.includes('tiara') || name.includes('coronet') || name.includes('diadem')) return 'crown';
      if (name.includes('circlet') || name.includes('wreath') || name.includes('headdress')) return 'circlet';
      
      // Turbans
      if (name.includes('turban') || name.includes('pheta') || name.includes('safa') || name.includes('pagri')) return 'turban';
      
      // Hats
      if (name.includes('hat') || name.includes('cap') || name.includes('beret') || name.includes('bonnet')) return 'hat';
      if (name.includes('hood') || name.includes('cowl')) return 'hood';
      if (name.includes('helmet') || name.includes('helm')) return 'helmet';
      if (name.includes('chullo')) return 'chullo';
      
      // Hair ornaments
      if (name.includes('tikka') || name.includes('passa') || name.includes('maang')) return 'hair_ornament';
    }
    
    // === TORSO/BODY ===
    if (slot === 'torso') {
      // Robes and gowns
      if (name.includes('robe') || name.includes('kaftan') || name.includes('caftan') || name.includes('boubou') || name.includes('agbada')) return 'robe';
      if (name.includes('gown') || name.includes('dress') || name.includes('frock')) return 'gown';
      if (name.includes('hanfu') || name.includes('qipao') || name.includes('kimono')) return 'asian_robe';
      if (name.includes('toga') || name.includes('stola') || name.includes('peplos')) return 'toga';
      if (name.includes('sari') || name.includes('lehenga')) return 'sari';
      
      // Fitted tops
      if (name.includes('tunic') || name.includes('kirtle')) return 'tunic';
      if (name.includes('jerkin') || name.includes('doublet') || name.includes('vest')) return 'jerkin';
      if (name.includes('bodice') || name.includes('corset')) return 'bodice';
      if (name.includes('choli') || name.includes('blouse')) return 'blouse';
      if (name.includes('shirt') || name.includes('chemise')) return 'shirt';
      
      // Outerwear
      if (name.includes('surcoat') || name.includes('houppelande') || name.includes('coat')) return 'coat';
      if (name.includes('cloak') || name.includes('mantle')) return 'cloak';
      if (name.includes('poncho')) return 'poncho';
      if (name.includes('apron')) return 'apron';
      
      // Suits
      if (name.includes('suit') || name.includes('tailcoat') || name.includes('bandhgala')) return 'suit';
      
      // Hide/primitive
      if (name.includes('hide') || name.includes('pelt') || name.includes('fur')) return 'hide';
    }
    
    // === LEGS ===
    if (slot === 'legs') {
      if (name.includes('trouser') || name.includes('pant') || name.includes('breeches') || name.includes('overalls')) return 'trousers';
      if (name.includes('hose') || name.includes('leggings') || name.includes('tights')) return 'hose';
      if (name.includes('dhoti') || name.includes('lungi')) return 'dhoti';
      if (name.includes('churidar') || name.includes('pajama') || name.includes('salwar')) return 'churidar';
      if (name.includes('short')) return 'shorts';
      if (name.includes('skirt') || name.includes('kilt')) return 'skirt';
    }
    
    // === FOOTWEAR ===
    if (slot === 'feet') {
      if (name.includes('boot')) return 'boots';
      if (name.includes('sandal') || name.includes('chappal')) return 'sandals';
      if (name.includes('shoe') || name.includes('loafer') || name.includes('pump') || name.includes('flat')) return 'shoes';
      if (name.includes('clog') || name.includes('sabot')) return 'clogs';
      if (name.includes('moccasin')) return 'moccasin';
      if (name.includes('jutti') || name.includes('khussa') || name.includes('mojari')) return 'jutti';
      if (name.includes('slipper')) return 'slippers';
    }
    
    // === JEWELRY ===
    if (slot === 'amulet' || slot === 'ring1' || slot === 'ring2') {
      if (name.includes('ring') || slot.includes('ring')) return 'ring';
      if (name.includes('amulet') || name.includes('pendant') || name.includes('locket')) return 'amulet';
      if (name.includes('necklace') || name.includes('choker') || name.includes('mala') || name.includes('haar')) return 'necklace';
      if (name.includes('bracelet') || name.includes('armlet') || name.includes('bangle') || name.includes('kada') || name.includes('vanki')) return 'bracelet';
      if (name.includes('brooch') || name.includes('pin') || name.includes('cufflink') || name.includes('tupu')) return 'brooch';
      if (name.includes('earring')) return 'earring';
      if (name.includes('anklet') || name.includes('payal')) return 'anklet';
    }
    
    // === FOOD & DRINK ===
    if (cat.includes('food') || cat.includes('consumable')) {
      // Staples
      if (name.includes('bread') || name.includes('loaf')) return 'bread';
      if (name.includes('rice') || name.includes('grain') || name.includes('wheat') || name.includes('barley')) return 'grain';
      if (name.includes('potato') || name.includes('yam') || name.includes('tuber')) return 'potato';
      if (name.includes('corn') || name.includes('maize')) return 'corn';
      if (name.includes('bean') || name.includes('lentil') || name.includes('pea') || name.includes('dal')) return 'beans';
      
      // Produce
      if (name.includes('fruit') || name.includes('apple') || name.includes('berry') || name.includes('grape')) return 'fruit';
      if (name.includes('vegetable') || name.includes('carrot') || name.includes('cabbage')) return 'vegetable';
      if (name.includes('mushroom') || name.includes('fungus')) return 'mushroom';
      if (name.includes('nut') || name.includes('almond') || name.includes('walnut')) return 'nut';
      
      // Ingredients
      if (name.includes('sugar') || name.includes('honey')) return 'sugar';
      if (name.includes('oil') || name.includes('butter') || name.includes('ghee')) return 'oil';
      if (name.includes('spice') || name.includes('pepper') || name.includes('cinnamon')) return 'spice';
      if (name.includes('salt')) return 'salt';
      if (name.includes('flour')) return 'flour';
      
      // Prepared food
      if (name.includes('meat') || name.includes('pork') || name.includes('beef') || name.includes('chicken')) return 'meat';
      if (name.includes('fish') || name.includes('salmon') || name.includes('cod')) return 'fish';
      if (name.includes('cheese') || name.includes('dairy')) return 'cheese';
      if (name.includes('soup') || name.includes('stew')) return 'soup';
      
      // Drinks
      if (name.includes('water') || name.includes('flask')) return 'flask';
      if (name.includes('wine') || name.includes('ale') || name.includes('beer') || name.includes('mead')) return 'bottle';
      if (name.includes('potion')) return 'potion';
    }
    
    // === TOOLS ===
    if (cat.includes('tool') || baseId.includes('tool')) {
      // Crafting tools
      if (name.includes('hammer')) return 'hammer';
      if (name.includes('chisel')) return 'chisel';
      if (name.includes('tongs')) return 'tongs';
      if (name.includes('bellows')) return 'bellows';
      if (name.includes('spindle')) return 'spindle';
      if (name.includes('loom')) return 'loom';
      if (name.includes('needle')) return 'needle';
      if (name.includes('quill') || name.includes('pen')) return 'quill';
      if (name.includes('brush')) return 'brush';
      if (name.includes('carder')) return 'carder';
      if (name.includes('anvil')) return 'anvil';
      if (name.includes('churn')) return 'churn';
      
      // Farming tools
      if (name.includes('plow') || name.includes('plough')) return 'plow';
      if (name.includes('scythe')) return 'scythe';
      if (name.includes('sickle')) return 'sickle';
      if (name.includes('flail')) return 'flail';
      if (name.includes('hoe')) return 'hoe';
      if (name.includes('rake')) return 'rake';
      if (name.includes('shovel') || name.includes('spade')) return 'shovel';
      
      // General tools
      if (name.includes('rope')) return 'rope';
      if (name.includes('bucket') || name.includes('pail')) return 'bucket';
      if (name.includes('basket')) return 'basket';
      if (name.includes('scale')) return 'scale';
      if (name.includes('whetstone')) return 'whetstone';
      if (name.includes('key')) return 'key';
      if (name.includes('lock')) return 'lock';
      if (name.includes('lantern') || name.includes('lamp')) return 'lantern';
      if (name.includes('candle')) return 'candle';
      if (name.includes('torch')) return 'torch';
    }
    
    // === CONTAINERS ===
    if (name.includes('bottle') || name.includes('vial')) return 'bottle';
    if (name.includes('gourd') || name.includes('flask')) return 'gourd';
    if (name.includes('pot') || name.includes('jar') || name.includes('urn')) return 'pot';
    if (name.includes('bag') || name.includes('sack') || name.includes('pouch')) return 'bag';
    if (name.includes('barrel') || name.includes('cask')) return 'barrel';
    if (name.includes('chest') || name.includes('coffer')) return 'chest';
    if (name.includes('box') || name.includes('crate')) return 'box';
    if (name.includes('bowl')) return 'bowl';
    if (name.includes('cup') || name.includes('goblet')) return 'cup';
    if (name.includes('amphora')) return 'amphora';
    
    // === DOCUMENTS ===
    if (name.includes('scroll') || name.includes('parchment')) return 'scroll';
    if (name.includes('book') || name.includes('tome') || name.includes('text')) return 'book';
    if (name.includes('letter') || name.includes('document') || name.includes('paper')) return 'document';
    if (name.includes('map') || name.includes('chart')) return 'map';
    
    // === NAVIGATION ===
    if (name.includes('compass')) return 'compass';
    if (name.includes('sextant')) return 'sextant';
    
    // === MATERIALS ===
    if (name.includes('ore') || name.includes('ingot')) return 'ore';
    if (name.includes('cloth') || name.includes('fabric') || name.includes('textile')) return 'cloth';
    if (name.includes('leather') || name.includes('hide') || name.includes('pelt')) return 'leather';
    if (name.includes('wood') || name.includes('plank') || name.includes('timber')) return 'wood';
    if (name.includes('stone') || name.includes('rock') || name.includes('brick')) return 'stone';
    if (name.includes('herb') || name.includes('plant') || name.includes('leaf')) return 'herb';
    if (name.includes('bone') || name.includes('ivory')) return 'bone';
    if (name.includes('feather')) return 'feather';
    if (name.includes('thread') || name.includes('yarn') || name.includes('string')) return 'thread';
    if (name.includes('bead')) return 'bead';
    if (name.includes('gem') || name.includes('jewel') || name.includes('crystal')) return 'gem';
    
    // === RELIGIOUS/MAGICAL ===
    if (name.includes('prayer') || name.includes('bead') || name.includes('rosary')) return 'prayer_beads';
    if (name.includes('incense')) return 'incense';
    if (name.includes('artifact') || name.includes('relic')) return 'artifact';
    if (name.includes('talisman') || name.includes('charm')) return 'talisman';
    
    // === MISCELLANEOUS ===
    if (name.includes('coin') || name.includes('currency')) return 'coin';
    if (name.includes('bandage') || name.includes('gauze')) return 'bandage';
    if (name.includes('soap')) return 'soap';
    if (name.includes('mirror')) return 'mirror';
    if (name.includes('comb')) return 'comb';
    if (name.includes('dice')) return 'dice';
    if (name.includes('flute') || name.includes('pipe') || name.includes('whistle')) return 'flute';
    if (name.includes('drum')) return 'drum';
    if (name.includes('bell')) return 'bell';
    
    return 'generic';
  };

  // Generate pixelated SVG icon based on category
  const renderIcon = useMemo(() => {
    const category = getItemCategory();
    const colors = getItemColor();
    const pixelSize = size / 24; // 24x24 pixel grid for higher resolution
    
    // Helper to create a pixel (slightly larger to avoid gaps)
    const px = (x: number, y: number, color: string, opacity: number = 1) => 
      `<rect x="${x * pixelSize - 0.5}" y="${y * pixelSize - 0.5}" width="${pixelSize + 1}" height="${pixelSize + 1}" fill="${color}" opacity="${opacity}" stroke="none"/>`;
    
    // Helper to create multiple pixels
    const pixels = (coords: [number, number][], color: string, opacity: number = 1) =>
      coords.map(([x, y]) => px(x, y, color, opacity)).join('');
    
    // Helper for gradient effects (Stardew Valley style)
    const gradient = (coords: [number, number][], baseColor: string, shadeSteps: number = 3) => {
      let result = '';
      const lighten = (hex: string, percent: number) => {
        const num = parseInt(hex.slice(1), 16);
        const r = Math.min(255, (num >> 16) + Math.round(255 * percent));
        const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * percent));
        const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * percent));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
      };
      
      coords.forEach(([x, y], i) => {
        const shade = Math.floor((i / coords.length) * shadeSteps) / shadeSteps;
        result += px(x, y, lighten(baseColor, shade * 0.2), 1);
      });
      return result;
    };
    
    let svgContent = '';
    
    // Render based on category with actual pixel art
    switch (category) {
      case 'sword':
        // Warm metallic blade with Stardew Valley style shading
        svgContent = pixels([
          // Blade tip
          [12,2],
        ], '#F5F5F5') +
        pixels([
          // Blade left edge (darker for depth)
          [11,3],[11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],[11,12],[11,13],
        ], '#A8A8A8') +
        pixels([
          // Blade center (bright with warm tint)
          [12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],
        ], '#E8E8DC') +
        pixels([
          // Blade right edge (medium with warm shadow)
          [13,3],[13,4],[13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[13,11],[13,12],[13,13],
        ], '#C0C0B0') +
        pixels([
          // Fuller shine (blade center groove)
          [12,4],[12,6],[12,8],[12,10],[12,12],
        ], '#FFFFFF', 0.6) +
        pixels([
          // Guard outer edges (darker gold)
          [8,14],[9,14],[15,14],[16,14],
        ], '#B8860B') +
        pixels([
          // Guard center (bright gold)
          [10,14],[11,14],[12,14],[13,14],[14,14],
        ], '#DAA520') +
        pixels([
          // Guard highlights
          [11,14],[13,14],
        ], '#FFD700', 0.5) +
        pixels([
          // Handle leather (warm dark brown)
          [11,15],[13,15],
          [11,16],[13,16],
          [11,17],[13,17],
          [11,18],[13,18],
          [11,19],[13,19],
        ], '#5C4033') +
        pixels([
          // Handle center (lighter brown)
          [12,15],
          [12,16],
          [12,17],
          [12,18],
          [12,19],
        ], '#8B6F47') +
        pixels([
          // Handle highlights
          [12,15],[12,17],[12,19],
        ], '#A0826D', 0.7) +
        pixels([
          // Pommel base (gold)
          [10,20],[14,20],
        ], '#B8860B') +
        pixels([
          // Pommel center
          [11,20],[12,20],[13,20],
          [11,21],[12,21],[13,21],
        ], '#DAA520') +
        pixels([
          // Pommel gem/highlight
          [12,20],
        ], '#FFE4B5', 0.8);
        break;
        
      case 'dagger':
        svgContent = pixels([
          // Blade
          [8,3],[8,4],[8,5],[8,6],[8,7],
          [7,4],[7,5],[7,6],
          [9,4],[9,5],[9,6],
        ], colors.accent) +
        pixels([
          // Guard
          [6,8],[7,8],[8,8],[9,8],[10,8],
        ], colors.secondary) +
        pixels([
          // Handle
          [8,9],[8,10],[8,11],
        ], colors.primary);
        break;
        
      case 'axe':
        svgContent = pixels([
          // Handle
          [8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],
        ], colors.primary) +
        pixels([
          // Axe head
          [5,3],[6,3],[7,3],[9,3],[10,3],[11,3],
          [4,4],[5,4],[6,4],[7,4],[9,4],[10,4],[11,4],[12,4],
          [5,5],[6,5],[7,5],[9,5],[10,5],[11,5],
        ], colors.secondary) +
        pixels([
          // Blade edge
          [3,4],[13,4],
        ], colors.accent);
        break;
        
      case 'shield':
        svgContent = pixels([
          // Shield body
          [6,3],[7,3],[8,3],[9,3],[10,3],
          [5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],
          [5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],
          [5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],
          [5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
          [5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],
          [6,9],[7,9],[8,9],[9,9],[10,9],
          [6,10],[7,10],[8,10],[9,10],[10,10],
          [7,11],[8,11],[9,11],
          [8,12],
        ], colors.primary) +
        pixels([
          // Shield boss/decoration
          [7,5],[8,5],[9,5],
          [7,6],[8,6],[9,6],
          [7,7],[8,7],[9,7],
        ], colors.accent) +
        pixels([
          // Shield rim
          [6,3],[10,3],
          [5,4],[11,4],
          [5,9],[11,9],
          [6,10],[10,10],
        ], colors.secondary);
        break;
        
      case 'bow':
        svgContent = pixels([
          // Bow string
          [8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],
        ], colors.accent, 0.6) +
        pixels([
          // Bow body
          [6,2],[5,3],[4,4],[4,5],[3,6],[3,7],[3,8],[4,9],[4,10],[5,11],[6,12],
          [10,2],[11,3],[12,4],[12,5],[13,6],[13,7],[13,8],[12,9],[12,10],[11,11],[10,12],
        ], colors.primary) +
        pixels([
          // Bow grip
          [7,7],[8,7],[9,7],
        ], colors.secondary);
        break;
        
      case 'staff':
        svgContent = pixels([
          // Staff body
          [8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
          [7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],
        ], colors.primary) +
        pixels([
          // Crystal/orb at top
          [6,1],[7,1],[8,1],[9,1],[10,1],
          [6,2],[10,2],
          [6,3],[10,3],
          [7,4],[8,4],[9,4],
        ], colors.accent) +
        pixels([
          // Decorative bands
          [6,6],[7,6],[8,6],[9,6],[10,6],
          [6,10],[7,10],[8,10],[9,10],[10,10],
        ], colors.secondary);
        break;
        
      case 'hat':
        svgContent = pixels([
          // Brim
          [4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],
          [3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],
        ], colors.secondary) +
        pixels([
          // Crown
          [5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
          [5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],
          [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
        ], colors.primary) +
        pixels([
          // Top
          [6,6],[7,6],[8,6],[9,6],[10,6],
        ], colors.primary) +
        pixels([
          // Hat band
          [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
        ], colors.accent);
        break;
        
      case 'helmet':
        svgContent = pixels([
          // Main helmet
          [5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],
          [4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],
          [4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],
          [4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],
          [4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],
          [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
        ], colors.primary) +
        pixels([
          // Visor/face guard
          [5,9],[6,9],[10,9],[11,9],
          [5,10],[6,10],[10,10],[11,10],
        ], colors.secondary) +
        pixels([
          // Plume/decoration
          [7,3],[8,3],[9,3],
          [7,2],[8,2],[9,2],
        ], colors.accent);
        break;
        
      case 'crown':
        svgContent = pixels([
          // Base band
          [4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],
          [4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],
        ], colors.primary) +
        pixels([
          // Points
          [4,8],[4,7],[4,6],
          [6,8],[6,7],[6,6],[6,5],
          [8,8],[8,7],[8,6],[8,5],[8,4],
          [10,8],[10,7],[10,6],[10,5],
          [12,8],[12,7],[12,6],
        ], colors.primary) +
        pixels([
          // Jewels
          [4,6],[8,4],[12,6],
        ], colors.accent) +
        pixels([
          // Decorative elements
          [6,9],[8,9],[10,9],
        ], colors.secondary);
        break;
        
      case 'tunic':
      case 'shirt':
        // Warm fabric with soft shading
        svgContent = pixels([
          // Collar
          [11,5],[12,5],[13,5],
        ], colors.secondary || '#8B7355') +
        pixels([
          // Body main
          [10,6],[11,6],[12,6],[13,6],[14,6],
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [10,14],[11,14],[12,14],[13,14],[14,14],
        ], colors.primary || '#D2B48C') +
        pixels([
          // Left sleeve
          [7,7],[8,7],
          [7,8],[8,8],
          [7,9],[8,9],
        ], colors.primary || '#D2B48C') +
        pixels([
          // Right sleeve
          [16,7],[17,7],
          [16,8],[17,8],
          [16,9],[17,9],
        ], colors.primary || '#D2B48C') +
        pixels([
          // Shadow/folds
          [9,8],[9,10],[9,12],
          [15,8],[15,10],[15,12],
          [11,13],[13,13],
        ], colors.secondary || '#A0826D', 0.3) +
        pixels([
          // Highlights
          [12,7],[12,9],[12,11],
        ], '#FFFFFF', 0.2) +
        pixels([
          // Buttons
          [12,8],[12,10],[12,12],
        ], colors.accent || '#8B7355', 0.8);
        break;
        
      case 'robe':
        svgContent = pixels([
          // Hood/collar
          [6,3],[7,3],[8,3],[9,3],[10,3],
          [5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],
        ], colors.secondary) +
        pixels([
          // Body
          [5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],
          [4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],
          [4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],
          [4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],
          [4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],
          [3,10],[4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],
          [3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],
          [3,12],[4,12],[5,12],[6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[13,12],
          [3,13],[4,13],[5,13],[6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],
        ], colors.primary) +
        pixels([
          // Belt/sash
          [4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],
        ], colors.accent);
        break;
        
      case 'boots':
        svgContent = pixels([
          // Left boot
          [4,8],[5,8],
          [4,9],[5,9],
          [4,10],[5,10],
          [3,11],[4,11],[5,11],[6,11],
          [3,12],[4,12],[5,12],[6,12],
          [3,13],[4,13],[5,13],[6,13],[7,13],
        ], colors.primary) +
        pixels([
          // Right boot
          [10,8],[11,8],
          [10,9],[11,9],
          [10,10],[11,10],
          [9,11],[10,11],[11,11],[12,11],
          [9,12],[10,12],[11,12],[12,12],
          [8,13],[9,13],[10,13],[11,13],[12,13],
        ], colors.primary) +
        pixels([
          // Soles
          [3,14],[4,14],[5,14],[6,14],[7,14],
          [8,14],[9,14],[10,14],[11,14],[12,14],
        ], colors.secondary) +
        pixels([
          // Laces/details
          [4,8],[5,8],[10,8],[11,8],
        ], colors.accent);
        break;
        
      case 'ring':
        svgContent = pixels([
          // Ring band
          [6,7],[7,7],[9,7],[10,7],
          [5,8],[6,8],[10,8],[11,8],
          [5,9],[11,9],
          [5,10],[6,10],[10,10],[11,10],
          [6,11],[7,11],[9,11],[10,11],
        ], colors.primary) +
        pixels([
          // Gem
          [7,8],[8,8],[9,8],
          [7,9],[8,9],[9,9],
          [8,10],
        ], colors.accent);
        break;
        
      case 'necklace':
        svgContent = pixels([
          // Chain
          [6,4],[10,4],
          [5,5],[11,5],
          [4,6],[12,6],
          [4,7],[12,7],
          [4,8],[12,8],
          [5,9],[11,9],
          [6,10],[10,10],
          [7,11],[9,11],
        ], colors.secondary) +
        pixels([
          // Pendant
          [7,12],[8,12],[9,12],
          [7,13],[8,13],[9,13],
          [8,14],
        ], colors.accent);
        break;
        
      case 'potion':
        // Magical potion with glowing liquid
        svgContent = pixels([
          // Cork (warm wood)
          [11,3],[12,3],[13,3],
          [11,4],[12,4],[13,4],
        ], '#8B6F47') +
        pixels([
          // Cork highlight
          [12,3],
        ], '#A0826D', 0.7) +
        pixels([
          // Neck (glass)
          [11,5],[12,5],[13,5],
          [11,6],[12,6],[13,6],
        ], '#E0F7FA', 0.8) +
        pixels([
          // Body outline (glass)
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [9,8],[10,8],[14,8],[15,8],
          [9,9],[15,9],
          [9,10],[15,10],
          [9,11],[15,11],
          [9,12],[15,12],
          [9,13],[15,13],
          [10,14],[11,14],[12,14],[13,14],[14,14],
        ], '#E0F7FA', 0.6) +
        pixels([
          // Magic liquid (glowing)
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
          [11,14],[12,14],[13,14],
        ], colors.accent || '#9370DB') +
        pixels([
          // Liquid glow/bubbles
          [11,11],[13,11],
          [12,12],
        ], '#E6E6FA', 0.8) +
        pixels([
          // Glass shine
          [10,8],[10,9],
          [11,8],
        ], '#FFFFFF', 0.4) +
        pixels([
          // Liquid surface
          [10,10],[11,10],[12,10],[13,10],[14,10],
        ], colors.accent || '#9370DB', 0.7);
        break;
        
      case 'bread':
        // Warm, crusty bread with golden tones
        svgContent = pixels([
          // Top crust (golden brown)
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
        ], '#CD853F') +
        pixels([
          // Crust highlights (lighter golden)
          [10,7],[12,7],[14,7],
        ], '#DEB887', 0.7) +
        pixels([
          // Body (warm beige)
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
          [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
        ], '#F5DEB3') +
        pixels([
          // Score marks (darker slashes)
          [10,8],[12,8],[14,8],
        ], '#8B4513', 0.6) +
        pixels([
          // Bottom shadow
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
        ], '#D2691E', 0.4) +
        pixels([
          // Sesame seeds
          [11,7],[13,7],
          [10,8],[15,8],
        ], '#FFF8DC', 0.8);
        break;
        
      case 'scroll':
        svgContent = pixels([
          // Top roll
          [5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],
          [4,4],[5,4],[11,4],[12,4],
        ], colors.secondary) +
        pixels([
          // Paper
          [5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],
          [5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],
          [5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
          [5,8],[6,8],[7,8],[9,8],[10,8],[11,8],
          [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
          [5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],
          [5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],
        ], colors.primary) +
        pixels([
          // Bottom roll
          [4,12],[5,12],[11,12],[12,12],
          [5,13],[6,13],[7,13],[8,13],[9,13],[10,13],[11,13],
        ], colors.secondary) +
        pixels([
          // Text lines
          [6,6],[7,6],[8,6],[9,6],[10,6],
          [6,8],[7,8],[8,8],[9,8],[10,8],
          [6,10],[7,10],[8,10],[9,10],
        ], colors.accent, 0.5);
        break;
        
      case 'book':
        svgContent = pixels([
          // Cover
          [4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],
          [4,5],[11,5],
          [4,6],[11,6],
          [4,7],[11,7],
          [4,8],[11,8],
          [4,9],[11,9],
          [4,10],[11,10],
          [4,11],[11,11],
          [4,12],[5,12],[6,12],[7,12],[8,12],[9,12],[10,12],[11,12],
        ], colors.primary) +
        pixels([
          // Spine
          [4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],
        ], colors.secondary) +
        pixels([
          // Pages
          [5,5],[6,5],[7,5],[8,5],[9,5],[10,5],
          [5,6],[6,6],[7,6],[8,6],[9,6],[10,6],
          [5,7],[6,7],[7,7],[8,7],[9,7],[10,7],
          [5,8],[6,8],[7,8],[8,8],[9,8],[10,8],
          [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],
          [5,10],[6,10],[7,10],[8,10],[9,10],[10,10],
          [5,11],[6,11],[7,11],[8,11],[9,11],[10,11],
        ], '#f5f5dc') +
        pixels([
          // Title decoration
          [6,6],[7,6],[8,6],[9,6],
          [7,7],[8,7],
        ], colors.accent);
        break;
        
      case 'coin':
        svgContent = pixels([
          // Coin outline
          [6,5],[7,5],[8,5],[9,5],[10,5],
          [5,6],[11,6],
          [4,7],[12,7],
          [4,8],[12,8],
          [4,9],[12,9],
          [5,10],[11,10],
          [6,11],[7,11],[8,11],[9,11],[10,11],
        ], colors.primary) +
        pixels([
          // Inner circle
          [6,6],[7,6],[8,6],[9,6],[10,6],
          [5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
          [5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],
          [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
          [6,10],[7,10],[8,10],[9,10],[10,10],
        ], colors.accent) +
        pixels([
          // Symbol
          [7,7],[8,7],[9,7],
          [8,8],
          [7,9],[8,9],[9,9],
        ], colors.secondary);
        break;
        
      case 'bag':
        svgContent = pixels([
          // Drawstring
          [9,4],[10,4],[14,4],[15,4],
          [8,5],[16,5],
          [7,6],[17,6],
        ], colors.secondary) +
        pixels([
          // Bag body (24x24 resolution)
          [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],
          [6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],[18,8],
          [6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,9],
          [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],[18,10],
          [6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],[18,11],
          [6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],[18,12],
          [6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],[18,13],
          [7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],[17,14],
          [7,15],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],[16,15],[17,15],
          [8,16],[9,16],[10,16],[11,16],[12,16],[13,16],[14,16],[15,16],[16,16],
          [9,17],[10,17],[11,17],[12,17],[13,17],[14,17],[15,17],
          [10,18],[11,18],[12,18],[13,18],[14,18],
        ], colors.primary) +
        pixels([
          // Patch/decoration
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
        ], colors.accent, 0.5);
        break;
        
      case 'stick':
        // Natural wooden stick with realistic bark
        svgContent = pixels([
          // Main stick body (medium brown)
          [7,3],[8,3],
          [8,4],[9,4],
          [9,5],[10,5],
          [10,6],[11,6],
          [11,7],[12,7],
          [12,8],[13,8],
          [13,9],[14,9],
          [14,10],[15,10],
          [15,11],[16,11],
          [16,12],[17,12],
          [17,13],[18,13],
          [17,14],[18,14],
          [17,15],[18,15],
          [16,16],[17,16],
          [16,17],[17,17],
          [15,18],[16,18],
          [15,19],[16,19],
          [14,20],[15,20],
        ], '#8B6F47') +
        pixels([
          // Darker bark lines
          [7,3],[9,5],[11,7],[13,9],[15,11],[17,13],[16,16],[15,18],
        ], '#6B4423', 0.8) +
        pixels([
          // Highlights (lighter wood showing through)
          [8,4],[10,6],[12,8],[14,10],[16,12],[18,14],[17,17],[16,19],
        ], '#A0826D', 0.6) +
        pixels([
          // Branch knot (dark center)
          [12,9],[13,9],
          [12,10],[13,10],
        ], '#4A2C17') +
        pixels([
          // Knot ring
          [11,8],[14,8],
          [11,9],[14,9],
          [11,10],[14,10],
          [11,11],[14,11],
          [12,11],[13,11],
        ], '#654321', 0.5) +
        pixels([
          // Subtle texture
          [9,4],[11,6],[13,8],[15,10],[17,12],
        ], '#5C4033', 0.4);
        break;
        
      case 'torch':
        svgContent = pixels([
          // Flame
          [11,2],[12,2],[13,2],
          [10,3],[11,3],[12,3],[13,3],[14,3],
          [10,4],[11,4],[12,4],[13,4],[14,4],
          [11,5],[12,5],[13,5],
          [12,6],
        ], '#FF6B35') +
        pixels([
          // Inner flame
          [11,3],[12,3],[13,3],
          [11,4],[12,4],[13,4],
        ], '#FFD93D', 0.8) +
        pixels([
          // Torch head (wrapped cloth/pitch)
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [10,8],[11,8],[12,8],[13,8],[14,8],
          [10,9],[11,9],[12,9],[13,9],[14,9],
        ], '#3E2723') +
        pixels([
          // Handle
          [11,10],[12,10],[13,10],
          [11,11],[12,11],[13,11],
          [11,12],[12,12],[13,12],
          [11,13],[12,13],[13,13],
          [11,14],[12,14],[13,14],
          [11,15],[12,15],[13,15],
          [11,16],[12,16],[13,16],
          [11,17],[12,17],[13,17],
          [11,18],[12,18],[13,18],
          [11,19],[12,19],[13,19],
          [11,20],[12,20],[13,20],
        ], '#8B4513') +
        pixels([
          // Handle grip bands
          [11,13],[12,13],[13,13],
          [11,16],[12,16],[13,16],
        ], '#654321', 0.6);
        break;
        
      case 'gourd':
        // Natural gourd with warm earth tones
        svgContent = pixels([
          // Cork/stopper (darker wood)
          [11,2],[12,2],[13,2],
          [11,3],[12,3],[13,3],
        ], '#6B4423') +
        pixels([
          // Cork highlight
          [12,2],
        ], '#8B6F47', 0.8) +
        pixels([
          // Gourd neck (lighter tan)
          [11,4],[12,4],[13,4],
          [10,5],[11,5],[12,5],[13,5],[14,5],
          [10,6],[11,6],[12,6],[13,6],[14,6],
        ], '#DEB887') +
        pixels([
          // Gourd body main (warm orange-brown)
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
          [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
          [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
          [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],
          [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],
          [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
          [8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],
          [9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],
          [10,16],[11,16],[12,16],[13,16],[14,16],
          [11,17],[12,17],[13,17],
        ], '#D2691E') +
        pixels([
          // Gourd shading (darker sides)
          [7,10],[7,11],[7,12],
          [17,10],[17,11],[17,12],
          [8,13],[8,14],
          [16,13],[16,14],
        ], '#A0522D', 0.6) +
        pixels([
          // Gourd highlights
          [10,8],[11,8],[12,8],
          [10,9],[11,9],
          [10,10],
        ], '#F4A460', 0.5) +
        pixels([
          // Natural texture lines
          [9,11],[15,11],
          [10,13],[14,13],
        ], '#8B4513', 0.3) +
        pixels([
          // Leather strap (darker leather)
          [15,7],[16,7],[17,7],[18,7],
          [17,8],[18,8],
        ], '#654321') +
        pixels([
          // Strap highlight
          [16,7],
        ], '#8B6F47', 0.6);
        break;
        
      case 'map':
        svgContent = pixels([
          // Rolled edges
          [4,5],[5,5],[6,5],
          [4,6],[5,6],
          [18,5],[19,5],[20,5],
          [19,6],[20,6],
        ], colors.secondary) +
        pixels([
          // Map paper
          [6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],[16,5],[17,5],[18,5],
          [5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],[17,6],[18,6],[19,6],
          [5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],[18,7],[19,7],
          [5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],[18,8],[19,8],
          [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,9],[19,9],
          [5,10],[6,10],[7,10],[8,10],[9,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],[18,10],[19,10],
          [5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],[18,11],[19,11],
          [5,12],[6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[13,12],[14,12],[15,12],[16,12],[17,12],[18,12],[19,12],
          [5,13],[6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],[18,13],[19,13],
          [5,14],[6,14],[7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],[17,14],[18,14],[19,14],
          [5,15],[6,15],[7,15],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[16,15],[17,15],[18,15],[19,15],
          [5,16],[6,16],[7,16],[8,16],[9,16],[10,16],[11,16],[12,16],[13,16],[14,16],[15,16],[16,16],[17,16],[18,16],[19,16],
          [6,17],[7,17],[8,17],[9,17],[10,17],[11,17],[12,17],[13,17],[14,17],[15,17],[16,17],[17,17],[18,17],
        ], '#F5E6D3') +
        pixels([
          // Coastline
          [7,8],[8,8],[9,8],
          [7,9],[8,9],[10,9],
          [8,10],[9,10],[10,10],[11,10],
          [9,11],[10,11],[11,11],[12,11],
          [10,12],[11,12],[12,12],
        ], '#8B7355', 0.8) +
        pixels([
          // Mountains
          [14,9],[15,9],[16,9],
          [13,10],[14,10],[15,10],[16,10],[17,10],
          [14,11],[15,11],[16,11],
        ], '#696969', 0.7) +
        pixels([
          // X mark (treasure/destination)
          [11,13],[13,13],
          [12,14],
          [11,15],[13,15],
        ], '#DC143C') +
        pixels([
          // Compass rose
          [16,7],
          [15,8],[16,8],[17,8],
          [16,9],
        ], '#2F4F4F', 0.6) +
        pixels([
          // Bottom roll
          [4,18],[5,18],[6,18],
          [4,17],[5,17],
          [18,18],[19,18],[20,18],
          [19,17],[20,17],
        ], colors.secondary);
        break;
        
      case 'compass':
        svgContent = pixels([
          // Outer ring
          [9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],
          [7,6],[8,6],[16,6],[17,6],
          [6,7],[18,7],
          [5,8],[19,8],
          [5,9],[19,9],
          [4,10],[20,10],
          [4,11],[20,11],
          [4,12],[20,12],
          [4,13],[20,13],
          [5,14],[19,14],
          [5,15],[19,15],
          [6,16],[18,16],
          [7,17],[8,17],[16,17],[17,17],
          [9,18],[10,18],[11,18],[12,18],[13,18],[14,18],[15,18],
        ], '#B8860B') +
        pixels([
          // Inner circle
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [9,8],[15,8],
          [8,9],[16,9],
          [7,10],[17,10],
          [7,11],[17,11],
          [7,12],[17,12],
          [7,13],[17,13],
          [8,14],[16,14],
          [9,15],[15,15],
          [10,16],[11,16],[12,16],[13,16],[14,16],
        ], '#F5F5DC') +
        pixels([
          // Needle (pointing north)
          [12,8],[12,9],
          [11,10],[12,10],[13,10],
          [12,11],
        ], '#DC143C') +
        pixels([
          // Needle (pointing south)
          [12,12],[12,13],[12,14],[12,15],
        ], '#2F4F4F', 0.7) +
        pixels([
          // N marking
          [11,6],[13,6],
        ], '#000000', 0.8) +
        pixels([
          // Glass shine
          [9,8],[10,8],[11,8],
          [9,9],[10,9],
        ], '#FFFFFF', 0.3);
        break;
        
      case 'ore':
        svgContent = pixels([
          // Rock base
          [8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],
          [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],
          [6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],
          [6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
          [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
          [6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],
          [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
          [7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
          [8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
          [9,15],[10,15],[11,15],[12,15],[13,15],[14,15],
        ], '#696969') +
        pixels([
          // Ore veins
          [9,7],[10,7],[11,7],
          [10,8],[11,8],[12,8],[13,8],
          [8,9],[9,9],[12,9],
          [11,10],[12,10],[13,10],[14,10],
          [9,11],[10,11],[14,11],
          [10,12],[11,12],[12,12],
        ], colors.accent) +
        pixels([
          // Sparkles
          [10,8],[13,10],[9,11],
        ], '#FFFFFF', 0.6);
        break;
        
      case 'pickaxe':
        svgContent = pixels([
          // Pick head - left point
          [5,6],[6,6],
          [4,7],[5,7],[6,7],
          [3,8],[4,8],[5,8],[6,8],
          [4,9],[5,9],[6,9],
          [5,10],[6,10],
        ], colors.secondary) +
        pixels([
          // Pick head - right point
          [18,6],[19,6],
          [18,7],[19,7],[20,7],
          [18,8],[19,8],[20,8],[21,8],
          [18,9],[19,9],[20,9],
          [18,10],[19,10],
        ], colors.secondary) +
        pixels([
          // Pick head center
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [10,9],[11,9],[12,9],[13,9],[14,9],
        ], colors.primary) +
        pixels([
          // Handle
          [11,10],[12,10],[13,10],
          [11,11],[12,11],[13,11],
          [11,12],[12,12],[13,12],
          [11,13],[12,13],[13,13],
          [11,14],[12,14],[13,14],
          [11,15],[12,15],[13,15],
          [11,16],[12,16],[13,16],
          [11,17],[12,17],[13,17],
          [11,18],[12,18],[13,18],
          [11,19],[12,19],[13,19],
        ], '#8B4513') +
        pixels([
          // Handle grip
          [11,15],[12,15],[13,15],
          [11,17],[12,17],[13,17],
        ], '#654321', 0.7);
        break;
        
      case 'candle':
        svgContent = pixels([
          // Flame
          [12,3],
          [11,4],[12,4],[13,4],
          [12,5],
        ], '#FFD700') +
        pixels([
          // Inner flame
          [12,4],
        ], '#FFFFFF', 0.8) +
        pixels([
          // Wick
          [12,6],[12,7],
        ], '#2F2F2F') +
        pixels([
          // Candle body
          [10,8],[11,8],[12,8],[13,8],[14,8],
          [10,9],[11,9],[12,9],[13,9],[14,9],
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
          [10,14],[11,14],[12,14],[13,14],[14,14],
          [10,15],[11,15],[12,15],[13,15],[14,15],
        ], colors.primary || '#F5E6D3') +
        pixels([
          // Dripping wax
          [9,10],
          [9,11],[9,12],
        ], colors.primary || '#F5E6D3', 0.7) +
        pixels([
          // Candle holder base
          [8,16],[9,16],[10,16],[11,16],[12,16],[13,16],[14,16],[15,16],[16,16],
          [9,17],[10,17],[11,17],[12,17],[13,17],[14,17],[15,17],
          [10,18],[11,18],[12,18],[13,18],[14,18],
        ], colors.secondary || '#B8860B');
        break;
        
      case 'lantern':
        svgContent = pixels([
          // Top handle
          [11,3],[12,3],[13,3],
          [10,4],[14,4],
          [10,5],[14,5],
        ], colors.secondary) +
        pixels([
          // Top cap
          [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],
          [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],
        ], colors.primary) +
        pixels([
          // Glass panels (frame)
          [8,8],[16,8],
          [8,9],[16,9],
          [8,10],[16,10],
          [8,11],[16,11],
          [8,12],[16,12],
          [8,13],[16,13],
          [8,14],[16,14],
          [8,15],[16,15],
        ], colors.primary) +
        pixels([
          // Glass
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
          [9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],
        ], '#87CEEB', 0.3) +
        pixels([
          // Flame inside
          [11,10],[12,10],[13,10],
          [11,11],[12,11],[13,11],
          [12,12],
        ], '#FFD700', 0.9) +
        pixels([
          // Base
          [8,16],[9,16],[10,16],[11,16],[12,16],[13,16],[14,16],[15,16],[16,16],
          [9,17],[10,17],[11,17],[12,17],[13,17],[14,17],[15,17],
        ], colors.primary);
        break;
        
      default:
        // Generic item (warm wooden crate)
        svgContent = pixels([
          // Top face (lighter wood)
          [8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],[16,5],
          [7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],
          [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
        ], colors.accent || '#DEB887') +
        pixels([
          // Front face (medium wood)
          [7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
          [7,15],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],
        ], colors.primary || '#CD853F') +
        pixels([
          // Side face (darker wood)
          [16,7],[17,7],
          [15,8],[16,8],[17,8],
          [15,9],[16,9],[17,9],
          [15,10],[16,10],[17,10],
          [15,11],[16,11],[17,11],
          [15,12],[16,12],[17,12],
          [15,13],[16,13],[17,13],
          [15,14],[16,14],[17,14],
          [15,15],[16,15],[17,15],
        ], colors.secondary || '#A0522D') +
        pixels([
          // Wood grain lines
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
          [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
        ], '#8B4513', 0.3) +
        pixels([
          // Nails/studs
          [8,8],[14,8],
          [8,14],[14,14],
        ], '#696969', 0.8) +
        pixels([
          // Highlights
          [8,6],[10,6],[12,6],[14,6],
          [9,8],[11,8],[13,8],
        ], '#F5DEB3', 0.4);
    }
    
    return svgContent;
  }, [item, size]);

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      dangerouslySetInnerHTML={{ __html: renderIcon }}
    />
  );
};

export default GenerativeItemIcon;