import React, { useMemo } from 'react';
import { Item } from '../../types';
// Import baseSprites mappings as a fallback/reference system
import { ITEM_ARCHETYPES_MAX, getItemArchetypeMax } from '../../constants/items/baseSprites';
import { getMaterialColorHex } from '../../services/itemGenerationService';

interface GenerativeItemIconProps {
  item: Item;
  size?: number;
  className?: string;
}

const GenerativeItemIcon: React.FC<GenerativeItemIconProps> = ({ item, size = 48, className = '' }) => {

  // Guard against undefined items
  if (!item) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <span style={{ fontSize: size * 0.7 }}>❓</span>
      </div>
    );
  }

  const scaleToFit = 1.15;                      // tweak 1.10–1.18 if needed
  const offset = (size - size * scaleToFit) / 2;
  
  // Enhanced color extraction with navy and more colors
  const getItemColor = (): { primary: string; secondary: string; accent: string } => {
    const name = (item?.name || 'unknown').toLowerCase();
    const material = (item?.material || '').toLowerCase();
    
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
      'reddish': '#ffdb58',
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
      // If it's a hex color, use it directly
      if (item.color.startsWith('#')) {
        primaryColor = item.color;
      } else {
        // Otherwise treat as color name
        const itemColorLower = item.color.toLowerCase();
        if (colorMap[itemColorLower]) {
          primaryColor = colorMap[itemColorLower];
        }
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
    
    // If no color found yet, check material using our service
    if (primaryColor === '#8b7355' && item.material) {
      primaryColor = getMaterialColorHex(item.material);
    }
    
    // Final fallback check for local material mapping  
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
    const name = (item?.name || 'unknown').toLowerCase();
    const slot = item?.equipmentSlot;
    const cat = (item?.category || '').toLowerCase();
    const baseId = (item?.baseId || '').toLowerCase();
    
    // === WEAPONS ===
    if (slot === 'main_hand' || slot === 'off_hand' || item.wieldable || cat.includes('weapon')) {
      if (name.includes('sword') || name.includes('blade') || name.includes('sabre') || name.includes('scimitar') || name.includes('cutlass')) return 'sword';
      if (name.includes('dagger') || name.includes('knife') || name.includes('dirk') || name.includes('stiletto')) return 'dagger';
      if (name.includes('axe') || name.includes('hatchet') || name.includes('tomahawk')) return 'axe';
      if (name.includes('hammer') || name.includes('mace') || name.includes('club') || name.includes('mallet')) return 'hammer';
      if (name.includes('spear') || name.includes('lance') || name.includes('pike') || name.includes('javelin') || name.includes('trident')) return 'spear';
      if (name.includes('bow') || name.includes('crossbow')) return 'bow';
      if (name.includes('sling')) return 'sling';
      if (name.includes('bolas')) return 'bolas';
      if (name.includes('blowgun')) return 'blowgun';
      if (name.includes('chakram')) return 'chakram';
      if (name.includes('shuriken')) return 'shuriken';
      if (name.includes('throwing axe') || name.includes('francisca')) return 'throwing_axe';
      if (name.includes('arrow') || name.includes('bolt') || name.includes('quiver')) return 'arrow';
      if (name.includes('dart')) return 'dart';
      if (name.includes('staff') || name.includes('wand') || name.includes('rod') || name.includes('scepter')) return 'staff';
      if (name.includes('cane')) return 'cane';
      if (name.includes('pole') || name.includes('pike')) return 'pole';
      if (name.includes('crook') || name.includes('shepherd')) return 'crook';
      if (name.includes('flail')) return 'flail';
      if (name.includes('whip') || name.includes('lash')) return 'whip';
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
    
    // === CLOAK SLOT ===
    if (slot === 'cloak') {
      if (name.includes('cloak') || name.includes('mantle') || name.includes('cape')) return 'cloak';
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
      if (name.includes('top') && !name.includes('tank top')) return 'shirt'; // Basic top → shirt

      // Outerwear (coat, poncho, apron - but NOT cloak, that's in its own slot)
      if (name.includes('surcoat') || name.includes('houppelande') || name.includes('coat')) return 'coat';
      if (name.includes('poncho')) return 'poncho';
      if (name.includes('apron')) return 'apron';
      
      // Modern business wear
      if (name.includes('business suit') || name.includes('suit jacket')) return 'business_suit';
      if (name.includes('blazer') || name.includes('sport jacket')) return 'blazer';
      if (name.includes('dress shirt') || name.includes('button-up') || name.includes('button up')) return 'dress_shirt';
      if (name.includes('waistcoat') || name.includes('vest') && !name.includes('safety')) return 'waistcoat';
      
      // Modern casual wear
      if (name.includes('hoodie') || name.includes('sweatshirt') || name.includes('pullover')) return 'hoodie';
      if (name.includes('t-shirt') || name.includes('tee') && !name.includes('tunic')) return 't_shirt';
      if (name.includes('polo') && name.includes('shirt')) return 'polo_shirt';
      if (name.includes('sweater') || name.includes('cardigan') || name.includes('jumper')) return 'sweater';
      if (name.includes('tank top') || name.includes('singlet')) return 'tank_top';
      
      // Traditional suits (fallback)
      if (name.includes('suit') || name.includes('tailcoat') || name.includes('bandhgala')) return 'suit';
      
      // Hide/primitive
      if (name.includes('hide') || name.includes('pelt') || name.includes('fur')) return 'hide';
    }
    
    // === LEGS ===
    if (slot === 'legs') {
      // Modern leg wear
      if (name.includes('jeans') || name.includes('denim')) return 'jeans';
      if (name.includes('slacks') || name.includes('dress pants')) return 'slacks';
      if (name.includes('cargo') && name.includes('pants')) return 'cargo_pants';
      if (name.includes('khaki') || name.includes('chinos')) return 'khakis';
      if (name.includes('sweatpants') || name.includes('track pants')) return 'sweatpants';
      
      // Traditional/general leg wear
      if (name.includes('trouser') || name.includes('pant') || name.includes('breeches') || name.includes('overalls')) return 'trousers';
      if (name.includes('hose') || name.includes('leggings') || name.includes('tights')) return 'hose';
      if (name.includes('dhoti') || name.includes('lungi')) return 'dhoti';
      if (name.includes('churidar') || name.includes('pajama') || name.includes('salwar')) return 'churidar';
      if (name.includes('short')) return 'shorts';
      if (name.includes('skirt') || name.includes('kilt')) return 'skirt';
    }
    
    // === FOOTWEAR ===
    if (slot === 'feet') {
      // Modern footwear
      if (name.includes('sneakers') || name.includes('trainers') || name.includes('athletic shoes')) return 'sneakers';
      if (name.includes('dress shoes') || name.includes('oxfords') || name.includes('brogues')) return 'dress_shoes';
      if (name.includes('loafers') || name.includes('slip-ons')) return 'loafers';
      if (name.includes('high heels') || name.includes('pumps')) return 'high_heels';
      if (name.includes('flats') || name.includes('ballet flats')) return 'flats';
      
      // Traditional footwear
      if (name.includes('boot')) return 'boots';
      if (name.includes('sandal') || name.includes('chappal')) return 'sandals';
      if (name.includes('shoe') || name.includes('pump') || name.includes('flat')) return 'shoes';
      if (name.includes('clog') || name.includes('sabot')) return 'clogs';
      if (name.includes('moccasin')) return 'moccasin';
      if (name.includes('jutti') || name.includes('khussa') || name.includes('mojari')) return 'jutti';
      if (name.includes('slipper')) return 'slippers';
    }
    
    // === JEWELRY ===
    if (slot === 'amulet' || slot === 'ring' || slot === 'ring1' || slot === 'ring2' || slot === 'necklace' || slot === 'accessory') {
      if (name.includes('ring') || slot.includes('ring')) return 'ring';
      if (name.includes('amulet') || name.includes('pendant') || name.includes('locket')) return 'amulet';
      if (name.includes('necklace') || name.includes('choker') || name.includes('mala') || name.includes('haar')) return 'necklace';
      if (name.includes('bracelet') || name.includes('armlet') || name.includes('bangle') || name.includes('kada') || name.includes('vanki')) return 'bracelet';
      if (name.includes('brooch') || name.includes('pin') || name.includes('cufflink') || name.includes('tupu')) return 'brooch';
      if (name.includes('earring') || name.includes('ear stud')) return 'earring';
      if (name.includes('anklet') || name.includes('payal')) return 'anklet';
    }
    
    // === FOOD & DRINK ===
    if (cat.includes('food') || cat.includes('consumable')) {
      // Staples
      if (name.includes('bread') || name.includes('loaf')) return 'bread';
      if (name.includes('sheaf') || name.includes('bundle')) return 'sheaf';
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
      if (name.includes('meat') || name.includes('pork') || name.includes('beef') || name.includes('mutton') || name.includes('chicken')) return 'meat';
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
      if (name.includes('wool card') || name.includes('carding') || name.includes('carder')) return 'wool_cards';
      if (name.includes('anvil')) return 'anvil';
      if (name.includes('churn')) return 'churn';
      
      // Farming tools
      if (name.includes('plow') || name.includes('plough')) return 'plow';
      if (name.includes('scythe')) return 'scythe';
      if (name.includes('sickle')) return 'sickle';
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
    // Modern bags and cases
    if (name.includes('briefcase') || name.includes('laptop bag')) return 'briefcase';
    if (name.includes('backpack') || name.includes('rucksack')) return 'backpack';
    if (name.includes('messenger bag') || name.includes('satchel')) return 'messenger_bag';
    if (name.includes('handbag') || name.includes('purse')) return 'handbag';
    if (name.includes('duffel') || name.includes('gym bag')) return 'duffel_bag';
    
    // Traditional containers
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
    if (name.includes('sheaf') || name.includes('bundle')) return 'sheaf';
    if (name.includes('ingot') || name.includes(' bar') || name.includes(' ingot')) return 'ingot';
    if (name.includes('ore')) return 'ore';
    if (name.includes('cloth') || name.includes('fabric') || name.includes('textile')) return 'cloth';
    if (name.includes('leather') || name.includes('hide') || name.includes('pelt')) return 'leather';
    if (name.includes('wood') || name.includes('plank') || name.includes('timber')) return 'wood';
    if (name.includes('bamboo')) return 'bamboo';
    if (name.includes('stone') || name.includes('rock') || name.includes('brick')) return 'stone';
    if (name.includes('herb') || name.includes('plant') || name.includes('leaf') || name.includes('leaves') || name.includes('foliage') || name.includes('flora')) return 'herb';
    if (name.includes('root')) return 'root';
    if (name.includes('bone') || name.includes('ivory')) return 'bone';
    if (name.includes('feather')) return 'feather';
    if (name.includes('thread') || name.includes('yarn') || name.includes('string')) return 'thread';
    if (name.includes('cotton')) return 'cotton';
    if (name.includes('resin') || name.includes('sap')) return 'resin';
    if (name.includes('bead')) return 'bead';
    if (name.includes('gem') || name.includes('jewel') || name.includes('crystal')) return 'gem';
    if (name.includes('worm') || name.includes('earthworm')) return 'earthworm';
    
    // === MODERN ACCESSORIES ===
    if (name.includes('tie') || name.includes('necktie')) return 'tie';
    if (name.includes('bow tie')) return 'bow_tie';
    if (name.includes('watch') || name.includes('wristwatch')) return 'watch';
    if (name.includes('sunglasses') || name.includes('shades')) return 'sunglasses';
    if (name.includes('eyeglasses') || name.includes('spectacles') || name.includes('glasses')) return 'glasses';
    if (name.includes('scarf') || name.includes('muffler')) return 'scarf';
    if (name.includes('gloves') && !name.includes('work')) return 'dress_gloves';
    
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
    if (name.includes('bedroll') || name.includes('sleeping bag')) return 'bedroll';
    if (name.includes('blanket')) return 'blanket';
    if (name.includes('mat') || name.includes('rug') && !name.includes('drug')) return 'mat';
    if (name.includes('flint')) return 'flint';
if (name.includes('broom')) return 'broom';
if (name.includes('coal')) return 'coal';
if (name.includes('clay')) return 'clay';
// Specific pottery items (more specific than generic clay)
if (name.includes('clay lamp') || name.includes('pottery shard') || name.includes('ceramic pot')) return 'pottery';
if (name.includes('smartphone') || name.includes('cell phone') || name.includes('mobile phone')) return 'smartphone';
if (name.includes('flashlight')) return 'flashlight'; // (kept separate from medieval 'torch')
if (name.includes('syringe') || name.includes('needle') && cat.includes('medical')) return 'syringe';

// Edibles / processing
if (name.includes('chip')) return 'chips';            // gourd chips, root chips, etc.
if (name.includes('seed')) return 'seeds';            // gourd seeds, pumpkin seeds
if (name.includes('dust')) return 'dust';             // flour dust, spice dust
if (name.includes('crumb')) return 'crumbs';          // baking crumbs, bread crumbs

// Wood forms
if (name.includes('log')) return 'log';               // paper birch log, oak log


// === WEAPONS ===
// Place this ABOVE the existing 'dagger' check so 'knife' doesn't get routed to 'dagger'
if (name.includes('knife')) return 'knife';

// (Keep: dagger/dirk/stiletto -> 'dagger' as you already have)

// === WRITING / STATIONERY ===
if (name.includes('ink pot') || name.includes('inkpot')) return 'ink_pot';
if (name.includes('quill')) return 'quill'; // you already match this via tools section, safe to duplicate

// === SHARPENING ===
if (name.includes('whetstone')) return 'whetstone';

// === TEXTILES ===
if (name.includes('spindle')) return 'spindle';

// === STONEWORK ===
// Put before generic 'chisel' to prefer this specialized art when 'stone' is mentioned
if (name.includes('stone chisel') || (name.includes('chisel') && name.includes('stone'))) return 'stone_chisel';

// === THIEVERY ===
if (name.includes('lockpick') || name.includes('lock pick')) return 'lockpick';

// === MUSIC ===
if (name.includes('drum')) return 'drum';

// === TIMEPIECE ===
if (name.includes('pocket watch') || name.includes('pocketwatch')) return 'pocket_watch';

// === CONTAINERS ===
if (name.includes('gourd flask') || (name.includes('gourd') && name.includes('flask'))) return 'gourd_flask';
if (name.includes('leather bag')) return 'leather_bag';
if (name.includes('purse')) return 'purse';
if (name.includes('mortar') && name.includes('pestle')) return 'mortar_pestle';
if (name.includes('salve') || name.includes('ointment') || name.includes('balm')) return 'salve';
// (Your existing logic already handles 'bag'/'sack'/'pouch' and 'map')

// === APPAREL / CULTURAL ===
if (name.includes('poncho')) return 'poncho';
if (name.includes('sari')) return 'sari';
// You already have veil logic; just ensure:
if (name.includes('veil')) return 'veil';

// === MATERIALS / PIGMENTS ===
if (name.includes('ochre')) return 'ochre';
if (name.includes('vine')) return 'vine';
if (name.includes('shell') || name.includes('cowrie')) return 'shell';
if (name.includes('ivory tusk') || (name.includes('tusk') && name.includes('ivory'))) return 'ivory_tusk';

// === FOODS ===
// You already route 'cheese' in your Food & Drink section:
if (name.includes('cheese')) return 'cheese';


    
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

      case 'sling':
        // Y-shaped sling with leather pouch
        svgContent = pixels([
          // Left fork
          [6,3],[5,4],[4,5],
          // Right fork
          [10,3],[11,4],[12,5],
          // Handle junction
          [7,4],[8,4],[9,4],
          // Handle
          [8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],
        ], '#8B6F47') + // Wood brown
        pixels([
          // Leather cords
          [3,6],[3,7],[3,8],[4,9],
          [13,6],[13,7],[13,8],[12,9],
        ], '#5C4033', 0.8) + // Darker leather
        pixels([
          // Pouch
          [7,10],[8,10],[9,10],
          [7,11],[8,11],[9,11],
        ], '#8B7355') + // Leather pouch
        pixels([
          // Grip wrap
          [7,8],[9,8],
          [7,9],[9,9],
        ], '#4A4A4A', 0.5); // Grip binding
        break;

      case 'bolas':
        // Three weighted balls on interconnected cords
        svgContent = pixels([
          // Central cord junction
          [8,8],
        ], '#5C4033') +
        pixels([
          // Cords radiating out
          [7,7],[6,6],[5,5],[4,4], // Upper left
          [9,7],[10,6],[11,5],[12,4], // Upper right
          [8,9],[8,10],[8,11],[8,12], // Bottom
        ], '#8B7355', 0.9) + // Leather cord
        pixels([
          // Upper left weight (stone)
          [3,3],[4,3],
          [3,4],[4,4],
        ], '#696969') +
        pixels([
          // Upper right weight
          [12,3],[13,3],
          [12,4],[13,4],
        ], '#696969') +
        pixels([
          // Bottom weight
          [7,13],[8,13],[9,13],
          [7,14],[8,14],[9,14],
        ], '#696969') +
        pixels([
          // Weight highlights
          [3,3],[12,3],[8,13],
        ], '#A9A9A9', 0.6);
        break;

      case 'blowgun':
        // Long hollow tube with mouthpiece
        svgContent = pixels([
          // Main tube (bamboo)
          [8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[8,15],[8,16],[8,17],
          [7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],[7,14],[7,15],[7,16],
        ], '#C4B5A0') + // Bamboo color
        pixels([
          // Bamboo nodes/rings
          [6,6],[7,6],[8,6],[9,6],[10,6],
          [6,11],[7,11],[8,11],[9,11],[10,11],
          [6,15],[7,15],[8,15],[9,15],[10,15],
        ], '#8B7D6B', 0.7) + // Darker rings
        pixels([
          // Mouthpiece
          [7,17],[8,17],[9,17],
          [7,18],[8,18],[9,18],
        ], '#5C4033') + // Carved wood mouthpiece
        pixels([
          // Decorative feather
          [10,3],[11,3],
          [10,4],[11,4],[12,4],
          [11,5],[12,5],
        ], '#DC143C', 0.8); // Red feather accent
        break;

      case 'chakram':
        // Circular throwing disc with sharp edge
        svgContent = pixels([
          // Outer ring top
          [6,5],[7,4],[8,4],[9,4],[10,5],
          // Outer ring sides
          [5,6],[5,7],[5,8],[5,9],
          [11,6],[11,7],[11,8],[11,9],
          // Outer ring bottom
          [6,10],[7,11],[8,11],[9,11],[10,10],
        ], '#C0C0C0') + // Steel outer edge
        pixels([
          // Inner ring (darker for depth)
          [6,6],[7,5],[8,5],[9,5],[10,6],
          [6,7],[10,7],
          [6,8],[10,8],
          [6,9],[7,10],[8,10],[9,10],[10,9],
        ], '#808080') + // Darker inner steel
        pixels([
          // Center hole
          [7,7],[8,7],[9,7],
          [7,8],[9,8],
          [7,9],[8,9],[9,9],
        ], colors.primary, 0) + // Transparent center
        pixels([
          // Sharp edge highlights
          [7,4],[5,7],[11,7],[8,11],
        ], '#FFFFFF', 0.7) + // Blade shine
        pixels([
          // Decorative etchings
          [7,6],[9,6],
          [7,9],[9,9],
        ], '#FFD700', 0.4); // Gold inlay
        break;

      case 'shuriken':
        // Four-pointed ninja star
        svgContent = pixels([
          // Center
          [7,7],[8,7],[9,7],
          [7,8],[8,8],[9,8],
          [7,9],[8,9],[9,9],
        ], '#2F4F4F') + // Dark steel center
        pixels([
          // Top point
          [8,3],
          [7,4],[8,4],[9,4],
          [7,5],[8,5],[9,5],
          [8,6],
          // Bottom point
          [8,10],
          [7,11],[8,11],[9,11],
          [7,12],[8,12],[9,12],
          [8,13],
          // Left point
          [3,8],
          [4,7],[4,8],[4,9],
          [5,7],[5,8],[5,9],
          [6,8],
          // Right point
          [10,8],
          [11,7],[11,8],[11,9],
          [12,7],[12,8],[12,9],
          [13,8],
        ], '#708090') + // Steel gray
        pixels([
          // Sharp edges (lighter)
          [8,3],[3,8],[13,8],[8,13],
        ], '#A9A9A9') +
        pixels([
          // Center hole
          [8,8],
        ], colors.primary, 0) + // Transparent hole
        pixels([
          // Edge highlights for sharpness
          [7,4],[4,7],[12,7],[7,12],
        ], '#DCDCDC', 0.5);
        break;

      case 'throwing_axe':
        // Francisca-style throwing axe
        svgContent = pixels([
          // Handle
          [8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[8,15],
          [7,9],[7,10],[7,11],[7,12],[7,13],[7,14],
        ], '#8B4513') + // Dark wood
        pixels([
          // Handle wrap/grip
          [7,12],[8,12],[9,12],
          [7,13],[8,13],[9,13],
        ], '#4A4A4A', 0.6) + // Leather wrap
        pixels([
          // Axe head - main body
          [5,5],[6,5],[7,5],[8,5],[9,5],[10,5],
          [5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],
          [5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],
          [6,8],[7,8],[8,8],[9,8],[10,8],[11,8],
        ], '#696969') + // Iron
        pixels([
          // Cutting edge (brighter)
          [12,6],[13,6],
          [13,7],[14,7],
          [12,8],[13,8],
        ], '#C0C0C0') + // Sharp edge
        pixels([
          // Edge highlights
          [14,7],
        ], '#FFFFFF', 0.6) + // Blade shine
        pixels([
          // Axe head decoration/binding
          [7,6],[8,6],
        ], '#B8860B', 0.5); // Bronze accent
        break;

      case 'dart':
        // Small throwing dart
        svgContent = pixels([
          // Shaft
          [8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],
        ], '#C4B5A0') + // Light bamboo
        pixels([
          // Point
          [8,3],
          [7,4],[8,4],[9,4],
        ], '#A9A9A9') + // Metal tip
        pixels([
          // Fletching
          [6,10],[7,10],[9,10],[10,10],
          [6,11],[7,11],[9,11],[10,11],
        ], '#DC143C', 0.7) + // Red feathers
        pixels([
          // Poison coating (optional visual effect)
          [8,3],[7,4],[9,4],
        ], '#32CD32', 0.3); // Green tint for poison
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

      case 'cane':
        // Walking cane with curved handle
        svgContent = pixels([ // Curved handle top
          [8,4],[9,4],[10,4],[11,4],
          [7,5],[11,5],[12,5],
          [7,6],[12,6],
          [7,7],[12,7],
          [8,8],[9,8],[10,8],[11,8],[12,8],
        ], colors.primary) +
        pixels([ // Shaft/body
          [11,9],[11,10],[11,11],[11,12],[11,13],[11,14],[11,15],[11,16],[11,17],[11,18],[11,19],[11,20],
        ], colors.primary) +
        pixels([ // Shaft side (gives it thickness)
          [10,10],[10,11],[10,12],[10,13],[10,14],[10,15],[10,16],[10,17],[10,18],[10,19],
        ], colors.secondary, 0.8) +
        pixels([ // Wood grain/texture
          [11,10],[11,12],[11,14],[11,16],[11,18],
        ], colors.secondary, 0.4) +
        pixels([ // Handle highlights (polished)
          [9,4],[10,4],
          [8,8],[9,8],
        ], '#ffffff', 0.5) +
        pixels([ // Metal ferrule at bottom
          [10,20],[11,20],[12,20],
        ], '#999999');
        break;

      case 'pole':
        // Long pole/pike weapon
        svgContent = pixels([ // Metal spearhead
          [12,3],
          [11,4],[12,4],[13,4],
          [11,5],[12,5],[13,5],
          [12,6],
        ], '#C0C0C0') +
        pixels([ // Spearhead edge/shine
          [12,3],[12,4],[13,4],
        ], '#ffffff', 0.8) +
        pixels([ // Socket/binding
          [11,7],[12,7],[13,7],
          [11,8],[12,8],[13,8],
        ], '#8B6F47') +
        pixels([ // Long wooden shaft
          [11,9],[12,9],[13,9],
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
        ], colors.primary) +
        pixels([ // Wood texture/grain
          [12,10],[12,12],[12,14],[12,16],[12,18],
        ], colors.secondary, 0.5) +
        pixels([ // Shaft highlights
          [13,9],[13,11],[13,13],[13,15],[13,17],
        ], '#ffffff', 0.3);
        break;

      case 'crook':
        // Shepherd's crook with distinctive curved hook
        svgContent = pixels([ // Curved hook at top
          [9,5],[10,5],[11,5],[12,5],
          [8,6],[12,6],[13,6],
          [7,7],[13,7],
          [7,8],[13,8],
          [7,9],[13,9],
          [8,10],[12,10],[13,10],
          [9,11],[10,11],[11,11],[12,11],
        ], colors.primary) +
        pixels([ // Long shaft
          [11,12],[11,13],[11,14],[11,15],[11,16],[11,17],[11,18],[11,19],[11,20],
        ], colors.primary) +
        pixels([ // Shaft thickness (side)
          [10,13],[10,14],[10,15],[10,16],[10,17],[10,18],[10,19],
        ], colors.secondary, 0.8) +
        pixels([ // Wood grain texture
          [11,13],[11,15],[11,17],[11,19],
        ], colors.secondary, 0.4) +
        pixels([ // Hook inner curve
          [9,6],[10,6],[11,6],
          [8,7],[12,7],
          [8,8],[12,8],
          [8,9],[12,9],
          [9,10],[10,10],[11,10],
        ], 'transparent') +
        pixels([ // Highlights on curve
          [10,5],[11,5],
          [8,6],[13,7],
        ], '#ffffff', 0.4) +
        pixels([ // Bottom ferrule
          [10,20],[11,20],[12,20],
        ], '#8B7355');
        break;

      case 'flail':
        // Agricultural flail - wooden handle with hinged beater
        svgContent = pixels([
          // Long wooden handle
          [12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],[12,14],[12,15],[12,16],[12,17],
        ], '#8B6F47') +
        pixels([
          // Handle grip wrapping
          [12,14],[12,15],[12,16]],
          '#6B5635'
        ) +
        pixels([
          // Leather hinge/joint
          [12,4],[11,4],[13,4],
        ], '#5C4033') +
        pixels([
          // Swinging beater (shorter, thicker stick)
          [8,2],[9,2],[10,2],[11,2],
          [8,3],[9,3],[10,3],[11,3],
        ], '#A0826D') +
        pixels([
          // Beater end cap
          [7,2],[7,3]],
          '#6B5635'
        ) +
        pixels([
          // Handle highlights
          [12,6],[12,8],[12,11]],
          '#A68B6F', 0.5
        );
        break;

      case 'whip':
        svgContent = pixels([
          // Handle
          [12,16],[12,17],[12,18],[12,19],[12,20],
          [11,20],[13,20],
        ], '#8B4513') +
        pixels([
          // Whip lash
          [12,15],[11,14],[10,13],[9,12],
          [8,11],[7,10],[6,9],[5,8],
        ], '#5C4033') +
        pixels([
          // Tip
          [4,7],[3,6]],
          '#3C2415'
        );
        break;
        
      case 'hat':
        // Check if it's a straw hat (conical Asian peasant hat)
        if ((item?.name || '').toLowerCase().includes('straw')) {
          // Conical straw hat (triangular/conical shape)
          svgContent = pixels([
            // Top point
            [12,6],
            // Upper cone
            [11,7],[12,7],[13,7],
            [10,8],[11,8],[12,8],[13,8],[14,8],
            [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
            // Middle cone
            [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
            [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],
            // Wide brim
            [6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],[18,12],
            [5,13],[6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],[18,13],[19,13],
          ], '#E8D7A0') +
          pixels([
            // Straw weave texture
            [11,8],[13,8],
            [10,9],[12,9],[14,9],
            [9,10],[11,10],[13,10],[15,10],
            [8,11],[10,11],[12,11],[14,11],[16,11],
          ], '#D4C5A0', 0.5) +
          pixels([
            // Shadow underside of brim
            [6,13],[7,13],[8,13],[16,13],[17,13],[18,13],
          ], '#C4A670', 0.6);
        } else {
          // Regular hat - larger
          svgContent = pixels([
            // Brim
            [6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],[18,11],
            [5,12],[6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],[18,12],[19,12],
          ], colors.secondary) +
          pixels([
            // Crown
            [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],
            [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
            [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
            [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
          ], colors.primary) +
          pixels([
            // Top
            [10,6],[11,6],[12,6],[13,6],[14,6],
          ], colors.primary) +
          pixels([
            // Hat band
            [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
          ], colors.accent);
        }
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

      case 'hood':
        svgContent = pixels([
          // Hood back/sides
          [6,4],[7,4],[8,4],[9,4],[10,4],
          [5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],
          [5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],
          [5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
          [6,8],[7,8],[8,8],[9,8],[10,8],
        ], colors.primary) +
        pixels([
          // Hood opening/shadow
          [7,6],[8,6],[9,6],
          [7,7],[8,7],[9,7],
        ], colors.secondary, 0.3) +
        pixels([
          // Hood edge/hem
          [6,8],[7,8],[8,8],[9,8],[10,8],
        ], colors.accent) +
        pixels([
          // Drawstring
          [7,9],[8,9],[9,9],
        ], '#8B4513', 0.6);
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

      case 'gown':
        svgContent = pixels([
          // Neckline/shoulders
          [6,4],[7,4],[8,4],[9,4],[10,4],
          [5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],
        ], colors.secondary) +
        pixels([
          // Upper bodice
          [6,6],[7,6],[8,6],[9,6],[10,6],
          [6,7],[7,7],[8,7],[9,7],[10,7],
          [6,8],[7,8],[8,8],[9,8],[10,8],
        ], colors.primary) +
        pixels([
          // Flowing skirt
          [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
          [4,10],[5,10],[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],
          [3,11],[4,11],[5,11],[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],
          [2,12],[3,12],[4,12],[5,12],[6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],
          [2,13],[3,13],[4,13],[5,13],[6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
        ], colors.primary) +
        pixels([
          // Decorative trim
          [4,10],[12,10],
          [3,11],[13,11],
          [2,12],[14,12],
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
        // Ring with circular band (perspective view) and gem on top
        svgContent = pixels([ // Gem facets
          [11,6],[12,6],[13,6],
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [10,8],[11,8],[12,8],[13,8],[14,8],
        ], colors.accent) +
        pixels([ // Gem highlight/shine
          [12,6],[13,7],[12,7],
        ], '#ffffff', 0.9) +
        pixels([ // Gem shadows
          [10,7],[10,8],[11,8],
        ], '#000000', 0.3) +
        pixels([ // Band top edge (near gem)
          [10,9],[11,9],[12,9],[13,9],[14,9],
          [9,10],[10,10],[13,10],[14,10],[15,10],
        ], colors.primary) +
        pixels([ // Band sides (circular form)
          [8,11],[15,11],[16,11],
          [7,12],[16,12],[17,12],
          [7,13],[16,13],[17,13],
          [8,14],[15,14],[16,14],
        ], colors.primary) +
        pixels([ // Band bottom (perspective)
          [9,15],[10,15],[13,15],[14,15],[15,15],
          [10,16],[11,16],[12,16],[13,16],[14,16],
        ], colors.primary) +
        pixels([ // Inner opening (dark/shadow)
          [11,10],[12,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],
        ], '#000000', 0.25) +
        pixels([ // Highlights on band
          [11,9],[13,9],
          [15,11],[16,11],
          [11,16],[13,16],
        ], '#ffffff', 0.5) +
        pixels([ // Shadow edge on band
          [7,12],[7,13],[8,14],
        ], '#000000', 0.2);
        break;

      case 'earring':
        // Large dangling earring with prominent hook and gem - centered
        svgContent = pixels([ // Hook (curved ear wire)
          [11,5],[12,5],[13,5],
          [10,6],[13,6],[14,6],
          [10,7],[14,7],
          [10,8],[14,8],
          [11,9],[13,9],
        ], colors.primary) +
        pixels([ // Hook shine/metallic highlight
          [12,5],[13,6],
        ], '#ffffff', 0.6) +
        pixels([ // Connector chain
          [12,10],
          [12,11],
          [12,12],
        ], colors.primary) +
        pixels([ // Large gem/pendant (diamond shape)
          [11,13],[12,13],[13,13],
          [10,14],[11,14],[12,14],[13,14],[14,14],
          [9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],
          [10,16],[11,16],[12,16],[13,16],[14,16],
          [11,17],[12,17],[13,17],
          [12,18],
        ], colors.accent) +
        pixels([ // Gem brilliant shine (top facets)
          [12,13],[13,14],
        ], '#ffffff', 1.0) +
        pixels([ // Gem highlights
          [11,14],[12,14],
          [10,15],[11,15],
        ], '#ffffff', 0.7) +
        pixels([ // Gem depth/shadow
          [13,16],[14,16],
          [12,17],[13,17],
        ], colors.accent, 0.5) +
        pixels([ // Deep shadow at bottom
          [12,18],
        ], '#000000', 0.4);
        break;

      case 'armor':
        // Chainmail/plate armor breastplate
        svgContent = pixels([ // Shoulder plates
          [7,5],[8,5],[9,5],
          [6,6],[7,6],[8,6],[9,6],
          [15,5],[16,5],[17,5],
          [15,6],[16,6],[17,6],[18,6],
        ], colors.primary) +
        pixels([ // Main breastplate
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
          [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
        ], colors.primary) +
        pixels([ // Chainmail texture/rivets
          [9,8],[11,8],[13,8],[15,8],
          [10,9],[12,9],[14,9],
          [9,10],[11,10],[13,10],[15,10],
          [10,11],[12,11],[14,11],
        ], colors.secondary, 0.6) +
        pixels([ // Metallic highlights
          [11,7],[13,7],
          [10,8],[14,8],
          [11,9],[13,9],
        ], '#ffffff', 0.5) +
        pixels([ // Shadows
          [8,9],[8,10],[9,12],[10,13],
        ], '#000000', 0.3);
        break;

      case 'necklace':
        // Very large, prominent necklace with thick chain and large pendant - perfectly centered
        svgContent = pixels([ // Top chain (thick metal links)
          [11,5],[12,5],[13,5],
          [10,6],[11,6],[12,6],[13,6],[14,6],
          [9,7],[10,7],[13,7],[14,7],[15,7],
          [8,8],[9,8],[14,8],[15,8],[16,8],
          [7,9],[8,9],[15,9],[16,9],[17,9],
        ], colors.primary) +
        pixels([ // Left side chain descending
          [6,10],[7,10],
          [6,11],[7,11],
          [7,12],[8,12],
          [8,13],[9,13],
          [9,14],[10,14],
        ], colors.primary) +
        pixels([ // Right side chain descending
          [17,10],[18,10],
          [17,11],[18,11],
          [16,12],[17,12],
          [15,13],[16,13],
          [14,14],[15,14],
        ], colors.primary) +
        pixels([ // Chain highlights (metallic shine)
          [12,5],[13,6],
          [10,7],[14,7],
          [8,8],[16,8],
          [7,10],[17,10],
          [8,13],[16,13],
        ], '#ffffff', 0.8) +
        pixels([ // Pendant connector/bail
          [11,15],[12,15],[13,15],
          [11,16],[13,16],
        ], colors.primary) +
        pixels([ // Large gemstone pendant (teardrop shape)
          [11,17],[12,17],[13,17],
          [10,18],[11,18],[12,18],[13,18],[14,18],
          [10,19],[11,19],[12,19],[13,19],[14,19],
          [11,20],[12,20],[13,20],
        ], colors.accent) +
        pixels([ // Brilliant gem shine (top highlight)
          [12,17],[13,18],
        ], '#ffffff', 1.0) +
        pixels([ // Secondary gem highlights
          [11,18],[12,18],
        ], '#ffffff', 0.7) +
        pixels([ // Gem depth/shadows
          [10,19],[14,19],
          [11,20],[13,20],
        ], colors.accent, 0.5);
        break;

      case 'amulet':
        // Amulet/pendant with decorative design and chain
        svgContent = pixels([ // Chain attachment (simple cord)
          [12,4],
          [11,5],[13,5],
          [10,6],[14,6],
          [9,7],[15,7],
          [9,8],[15,8],
          [10,9],[14,9],
          [11,10],[13,10],
        ], colors.primary) +
        pixels([ // Amulet body (circular medallion)
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [9,13],[10,13],[14,13],[15,13],
          [8,14],[9,14],[15,14],[16,14],
          [8,15],[16,15],
          [8,16],[16,16],
          [9,17],[15,17],
          [10,18],[14,18],
          [11,19],[12,19],[13,19],
        ], colors.primary) +
        pixels([ // Decorative symbol/gem in center
          [11,14],[12,14],[13,14],
          [11,15],[12,15],[13,15],
          [11,16],[12,16],[13,16],
          [12,17],
        ], colors.accent) +
        pixels([ // Metallic highlights on rim
          [11,12],[12,12],
          [9,13],[10,13],
          [8,14],
        ], '#ffffff', 0.6) +
        pixels([ // Center gem shine
          [12,14],[12,15],
        ], '#ffffff', 0.9) +
        pixels([ // Decorative pattern around center
          [10,14],[14,14],
          [10,16],[14,16],
        ], colors.secondary, 0.7);
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
        
      case 'grain':
        svgContent = pixels([
          // Wheat stalk
          [12,18],[12,17],[12,16],[12,15],[12,14],[12,13],[12,12],[12,11],[12,10],[12,9],
        ], '#8B7355') +
        pixels([
          // Wheat grains left side
          [10,4],[10,5],[10,6],[10,7],[10,8],
          [9,5],[9,6],[9,7],
        ], '#D4A76A') +
        pixels([
          // Wheat grains right side
          [14,4],[14,5],[14,6],[14,7],[14,8],
          [15,5],[15,6],[15,7],
        ], '#D4A76A') +
        pixels([
          // Center grains
          [12,3],[12,4],[12,5],[12,6],[12,7],[12,8],
          [11,4],[11,5],[11,6],[11,7],
          [13,4],[13,5],[13,6],[13,7],
        ], '#F4E4BC') +
        pixels([
          // Leaves
          [11,10],[13,10],
          [10,11],[14,11],
        ], '#6B8E23');
        break;

      case 'sheaf':
        // Large bundled wheat sheaf - centered and prominent
        svgContent = pixels([
          // Wheat grain heads (fluffy golden top)
          [9,4],[10,4],[11,4],[12,4],[13,4],[14,4],[15,4],
          [8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],[16,5],
          [8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
        ], '#F4E4BC') +
        pixels([
          // Grain highlights (bright golden)
          [10,4],[12,4],[14,4],
          [9,5],[11,5],[13,5],[15,5],
          [10,6],[12,6],[14,6],
        ], '#FFFACD', 0.8) +
        pixels([
          // Darker grain shadows
          [8,6],[16,6],
          [9,8],[15,8],
        ], '#E8D7A0', 0.6) +
        pixels([
          // Bundle stalks (tan cylindrical form)
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
          [10,15],[11,15],[12,15],[13,15],[14,15],
          [10,16],[11,16],[12,16],[13,16],[14,16],
          [11,17],[12,17],[13,17],
        ], '#D4A76A') +
        pixels([
          // Stalk texture/grain lines
          [10,10],[12,10],[14,10],
          [9,11],[11,11],[13,11],[15,11],
          [10,12],[12,12],[14,12],
          [9,13],[11,13],[13,13],[15,13],
          [10,14],[12,14],[14,14],
        ], '#C19A6B', 0.5) +
        pixels([
          // Binding twine/rope (wrapped around middle)
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
          [8,13],[16,13],
          [9,14],[15,14],
        ], '#8B6F47') +
        pixels([
          // Twine knot
          [16,12],[16,13],
        ], '#6B5635') +
        pixels([
          // Stalk shadows (left side)
          [9,15],[10,16],[11,17],
        ], '#B8956B', 0.5);
        break;

              // ---------- NEW CASES ----------

      case 'scale': {
        // Two-pan balance scale
        svgContent =
          pixels(
            // Base
            [[10,16],[11,16],[12,16],[13,16]],
            colors.secondary || '#6B6B6B'
          ) +
          pixels(
            // Pillar
            [[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],[12,14],[12,15]],
            colors.primary || '#B8860B'
          ) +
          pixels(
            // Crossbeam
            [[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8]],
            colors.primary || '#B8860B'
          ) +
          pixels(
            // Left chain
            [[9,9],[9,10],[9,11]],
            colors.secondary || '#8F8F8F'
          ) +
          pixels(
            // Right chain
            [[15,9],[15,10],[15,11]],
            colors.secondary || '#8F8F8F'
          ) +
          pixels(
            // Left pan
            [[8,12],[9,12],[10,12],[8,13],[9,13],[10,13]],
            colors.primary || '#C9A23A'
          ) +
          pixels(
            // Right pan
            [[14,12],[15,12],[16,12],[14,13],[15,13],[16,13]],
            colors.primary || '#C9A23A'
          ) +
          pixels(
            // Highlights
            [[12,8],[10,12],[15,12]],
            '#FFF1A6', 0.5
          );
        break;
      }

      case 'quill': {
        // Feather quill + ink pot
        svgContent =
          pixels(
            // Ink pot
            [[7,14],[8,14],[9,14],[7,15],[9,15],[7,16],[8,16],[9,16]],
            '#2B2B2B'
          ) +
          pixels(
            // Pot shine
            [[8,14]],
            '#5A5A5A', 0.6
          ) +
          pixels(
            // Feather shaft
            [[10,10],[11,9],[12,8],[13,7],[14,6]],
            '#C7C7C7'
          ) +
          pixels(
            // Feather barbs
            [[10,11],[11,10],[12,9],[13,8],[11,11],[12,10],[13,9]],
            '#F5F5F5'
          ) +
          pixels(
            // Nib into pot
            [[9,13]],
            '#3A3A3A'
          );
        break;
      }

      case 'soap': {
        // Bar of soap with bubbles
        svgContent =
          pixels(
            // Bar
            [[10,9],[11,9],[12,9],[13,9],
             [9,10],[14,10],
             [9,11],[14,11],
             [10,12],[11,12],[12,12],[13,12]],
            '#EAF7FF'
          ) +
          pixels(
            // Rounded corners shading
            [[9,10],[14,11],[10,9],[13,12]],
            '#D3ECFA', 0.6
          ) +
          pixels(
            // Bubbles
            [[15,9],[8,11],[14,8]],
            '#CFEAFC', 0.8
          );
        break;
      }

      case 'broom': {
        // Straw broom with wooden handle
        svgContent =
          pixels(
            // Handle (diagonal)
            [[8,5],[9,6],[10,7],[11,8],[12,9],[13,10],[14,11],[15,12]],
            '#8B6F47'
          ) +
          pixels(
            // Ferrule/binding
            [[14,12],[15,13]],
            '#5C4033'
          ) +
          pixels(
            // Bristles
            [[15,13],[16,13],[17,13],
             [15,14],[16,14],[17,14],
             [15,15],[16,15],[17,15]],
            '#C9A25A'
          ) +
          pixels(
            // Bristle shading
            [[16,14],[16,15]],
            '#A98545', 0.7
          );
        break;
      }

      case 'coal': {
        // Lumps of coal
        svgContent =
          pixels(
            // Main lumps
            [[9,10],[10,10],[11,10],
             [8,11],[9,11],[10,11],[11,11],[12,11],
             [9,12],[10,12],[11,12]],
            '#1F1F1F'
          ) +
          pixels(
            // Highlights
            [[10,10],[12,11]],
            '#3A3A3A', 0.6
          ) +
          pixels(
            // Dust bits
            [[13,12],[8,13]],
            '#2A2A2A'
          );
        break;
      }

      case 'clay': {
        // Raw clay lump (bigger)
        svgContent =
          pixels(
            // Body
            [
              [10,7],[11,7],[12,7],[13,7],
              [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
              [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
              [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
              [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
              [10,12],[11,12],[12,12],[13,12],
              [11,13],[12,13]
            ],
            '#B2733B'
          ) +
          pixels(
            // Soft highlights
            [[11,8],[12,8],[13,9],[14,10]],
            '#D9A070', 0.4
          ) +
          pixels(
            // Damp shadows
            [[8,9],[8,10],[9,11],[10,12]],
            '#8F5A2E', 0.4
          );
        break;
      }

      case 'prayer_beads': {
        // Loop with a tassel
        svgContent =
          pixels(
            // Bead loop
            [[9,6],[10,6],[11,6],
             [8,7],[12,7],
             [8,8],[12,8],
             [8,9],[12,9],
             [9,10],[10,10],[11,10]],
            colors.primary || '#B5651D'
          ) +
          pixels(
            // Tassel
            [[10,11],[10,12],[10,13],[9,14],[10,14],[11,14]],
            colors.accent || '#D4AF37'
          ) +
          pixels(
            // Highlights on beads
            [[10,6],[9,10]],
            '#F5DEB3', 0.45
          );
        break;
      }

      case 'smartphone': {
        // Modern phone: bezel + screen + camera
        svgContent =
          pixels(
            // Body
            [
              [9,5],[10,5],[11,5],[12,5],[13,5],
              [9,6],[13,6],
              [9,7],[13,7],
              [9,8],[13,8],
              [9,9],[13,9],
              [9,10],[13,10],
              [9,11],[13,11],
              [9,12],[13,12],
              [9,13],[13,13],
              [9,14],[13,14],
              [9,15],[13,15],
              [9,16],[13,16],
              [9,17],[13,17],
              [9,18],[13,18],
              [9,19],[10,19],[11,19],[12,19],[13,19]
            ],
            '#1E1E1E'
          ) +
          pixels(
            // Screen
            [
              [10,6],[11,6],[12,6],
              [10,7],[11,7],[12,7],
              [10,8],[11,8],[12,8],
              [10,9],[11,9],[12,9],
              [10,10],[11,10],[12,10],
              [10,11],[11,11],[12,11],
              [10,12],[11,12],[12,12],
              [10,13],[11,13],[12,13],
              [10,14],[11,14],[12,14],
              [10,15],[11,15],[12,15],
              [10,16],[11,16],[12,16],
              [10,17],[11,17],[12,17],
              [10,18],[11,18],[12,18]
            ],
            '#2A2E39'
          ) +
          pixels(
            // Camera/ear
            [[11,6]],
            '#4A4F5C'
          ) +
          pixels(
            // Home bar
            [[11,18]],
            '#6C7383', 0.6
          );
        break;
      }

      case 'flute': {
        // Side flute with finger holes
        svgContent =
          pixels(
            // Body
            [[6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10]],
            colors.primary || '#C4B08A'
          ) +
          pixels(
            // Holes
            [[8,10],[10,10],[12,10],[14,10],[16,10]],
            '#7A6A4C'
          ) +
          pixels(
            // Mouthpiece accent
            [[6,10]],
            '#A18E6D', 0.8
          );
        break;
      }

      case 'flashlight': {
        // Hand torch with light cone
        svgContent =
          pixels(
            // Head
            [[7,10],[8,10],[9,10],[7,11],[8,11],[9,11],[7,12],[8,12],[9,12]],
            '#5A5A5A'
          ) +
          pixels(
            // Body
            [[10,11],[11,11],[12,11],[13,11],[14,11]],
            '#3C3C3C'
          ) +
          pixels(
            // Tail cap
            [[15,11]],
            '#2B2B2B'
          ) +
          pixels(
            // Grip band
            [[12,10],[12,12]],
            '#707070'
          ) +
          pixels(
            // Beam
            [[6,10],[6,11],[6,12],[5,10],[5,11],[5,12],[4,11]],
            '#FFF3B0', 0.35
          );
        break;
      }

      case 'syringe': {
        // Medical syringe
        svgContent =
          pixels(
            // Barrel
            [[9,10],[10,10],[11,10],[12,10],[13,10],
             [9,11],[13,11],
             [9,12],[13,12]],
            '#EDEDED'
          ) +
          pixels(
            // Graduations
            [[11,10],[12,11]],
            '#CFCFCF'
          ) +
          pixels(
            // Plunger
            [[8,11],[7,11]],
            '#D6D6D6'
          ) +
          pixels(
            // Needle hub
            [[14,11]],
            '#B0B6BC'
          ) +
          pixels(
            // Needle
            [[15,11],[16,11]],
            '#9BA1A5'
          ) +
          pixels(
            // Med fluid hint
            [[10,12]],
            colors.accent || '#8ED1F7', 0.7
          );
        break;
      }

      // ---------- SMARTER WOODEN BOWL ----------
      // Replace your existing 'bowl' case with this improved version.
      case 'bowl': {
        const isWood =
          (item.material || '').toLowerCase().includes('wood') ||
          (item.name || '').toLowerCase().includes('wooden');

        if (isWood) {
          // Wooden bowl variant
          svgContent =
            pixels(
              // Lip
              [[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10]],
              '#8B6F47'
            ) +
            pixels(
              // Inner
              [[9,11],[10,11],[11,11],[12,11],[13,11]],
              '#C19A6B'
            ) +
            pixels(
              // Outer
              [[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12]],
              '#A2774E'
            ) +
            pixels(
              // Base
              [[10,13],[11,13],[12,13]],
              '#825E3D'
            ) +
            pixels(
              // Wood grain hints
              [[10,11],[12,12]],
              '#6C4A2F', 0.5
            );
        } else {
          // Default ceramic bowl (unchanged logic if you had it before)
          svgContent =
            pixels(
              // Lip
              [[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10]],
              '#B7B7B7'
            ) +
            pixels(
              // Inner
              [[9,11],[10,11],[11,11],[12,11],[13,11]],
              '#E6E6E6'
            ) +
            pixels(
              // Outer
              [[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12]],
              '#CFCFCF'
            ) +
            pixels(
              // Base
              [[10,13],[11,13],[12,13]],
              '#A8A8A8'
            );
        }
        break;
      }

        
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

      case 'potato':
        // Large russet potato with eyes and texture
        svgContent = pixels([
          // Main potato body (oval shape)
          [10,8],[11,8],[12,8],[13,8],[14,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
          [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
          [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
          [10,15],[11,15],[12,15],[13,15],[14,15],
        ], '#C19A6B') +
        pixels([
          // Darker brown patches (russet texture)
          [8,10],[8,11],
          [9,14],[15,14],
          [10,15],[14,15],
        ], '#A0826D', 0.7) +
        pixels([
          // Lighter highlights (top/rounded surface)
          [11,9],[12,9],[13,9],
          [10,10],[11,10],[12,10],
        ], '#D4B896', 0.6) +
        pixels([
          // Potato eyes (small dark spots)
          [10,11],[14,12],
          [11,13],
        ], '#6B5635', 0.8) +
        pixels([
          // Dirt/soil marks
          [9,12],[15,13],
        ], '#8B7355', 0.5) +
        pixels([
          // Shadow underside
          [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],
        ], '#8B6F47', 0.4);
        break;

      case 'corn':
        // Ear of corn with kernels and husk
        svgContent = pixels([
          // Corn cob body (yellow kernels)
          [11,6],[12,6],[13,6],
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [10,8],[11,8],[12,8],[13,8],[14,8],
          [10,9],[11,9],[12,9],[13,9],[14,9],
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
          [11,14],[12,14],[13,14],
        ], '#FFD700') +
        pixels([
          // Individual kernels (darker rows for texture)
          [10,8],[12,8],[14,8],
          [11,9],[13,9],
          [10,10],[12,10],[14,10],
          [11,11],[13,11],
          [10,12],[12,12],[14,12],
          [11,13],[13,13],
        ], '#F4C430', 0.6) +
        pixels([
          // Green husk leaves (left side)
          [8,7],[9,7],
          [7,8],[8,8],[9,8],
          [7,9],[8,9],
          [8,10],[9,10],
          [8,11],[9,11],
          [9,12],
        ], '#6B8E23') +
        pixels([
          // Green husk leaves (right side)
          [15,7],[16,7],
          [15,8],[16,8],[17,8],
          [15,9],[16,9],[17,9],
          [15,10],[16,10],
          [15,11],[16,11],
          [15,12],
        ], '#6B8E23') +
        pixels([
          // Brown corn silk at top
          [10,5],[11,5],[12,5],[13,5],[14,5],
          [11,4],[12,4],[13,4],
        ], '#8B7355', 0.7) +
        pixels([
          // Highlights on kernels
          [11,7],[12,7],
          [11,8],[13,8],
          [12,9],
        ], '#FFFACD', 0.4);
        break;

      case 'scroll':
        // Large centered scroll
        svgContent = pixels([
          // Top wooden rod
          [7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],[16,5],[17,5],
          [6,6],[7,6],[17,6],[18,6],
          [6,7],[18,7],
        ], '#8B6F47') +
        pixels([
          // Paper/parchment
          [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],
          [7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],
          [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
          [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
          [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],
          [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],
          [7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],
          [7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],[17,14],
          [7,15],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],[16,15],[17,15],
        ], '#F5E6D3') +
        pixels([
          // Parchment aging/texture
          [7,8],[8,13],[15,9],[16,14],
        ], '#E8D7C3', 0.6) +
        pixels([
          // Text lines
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
        ], '#5C4033', 0.5) +
        pixels([
          // Bottom wooden rod
          [6,16],[18,16],
          [6,17],[7,17],[17,17],[18,17],
          [7,18],[8,18],[9,18],[10,18],[11,18],[12,18],[13,18],[14,18],[15,18],[16,18],[17,18],
        ], '#8B6F47') +
        pixels([
          // Rod highlights
          [8,5],[10,5],[14,5],[16,5],
          [8,18],[10,18],[14,18],[16,18],
        ], '#A68B6F', 0.5);
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
        // Large shiny gold coin
        svgContent = pixels([
          // Outer rim (dark gold)
          [10,6],[11,6],[12,6],[13,6],[14,6],
          [9,7],[14,7],[15,7],
          [8,8],[15,8],[16,8],
          [7,9],[16,9],[17,9],
          [7,10],[17,10],
          [7,11],[17,11],
          [7,12],[17,12],
          [7,13],[16,13],[17,13],
          [8,14],[15,14],[16,14],
          [9,15],[14,15],[15,15],
          [10,16],[11,16],[12,16],[13,16],[14,16],
        ], '#B8860B') +
        pixels([
          // Main coin face (bright gold)
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
          [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
          [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
          [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
          [10,15],[11,15],[12,15],[13,15],[14,15],
        ], '#FFD700') +
        pixels([
          // Shine highlights (top-left bright spot)
          [10,8],[11,8],[12,8],
          [10,9],[11,9],
        ], '#FFFACD', 0.9) +
        pixels([
          // Shadow (bottom-right)
          [14,13],[15,13],[16,13],
          [15,14],
        ], '#8B6914', 0.6) +
        pixels([
          // Center embossing
          [11,11],[12,11],[13,11],
          [11,12],[12,12],[13,12],
        ], '#B8860B', 0.4);
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

      case 'ingot':
        // Metal ingot/bar - rectangular with metallic sheen
        svgContent = pixels([
          // Base bar (3D perspective)
          [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
          [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
          [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
        ], colors.primary) +
        pixels([
          // Top face (lighter)
          [7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
        ], colors.accent) +
        pixels([
          // Right edge (darker for depth)
          [16,9],[17,9],
          [16,10],[17,10],
          [16,11],[17,11],
        ], colors.secondary) +
        pixels([
          // Metallic highlights
          [9,9],[11,9],[13,9],[15,9],
          [8,10],[12,10],[16,10],
        ], '#FFFFFF', 0.4) +
        pixels([
          // Quality mark/stamp
          [11,10],[12,10],[13,10],
          [11,11],[13,11],
        ], colors.secondary, 0.8);
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

              case 'bottle': {
        // Tall glass bottle with cork + colored liquid
        svgContent =
          pixels(
            // Cork
            [[11,2],[12,2],[13,2],[11,3],[12,3],[13,3]],
            '#8B6F47'
          ) +
          pixels(
            // Neck (glass)
            [[11,4],[12,4],[13,4],[11,5],[12,5],[13,5]],
            '#E0F7FA', 0.75
          ) +
          pixels(
            // Shoulder outline
            [[10,6],[11,6],[12,6],[13,6],[14,6]],
            '#E0F7FA', 0.6
          ) +
          pixels(
            // Body outline
            [
              [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
              [9,8],[15,8],
              [9,9],[15,9],
              [9,10],[15,10],
              [9,11],[15,11],
              [9,12],[15,12],
              [9,13],[15,13],
              [10,14],[11,14],[12,14],[13,14],[14,14]
            ],
            '#E0F7FA', 0.55
          ) +
          pixels(
            // Liquid (uses accent)
            [
              [10,11],[11,11],[12,11],[13,11],[14,11],
              [10,12],[11,12],[12,12],[13,12],[14,12],
              [10,13],[11,13],[12,13],[13,13],[14,13]
            ],
            colors.accent || '#8FD3FF', 0.95
          ) +
          pixels(
            // Shine
            [[10,8],[10,9],[11,8]],
            '#FFFFFF', 0.35
          );
        break;
      }

      case 'barrel': {
        // Classic barrel with hoops and staves
        svgContent =
          pixels(
            // Top ellipse lip
            [[8,4],[9,4],[10,4],[11,4],[12,4],[13,4],[14,4]],
            '#A0522D'
          ) +
          pixels(
            // Body (wood)
            [
              [7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],
              [7,6],[15,6],
              [7,7],[15,7],
              [7,8],[15,8],
              [7,9],[15,9],
              [7,10],[15,10],
              [7,11],[15,11],
              [7,12],[15,12],
              [7,13],[15,13],
              [8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14]
            ],
            colors.primary || '#CD853F'
          ) +
          pixels(
            // Hoops (metal bands)
            [
              [7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],
              [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
              [7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13]
            ],
            colors.secondary || '#6B6B6B'
          ) +
          pixels(
            // Wood highlights
            [[9,7],[11,8],[13,9],[11,12]],
            '#F5DEB3', 0.35
          );
        break;
      }

      case 'chest': {
        // Loot chest with metal trim + lock
        svgContent =
          pixels(
            // Lid
            [
              [6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],
              [5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6]
            ],
            colors.primary || '#B87333'
          ) +
          pixels(
            // Base
            [
              [5,7],[15,7],
              [5,8],[15,8],
              [5,9],[15,9],
              [5,10],[15,10],
              [6,11],[14,11],
              [7,12],[13,12]
            ],
            colors.primary || '#B87333'
          ) +
          pixels(
            // Front panel fill
            [
              [6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
              [6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],
              [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10]
            ],
            '#CD853F'
          ) +
          pixels(
            // Metal trims
            [[5,7],[15,7],[5,11],[15,11]],
            colors.secondary || '#8B6F47'
          ) +
          pixels(
            // Lock
            [[10,9],[11,9],[10,10],[11,10],[10,11],[11,11]],
            '#D4AF37'
          ) +
          pixels(
            // Keyhole
            [[10,10]],
            '#3A2E1E'
          );
        break;
      }

      case 'spear': {
        // Long shaft with leaf spearhead
        svgContent =
          pixels(
            // Spearhead
            [[12,3],[11,4],[12,4],[13,4],[11,5],[12,5],[13,5],[12,6]],
            colors.secondary || '#C0C0C0'
          ) +
          pixels(
            // Shaft
            [
              [12,7],[12,8],[12,9],[12,10],[12,11],[12,12],
              [12,13],[12,14],[12,15],[12,16],[12,17],[12,18],[12,19]
            ],
            colors.primary || '#8B6F47'
          ) +
          pixels(
            // Binding below head
            [[11,7],[12,7],[13,7]],
            '#5C4033'
          );
        break;
      }

      case 'hammer':
      case 'mace':
      case 'club': {
        // Wood handle + metal (hammer) or studded (mace) head
        const headMetal = colors.secondary || '#8E8E8E';
        const stud = category === 'mace';
        svgContent =
          pixels(
            // Handle
            [
              [12,10],[12,11],[12,12],[12,13],[12,14],[12,15],[12,16],[12,17],[12,18],[12,19]
            ],
            colors.primary || '#8B4513'
          ) +
          pixels(
            // Head block
            [[10,7],[11,7],[12,7],[13,7],[14,7],[10,8],[11,8],[12,8],[13,8],[14,8]],
            headMetal
          ) +
          (stud
            ? pixels(
                // Studs for mace
                [[11,7],[13,7],[11,8],[13,8]],
                '#DADADA'
              )
            : pixels(
                // Hammer face highlight
                [[14,7]],
                '#DADADA', 0.8
              )) +
          pixels(
            // Ferrule
            [[11,9],[12,9],[13,9]],
            '#5C4033'
          );
        break;
      }

      case 'sickle':
      case 'scythe': {
        // Curved blade + wooden grip (scaled to icon)
        svgContent =
          pixels(
            // Handle
            [[8,14],[9,14],[10,15],[11,16],[12,17],[13,18]],
            colors.primary || '#8B6F47'
          ) +
          pixels(
            // Blade spine
            [[9,8],[10,8],[11,8],[12,9],[13,10],[13,11],[12,12],[11,13],[10,13]],
            colors.secondary || '#A0A0A0'
          ) +
          pixels(
            // Blade edge (brighter)
            [[10,7],[11,7],[12,8],[13,9],[14,10],[14,11],[13,12],[12,13]],
            '#EDEDED'
          ) +
          pixels(
            // Grip wrap
            [[9,14],[10,15]],
            '#5C4033'
          );
        break;
      }

      case 'key': {
        // Old key: bow + stem + teeth
        svgContent =
          pixels(
            // Bow ring
            [[7,9],[8,8],[9,8],[10,8],[11,9],[10,10],[9,10],[8,10]],
            colors.secondary || '#B5A642'
          ) +
          pixels(
            // Stem
            [[12,9],[13,9],[14,9],[15,9]],
            colors.secondary || '#B5A642'
          ) +
          pixels(
            // Teeth
            [[16,9],[16,10],[15,10]],
            colors.secondary || '#B5A642'
          ) +
          pixels(
            // Shine
            [[9,8],[13,9]],
            '#FFFACD', 0.6
          );
        break;
      }


      case 'basket': {
        // Woven basket with rim + weave pattern
        svgContent =
          pixels(
            // Rim
            [[7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7]],
            '#A56B2A'
          ) +
          pixels(
            // Body
            [
              [6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
              [6,9],[16,9],
              [6,10],[16,10],
              [6,11],[16,11],
              [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12]
            ],
            colors.primary || '#C6924C'
          ) +
          pixels(
            // Weave pattern
            [[7,9],[9,9],[11,9],[13,9],[15,9],[8,10],[10,10],[12,10],[14,10],[7,11],[9,11],[11,11],[13,11],[15,11]],
            '#8C5A25', 0.8
          ) +
          pixels(
            // Highlights
            [[8,8],[12,8],[10,12]],
            '#F0D3A5', 0.35
          );
        break;
      }

      case 'arrow': {
        // Quiver with visible arrows (covers 'arrow'/'bolt'/'quiver')
        svgContent =
          pixels(
            // Arrows fletching tops
            [[9,4],[11,4],[13,4]],
            colors.accent || '#D4AF37'
          ) +
          pixels(
            // Arrow shafts inside
            [[9,5],[9,6],[11,5],[11,6],[13,5],[13,6]],
            '#B08D57'
          ) +
          pixels(
            // Quiver body
            [
              [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],
              [8,8],[14,8],
              [8,9],[14,9],
              [8,10],[14,10],
              [8,11],[14,11],
              [8,12],[14,12],
              [9,13],[10,13],[11,13],[12,13],[13,13]
            ],
            colors.primary || '#8B4513'
          ) +
          pixels(
            // Strap
            [[7,11],[8,12],[9,13]],
            '#5C4033'
          ) +
          pixels(
            // Rim highlight
            [[9,7],[13,7]],
            '#EED5B7', 0.5
          );
        break;
      }

        case 'hammer':
        svgContent = pixels([ // Handle
            [11,10],[11,11],[11,12],[11,13],[11,14],[11,15],[11,16],[11,17],[11,18],[11,19],
            [12,10],[12,11],[12,12],[12,13],[12,14],[12,15],[12,16],[12,17],[12,18],[12,19],
            [13,10],[13,11],[13,12],[13,13],[13,14],[13,15],[13,16],[13,17],[13,18],[13,19],
        ], colors.primary) + pixels([ // Hammer Head
            [7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],[16,5],[17,5],
            [7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],[17,6],
            [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],
            [7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],
            [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
        ], colors.secondary) + pixels([ // Metallic Sheen/Highlight
            [8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],
        ], colors.accent) + pixels([ // Peen (back of hammer)
            [5,7],[6,7],
        ], colors.secondary);
        break;

        
    case 'pot': // Also for Jar
        svgContent = pixels([ // Rim
            [8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],
        ], colors.secondary) + pixels([ // Body
            [7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],
            [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],
            [7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
            [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
            [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
            [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
            [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],
        ], colors.primary) + pixels([ // Highlight
            [9,7],[10,7],[11,7],
        ], colors.accent, 0.7);
        break;

    case 'bottle': // Also for Vial
        svgContent = pixels([ // Cork
            [11,4],[12,4],[13,4],
        ], colors.secondary) + pixels([ // Body (glass)
            [10,5],[11,5],[12,5],[13,5],[14,5],
            [10,6],[11,6],[12,6],[13,6],[14,6],
            [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
            [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
            [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
            [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
            [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
            [10,12],[11,12],[12,12],[13,12],[14,12],
        ], colors.accent, 0.4) + pixels([ // Shine/Highlight
            [10,6],[11,6],
            [10,7],[10,8],
        ], '#FFFFFF', 0.5);
        break;

    case 'anvil':
        svgContent = pixels([ // Main Body
            [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
            [6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],
            [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
            [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
            [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],
        ], colors.secondary) + pixels([ // Horn (pointy end)
            [18,10],[19,10],[20,10],
            [18,11],[19,11],
        ], colors.secondary) + pixels([ // Top flat surface
            [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,9],
        ], colors.primary) + pixels([ // Highlight on top
            [6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
        ], colors.accent, 0.6) + pixels([ // Base
            [8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],
            [7,16],[8,16],[9,16],[10,16],[11,16],[12,16],[13,16],[14,16],[15,16],[16,16],
        ], colors.secondary);
        break;

    case 'wood': // Log
        // Improved log with clear wood grain and bark
        svgContent = pixels([ // Log body
            [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
            [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],[18,10],
            [6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],[18,11],
            [6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],[18,12],
            [6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],[18,13],
            [6,14],[7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],[17,14],[18,14],
            [7,15],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],[16,15],[17,15],
        ], '#8b6f47') +
        pixels([ // Bark texture (darker edges)
            [6,10],[6,11],[6,12],[6,13],[6,14],
            [18,10],[18,11],[18,12],[18,13],[18,14],
            [7,9],[17,9],
            [7,15],[17,15],
        ], '#654321') +
        pixels([ // Wood grain lines
            [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
            [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
            [8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],
        ], '#a0826d', 0.5) +
        pixels([ // Growth rings on end
            [11,11],[12,11],[13,11],
            [10,12],[11,12],[12,12],[13,12],[14,12],
            [11,13],[12,13],[13,13],
        ], '#d2b48c', 0.3);
        break;

    case 'stone':
        // Improved stone with angular shape and texture
        svgContent = pixels([ // Main rock body (angular)
            [10,7],[11,7],[12,7],[13,7],
            [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
            [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
            [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
            [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
            [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
            [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
            [10,14],[11,14],[12,14],[13,14],
        ], '#808080') +
        pixels([ // Dark cracks/crevices
            [11,8],[12,9],
            [10,10],[13,10],
            [9,11],[14,11],
            [11,12],[12,13],
        ], '#5a5a5a', 0.8) +
        pixels([ // Highlight on edges
            [10,7],[13,7],
            [9,8],[14,8],
            [8,9],
            [7,10],
        ], '#a0a0a0', 0.6) +
        pixels([ // Rough texture
            [11,9],[13,9],
            [10,11],[12,11],[15,11],
            [10,12],[13,12],
        ], '#6b6b6b', 0.4);
        break;

    case 'hide':
        // Animal hide/pelt with fur texture and irregular shape
        svgContent = pixels([
          // Main hide body (irregular animal skin shape)
          [10,6],[11,6],[12,6],[13,6],[14,6],
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
          [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
          [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [10,14],[11,14],[12,14],[13,14],[14,14],
        ], colors.primary || '#8B6F47') +
        pixels([
          // Darker fur edges (ragged outline)
          [10,6],[14,6],
          [9,7],[15,7],
          [8,8],[16,8],
          [7,9],[17,9],
          [7,10],[17,10],
          [8,11],[16,11],
          [9,13],[15,13],
          [10,14],[14,14],
        ], colors.secondary || '#654321', 0.8) +
        pixels([
          // Lighter belly/center area
          [11,9],[12,9],[13,9],
          [11,10],[12,10],[13,10],
          [11,11],[12,11],[13,11],
          [11,12],[12,12],
        ], colors.accent || '#B8956B', 0.5) +
        pixels([
          // Fur texture/tufts (scattered)
          [9,8],[11,8],[13,8],[15,8],
          [8,9],[10,9],[14,9],[16,9],
          [9,10],[13,10],[15,10],
          [10,11],[14,11],
          [10,12],[13,12],[15,12],
        ], '#3F2F1D', 0.3) +
        pixels([
          // Shadow/depth
          [8,12],[16,12],
          [9,13],[15,13],
        ], '#000000', 0.2);
        break;

    case 'leather': // Also for Hide
        // Improved leather/hide with better shape and texture
        svgContent = pixels([ // Main leather piece (irregular shape)
            [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
            [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
            [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
            [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
            [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],
            [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
            [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
            [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
            [10,15],[11,15],[12,15],[13,15],[14,15],
        ], '#8b6f47') +
        pixels([ // Darker edges (tanned)
            [9,7],[15,7],
            [8,8],[16,8],
            [7,9],[17,9],
            [7,10],[17,10],
            [7,11],[17,11],
            [8,12],[16,12],
            [8,13],[16,13],
            [9,14],[15,14],
            [10,15],[14,15],
        ], '#654321', 0.7) +
        pixels([ // Surface texture/grain
            [10,8],[11,9],[13,9],[12,10],
            [10,11],[14,11],
            [11,12],[13,12],
            [12,13],
        ], '#a0826d', 0.4) +
        pixels([ // Stitching marks
            [9,9],[9,11],[9,13],
            [15,9],[15,11],[15,13],
        ], '#d2b48c', 0.5);
        break;

    case 'cloth': // Folded fabric
        // Improved cloth with visible folds and texture
        svgContent = pixels([ // Main fabric body (rolled/folded)
            [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
            [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
            [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
            [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],
            [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],
            [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
            [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
        ], colors.primary) +
        pixels([ // Fold shadows
            [9,9],[10,9],[11,9],
            [8,11],[9,11],[10,11],[11,11],[12,11],
            [10,13],[11,13],[12,13],[13,13],
        ], colors.secondary, 0.4) +
        pixels([ // Weave pattern/texture
            [8,8],[10,8],[12,8],[14,8],[16,8],
            [7,10],[9,10],[11,10],[13,10],[15,10],[17,10],
            [8,12],[10,12],[12,12],[14,12],[16,12],
            [9,14],[11,14],[13,14],[15,14],
        ], colors.accent, 0.3) +
        pixels([ // Edge highlight
            [8,8],[9,8],
            [7,9],
        ], colors.accent, 0.5);
        break;

    case 'feather':
        svgContent = pixels([ // Quill/Rachis
            [16,18],[15,17],[14,16],[13,15],[12,14],[11,13],[10,12],[9,11],[8,10],[7,9],
        ], colors.secondary) + pixels([ // Barbs (main body)
            [10,9],[11,10],[12,11],[13,12],[14,13],[15,14],[16,15],[17,16],[18,17],
            [9,9],[10,10],[11,11],[12,12],[13,13],[14,14],[15,15],[16,16],[17,17],
            [8,8],[9,8],[10,8],[11,9],[12,10],[13,11],[14,12],[15,13],[16,14],[17,15],
            [6,8],[7,8],[8,7],[9,7],[10,7],[11,8],[12,9],[13,10],[14,11],[15,12],
            [6,7],[7,6],[8,6],[9,6],[10,6],[11,7],[12,8],[13,9],[14,10],
        ], colors.primary) + pixels([ // Lighter tips/highlight
            [6,7],[7,6],[8,6],[9,6],
        ], colors.accent, 0.6);
        break;

    case 'gem': // Also for Crystal
        // Improved gem with clear facets and sparkle
        svgContent = pixels([ // Top point
            [12,6],
        ], colors.accent) +
        pixels([ // Upper facets
            [11,7],[12,7],[13,7],
            [10,8],[11,8],[12,8],[13,8],[14,8],
        ], colors.accent) +
        pixels([ // Middle (widest part)
            [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
            [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
            [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
        ], colors.primary) +
        pixels([ // Lower facets
            [10,12],[11,12],[12,12],[13,12],[14,12],
            [11,13],[12,13],[13,13],
        ], colors.accent) +
        pixels([ // Bottom point
            [12,14],
        ], colors.accent) +
        pixels([ // Facet shadows (left side)
            [11,7],
            [10,8],[11,9],
            [9,9],[10,10],
            [9,11],[10,12],
            [11,13],
        ], colors.secondary, 0.5) +
        pixels([ // Bright sparkles
            [12,7],
            [13,9],
            [14,10],
        ], '#ffffff', 0.9) +
        pixels([ // Subtle sparkles
            [11,8],[13,8],
            [10,10],[15,10],
            [12,12],
        ], '#ffffff', 0.5);
        break;
        
    case 'meat':
        // Improved meat with bone and marbling
        svgContent = pixels([ // Main meat shape (T-bone steak)
            [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
            [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
            [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
            [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],
            [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],
            [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
            [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
            [10,15],[11,15],[12,15],[13,15],[14,15],
        ], '#d2626d') +
        pixels([ // Bone (T-bone)
            [6,10],[6,11],[6,12],
            [5,11],
            [7,11],
        ], '#f5f5dc') +
        pixels([ // Fat marbling
            [10,9],[11,10],[13,10],
            [9,11],[14,11],
            [11,12],[12,13],
            [10,13],[15,13],
        ], '#fadadd', 0.7) +
        pixels([ // Darker edges (seared)
            [9,8],[15,8],
            [8,9],[16,9],
            [7,10],[17,10],
            [7,12],[17,12],
            [8,13],[16,13],
            [10,15],[14,15],
        ], '#a0424a', 0.8);
        break;

    case 'fish':
        // Improved fish with clear shape and details
        svgContent = pixels([ // Body outline
            [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
            [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
            [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
        ], '#7fa8c7') +
        pixels([ // Tail fin
            [16,10],[17,9],[18,8],
            [16,11],
            [16,12],[17,13],[18,14],
        ], '#6b95b3') +
        pixels([ // Head
            [6,11],[7,11],
        ], '#7fa8c7') +
        pixels([ // Dorsal fin
            [10,9],[11,9],[12,9],
        ], '#6b95b3') +
        pixels([ // Ventral fin
            [10,13],[11,13],
        ], '#6b95b3') +
        pixels([ // Scales/pattern
            [9,11],[11,11],[13,11],
            [10,12],[12,12],[14,12],
        ], '#95c3e3', 0.5) +
        pixels([ // Eye
            [7,11],
        ], '#2c3e50') +
        pixels([ // Eye highlight
            [7,11],
        ], '#ffffff', 0.4) +
        pixels([ // Gill
            [8,11],
        ], '#5a7a92', 0.6);
        break;

    case 'fruit':
        // Improved apple with clear shape and stem
        svgContent = pixels([ // Apple body
            [10,8],[11,8],[12,8],[13,8],
            [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],
            [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
            [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
            [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
            [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
            [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],
            [10,15],[11,15],[12,15],[13,15],
        ], '#e74c3c') +
        pixels([ // Stem
            [11,6],[12,6],
            [12,7],
        ], '#8b6f47') +
        pixels([ // Leaf
            [13,6],[14,6],
        ], '#27ae60') +
        pixels([ // Highlight
            [9,9],[10,9],
            [9,10],
        ], '#ff6b6b', 0.5) +
        pixels([ // Shadow on bottom
            [10,14],[11,14],[12,14],[13,14],
            [11,15],[12,15],
        ], '#c0392b', 0.4);
        break;

    case 'herb': // Herb bundle
        // Improved herb bundle with distinct leaves and twine
        svgContent = pixels([ // Stems
            [11,12],[12,12],[13,12],
            [11,13],[12,13],[13,13],
            [11,14],[12,14],[13,14],
            [11,15],[12,15],[13,15],
            [12,16],
        ], '#8b6f47') +
        pixels([ // Leaves - left branch
            [8,6],[9,6],
            [8,7],[9,7],[10,7],
            [9,8],[10,8],
            [9,9],[10,9],
            [10,10],
        ], '#4a7c59') +
        pixels([ // Leaves - middle branch
            [11,5],[12,5],[13,5],
            [11,6],[12,6],[13,6],
            [11,7],[12,7],[13,7],
            [11,8],[12,8],[13,8],
            [11,9],[12,9],[13,9],
            [12,10],
        ], '#6fa86f') +
        pixels([ // Leaves - right branch
            [15,6],[16,6],
            [14,7],[15,7],[16,7],
            [14,8],[15,8],
            [14,9],[15,9],
            [14,10],
        ], '#4a7c59') +
        pixels([ // Twine/rope binding
            [10,11],[11,11],[12,11],[13,11],[14,11],
            [10,12],[14,12],
        ], '#d2b48c') +
        pixels([ // Leaf veins/detail
            [9,7],[12,6],[15,7],
            [12,8],
        ], '#2d5a3d', 0.5);
        break;

    case 'trousers':
        svgContent = pixels([ // Waistband
            [7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],[17,6],
        ], colors.secondary) + pixels([ // Left leg
            [7,7],[8,7],[9,7],[10,7],[11,7],
            [7,8],[8,8],[9,8],[10,8],[11,8],
            [7,9],[8,9],[9,9],[10,9],[11,9],
            [7,10],[8,10],[9,10],[10,10],[11,10],
            [7,11],[8,11],[9,11],[10,11],[11,11],
            [7,12],[8,12],[9,12],[10,12],[11,12],
            [7,13],[8,13],[9,13],[10,13],[11,13],
            [7,14],[8,14],[9,14],[10,14],[11,14],
        ], colors.primary) + pixels([ // Right leg
            [13,7],[14,7],[15,7],[16,7],[17,7],
            [13,8],[14,8],[15,8],[16,8],[17,8],
            [13,9],[14,9],[15,9],[16,9],[17,9],
            [13,10],[14,10],[15,10],[16,10],[17,10],
            [13,11],[14,11],[15,11],[16,11],[17,11],
            [13,12],[14,12],[15,12],[16,12],[17,12],
            [13,13],[14,13],[15,13],[16,13],[17,13],
            [13,14],[14,14],[15,14],[16,14],[17,14],
        ], colors.primary) + pixels([ // Crotch shadow & center line
            [12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],[12,14],
        ], colors.secondary) + pixels([ // Highlight on thighs
            [8,8],[9,8],
            [15,8],[16,8],
        ], colors.accent, 0.4);
        break;

    case 'hose':
        // Form-fitting hose/tights/leggings
        svgContent = pixels([ // Thin waistband (more fitted than trousers)
            [8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],
        ], colors.secondary) + pixels([ // Left leg (narrow and form-fitting)
            [8,7],[9,7],[10,7],[11,7],
            [8,8],[9,8],[10,8],[11,8],
            [8,9],[9,9],[10,9],[11,9],
            [8,10],[9,10],[10,10],[11,10],
            [8,11],[9,11],[10,11],[11,11],
            [8,12],[9,12],[10,12],[11,12],
            [8,13],[9,13],[10,13],[11,13],
            [8,14],[9,14],[10,14],[11,14],
            [8,15],[9,15],[10,15],[11,15],
        ], colors.primary) + pixels([ // Right leg (narrow and form-fitting)
            [13,7],[14,7],[15,7],[16,7],
            [13,8],[14,8],[15,8],[16,8],
            [13,9],[14,9],[15,9],[16,9],
            [13,10],[14,10],[15,10],[16,10],
            [13,11],[14,11],[15,11],[16,11],
            [13,12],[14,12],[15,12],[16,12],
            [13,13],[14,13],[15,13],[16,13],
            [13,14],[14,14],[15,14],[16,14],
            [13,15],[14,15],[15,15],[16,15],
        ], colors.primary) + pixels([ // Shading to show form-fitting nature (no gap between legs)
            [12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],[12,14],[12,15],
        ], colors.secondary, 0.3) + pixels([ // Highlights on thighs (smooth fabric)
            [9,8],[10,8],
            [14,8],[15,8],
            [9,10],
            [15,10],
        ], colors.accent, 0.5);
        break;

    case 'sandals':
        svgContent = pixels([ // Sole
            [6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],
            [7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],
        ], colors.secondary) + pixels([ // Straps
            [8,10],[9,11],[10,12],
            [15,10],[14,11],[13,12],
            [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],
        ], colors.primary);
        break;

    case 'clogs':
        svgContent = pixels([
          // Left clog sole (thick wood)
          [3,12],[4,12],[5,12],[6,12],[7,12],
          [3,13],[4,13],[5,13],[6,13],[7,13],
          [3,14],[4,14],[5,14],[6,14],[7,14],[8,14],
          // Right clog sole
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
          [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],
        ], '#8B4513') +
        pixels([
          // Left upper (leather/fabric)
          [4,10],[5,10],[6,10],
          [4,11],[5,11],[6,11],
          // Right upper
          [11,10],[12,10],[13,10],
          [11,11],[12,11],[13,11],
        ], colors.primary) +
        pixels([
          // Wood grain/texture
          [4,13],[6,13],[11,13],[13,13],
        ], '#654321', 0.6);
        break;

    case 'cloak':
        // Dramatic flowing cloak with prominent clasp
        svgContent = pixels([ // Large decorative clasp/brooch
            [11,4],[12,4],[13,4],
            [10,5],[11,5],[12,5],[13,5],[14,5],
            [11,6],[12,6],[13,6],
        ], colors.accent) +
        pixels([ // Clasp gem/center
            [12,5],
        ], '#ffffff', 0.9) +
        pixels([ // Collar/neck opening (gap between cloak sides)
            [11,7],[12,7],[13,7],
        ], 'transparent') +
        pixels([ // Left side of cloak (flowing down)
            [9,5],[10,5],
            [8,6],[9,6],[10,6],
            [7,7],[8,7],[9,7],[10,7],
            [6,8],[7,8],[8,8],[9,8],[10,8],
            [6,9],[7,9],[8,9],[9,9],[10,9],
            [5,10],[6,10],[7,10],[8,10],[9,10],[10,10],
            [5,11],[6,11],[7,11],[8,11],[9,11],[10,11],
            [5,12],[6,12],[7,12],[8,12],[9,12],[10,12],
            [6,13],[7,13],[8,13],[9,13],[10,13],[11,13],
            [7,14],[8,14],[9,14],[10,14],[11,14],
            [8,15],[9,15],[10,15],[11,15],
            [9,16],[10,16],[11,16],
        ], colors.primary) +
        pixels([ // Right side of cloak (flowing down)
            [14,5],[15,5],
            [14,6],[15,6],[16,6],
            [14,7],[15,7],[16,7],[17,7],
            [14,8],[15,8],[16,8],[17,8],[18,8],
            [14,9],[15,9],[16,9],[17,9],[18,9],
            [14,10],[15,10],[16,10],[17,10],[18,10],[19,10],
            [14,11],[15,11],[16,11],[17,11],[18,11],[19,11],
            [14,12],[15,12],[16,12],[17,12],[18,12],[19,12],
            [13,13],[14,13],[15,13],[16,13],[17,13],[18,13],
            [13,14],[14,14],[15,14],[16,14],[17,14],
            [13,15],[14,15],[15,15],[16,15],
            [13,16],[14,16],[15,16],
        ], colors.primary) +
        pixels([ // Dramatic folds/shadows on left side
            [7,8],[8,9],[9,10],
            [6,11],[7,12],[8,13],
            [9,14],[10,15],
        ], colors.secondary, 0.8) +
        pixels([ // Dramatic folds/shadows on right side
            [17,8],[16,9],[15,10],
            [18,11],[17,12],[16,13],
            [15,14],[14,15],
        ], colors.secondary, 0.8) +
        pixels([ // Deep creases/central folds
            [10,8],[14,8],
            [10,10],[14,10],
            [10,12],[14,12],
        ], colors.secondary, 0.6) +
        pixels([ // Highlights on fabric edges
            [9,6],[15,6],
            [8,7],[16,7],
            [7,9],[17,9],
            [6,11],[18,11],
        ], '#ffffff', 0.3);
        break;

    case 'coat':
        svgContent = pixels([
          // Collar
          [10,5],[11,5],[12,5],[13,5],[14,5],
          [9,6],[10,6],[14,6],[15,6],
        ], colors.secondary) +
        pixels([
          // Left lapel
          [9,7],[10,7],[11,7],
          [9,8],[10,8],[11,8],
          [9,9],[10,9],[11,9],
          // Right lapel
          [13,7],[14,7],[15,7],
          [13,8],[14,8],[15,8],
          [13,9],[14,9],[15,9],
        ], colors.primary) +
        pixels([
          // Body
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
          [11,14],[12,14],[13,14],
        ], colors.primary) +
        pixels([
          // Buttons
          [11,8],[11,10],[11,12],
        ], colors.accent) +
        pixels([
          // Sleeves
          [7,8],[8,8],[16,8],[17,8],
          [6,9],[7,9],[8,9],[16,9],[17,9],[18,9],
          [6,10],[7,10],[8,10],[16,10],[17,10],[18,10],
          [6,11],[7,11],[8,11],[16,11],[17,11],[18,11],
        ], colors.primary);
        break;

    case 'apron':
        // Work apron with bib, waist ties, and front pocket
        svgContent = pixels([
          // Neck strap
          [11,4],[12,4],[13,4],
          [10,5],[14,5],
          [10,6],[14,6],
        ], colors.secondary || '#5C4033') +
        pixels([
          // Bib top
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
        ], colors.primary) +
        pixels([
          // Waist ties (extending outward)
          [6,10],[7,10],[8,10],[16,10],[17,10],[18,10],
        ], colors.secondary || '#5C4033') +
        pixels([
          // Skirt/lower section
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
          [10,15],[11,15],[12,15],[13,15],[14,15],
        ], colors.primary) +
        pixels([
          // Front pocket outline
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [10,13],[14,13],
        ], colors.secondary || '#5C4033', 0.6) +
        pixels([
          // Stitching details (dots)
          [10,8],[14,8],[10,11],[14,11]],
          colors.accent || '#8B6F47', 0.4
        );
        break;

    case 'rope':
        svgContent = pixels([ // Outer coil
            [11,6],[12,6],[13,6],
            [10,7],[13,7],[14,7],
            [9,8],[14,8],[15,8],
            [9,9],[15,9],
            [9,10],[15,10],
            [9,11],[15,11],
            [10,12],[14,12],[15,12],
            [11,13],[12,13],[13,13],[14,13],
        ], colors.primary) + pixels([ // Rope texture/strands
            [11,7],[12,7],
            [10,8],[13,8],
            [10,9],[14,9],
            [10,10],[14,10],
            [10,11],[14,11],
            [11,12],[13,12],
        ], colors.secondary) + pixels([ // Highlights
            [12,6],[14,7],[15,9],[14,13]],
            '#ffffff', 0.3);
        break;

    case 'turban':
        svgContent = pixels([ // Main body
            [7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],
            [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
            [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
            [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
            [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
        ], colors.primary) + pixels([ // Folds/shadows
            [8,10],[16,10],[10,12],[14,12],
            [7,9],[17,9],
        ], colors.secondary) + pixels([ // Jewel
            [11,9],[12,9],[13,9],
            [12,10],
        ], colors.accent);
        break;

              case 'bone': {
        // Smart: render 'bear claw' when name mentions "claw"
        if ((item?.name || '').toLowerCase().includes('claw')) {
          // Curved talon with keratin shine + shadow
          svgContent =
            pixels(
              // Talon curve (outer edge)
              [[9,6],[10,6],[11,7],[12,8],[13,9],[14,10],[14,11],[13,12],[12,13]],
              '#D9C7A6'
            ) +
            pixels(
              // Inner edge (darker keratin)
              [[10,7],[11,8],[12,9],[13,10],[13,11],[12,12]],
              '#BCA783'
            ) +
            pixels(
              // Base/root
              [[9,9],[9,10],[9,11]],
              '#8B6F47'
            ) +
            pixels(
              // Shine
              [[11,7],[12,8]],
              '#FFFFFF', 0.35
            );
        } else {
          // Generic long bone
          svgContent =
            pixels(
              // Heads
              [[8,6],[9,6],[10,6],[7,7],[11,7],[7,8],[11,8],[8,9],[9,9],[10,9]],
              '#E6DECC'
            ) +
            pixels(
              // Shaft
              [[9,7],[9,8]],
              '#D5C9AE'
            ) +
            pixels(
              // Light shading
              [[10,7],[10,8]],
              '#C3B89C', 0.4
            );
        }
        break;
      }

      case 'leather': {
        // Smart: render 'bear hide' pelt when name mentions hide/pelt (esp. bear)
        const itemName = (item?.name || '').toLowerCase();
        const pelt = itemName.includes('hide') || itemName.includes('pelt');
        if (pelt) {
          const fur = itemName.includes('bear') ? '#5A452D' : (colors.primary || '#8B6F47');
          svgContent =
            pixels(
              // Ragged pelt silhouette
              [
                [7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],
                [6,7],[7,7],[13,7],[14,7],
                [6,8],[8,8],[9,8],[11,8],[13,8],[14,8],
                [6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],
                [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],
                [8,11],[9,11],[10,11],[11,11],[12,11],
                [9,12],[10,12],[11,12]
              ],
              fur
            ) +
            pixels(
              // Lighter belly patch
              [[9,9],[10,9],[11,9],[10,10]],
              '#B3956B', 0.5
            ) +
            pixels(
              // Edge tufts
              [[6,8],[14,8],[6,9],[14,9]],
              '#3F2F1D', 0.5
            );
        } else {
          // Folded leather scrap
          svgContent =
            pixels(
              [[8,7],[9,7],[10,7],[11,7],[12,7],
               [8,8],[12,8],
               [8,9],[12,9],
               [9,10],[10,10],[11,10]],
              colors.primary || '#8B6F47'
            ) +
            pixels(
              [[10,8],[11,8]],
              '#5C4033', 0.6
            ) +
            pixels(
              [[9,7],[11,7]],
              '#E2C9A3', 0.35
            );
        }
        break;
      }

      case 'herb': {
        // Large herb bundle with prominent leaves and twine binding
        const itemName = (item?.name || '').toLowerCase();
        const bundle = itemName.includes('bundle') || itemName.includes('bunch') || itemName.includes('束');
        svgContent =
          pixels(
            // Leafy tops (larger, more prominent)
            [
              [10,5],[11,5],[12,5],[13,5],[14,5],
              [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],
              [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],
              [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
              [10,9],[11,9],[12,9],[13,9],[14,9]
            ],
            colors.primary || '#4E8A4F'
          ) +
          pixels(
            // Leaf detail/veins
            [
              [10,6],[12,6],[14,6],
              [9,7],[11,7],[13,7],[15,7],
              [10,8],[12,8],[14,8]
            ],
            '#2D5A3D', 0.5
          ) +
          pixels(
            // Bright highlights on leaves
            [
              [11,5],[13,5],
              [10,6],[14,6],
              [11,7],[13,7]
            ],
            '#CFE9CF', 0.6
          ) +
          pixels(
            // Stems (thick bunch)
            [
              [11,10],[12,10],[13,10],
              [11,11],[12,11],[13,11],
              [11,12],[12,12],[13,12],
              [11,13],[12,13],[13,13],
              [11,14],[12,14],[13,14],
              [11,15],[12,15],[13,15],
              [11,16],[12,16],[13,16]
            ],
            '#6B8E23'
          ) +
          (bundle
            ? pixels(
                // Twine/rope binding (wrapped around)
                [
                  [10,12],[11,12],[12,12],[13,12],[14,12],
                  [10,13],[14,13],
                  [11,14],[13,14]
                ],
                '#8B6F47'
              ) +
              pixels(
                // Twine highlights
                [[11,12],[13,12]],
                '#A0826D', 0.6
              )
            : '');
        break;
      }

      case 'bandage': {
        // Rolled gauze bandage with loose tail
        svgContent =
          pixels(
            // Roll
            [
              [8,9],[9,9],[10,9],[11,9],
              [8,10],[11,10],
              [8,11],[11,11],
              [8,12],[11,12],
              [8,13],[9,13],[10,13],[11,13]
            ],
            '#F0EDE6'
          ) +
          pixels(
            // Spiral
            [[9,10],[10,11],[9,12]],
            '#D8D3C8'
          ) +
          pixels(
            // Tail
            [[12,12],[13,12],[14,12],[15,12]],
            '#EFEAE0'
          ) +
          pixels(
            // Shadow
            [[10,13],[11,12]],
            '#BFB9AE', 0.35
          );
        break;
      }

      case 'bedroll': {
        // Rolled sleeping mat/bedroll with straps
        svgContent =
          pixels(
            // Roll body (horizontal cylinder)
            [
              [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,9],
              [5,10],[6,10],[17,10],[18,10],
              [5,11],[6,11],[17,11],[18,11],
              [5,12],[6,12],[17,12],[18,12],
              [5,13],[6,13],[17,13],[18,13],
              [5,14],[6,14],[7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],[17,14],[18,14],
            ],
            colors.primary
          ) +
          pixels(
            // Inner fabric (different shade)
            [
              [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
              [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
              [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
              [7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
            ],
            colors.secondary
          ) +
          pixels(
            // Strap left
            [[7,8],[8,8],[7,15],[8,15]],
            '#5C4033'
          ) +
          pixels(
            // Strap right
            [[15,8],[16,8],[15,15],[16,15]],
            '#5C4033'
          ) +
          pixels(
            // Highlights
            [[6,9],[7,9],[15,9],[16,9],[6,14],[7,14]],
            '#ffffff', 0.3
          ) +
          pixels(
            // Shadows
            [[17,13],[18,13],[17,12]],
            '#000000', 0.2
          );
        break;
      }

      case 'blanket': {
        // Folded blanket/cloth
        svgContent =
          pixels(
            // Top fold
            [
              [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],[17,7],
              [6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],
              [6,9],[17,9],
            ],
            colors.primary
          ) +
          pixels(
            // Middle fold
            [
              [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],
              [6,11],[17,11],
              [6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],
            ],
            colors.secondary
          ) +
          pixels(
            // Bottom fold
            [
              [7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
              [7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],
              [8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],
            ],
            colors.primary
          ) +
          pixels(
            // Texture/weave marks
            [[8,8],[10,8],[12,8],[14,8],[16,8]],
            '#ffffff', 0.25
          ) +
          pixels(
            // Shadow lines between folds
            [[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9]],
            '#000000', 0.15
          ) +
          pixels(
            [[6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11]],
            '#000000', 0.15
          );
        break;
      }

      case 'mat':
        // Woven mat/rug with texture
        svgContent = pixels([ // Mat body (rectangular)
          [6,8],[7,8],[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],[17,8],[18,8],
          [6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,9],
          [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],[18,10],
          [6,11],[7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],[17,11],[18,11],
          [6,12],[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],[17,12],[18,12],
          [6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],[18,13],
          [6,14],[7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],[17,14],[18,14],
          [6,15],[7,15],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],[16,15],[17,15],[18,15],
        ], colors.primary) +
        pixels([ // Horizontal weave pattern
          [6,9],[8,9],[10,9],[12,9],[14,9],[16,9],[18,9],
          [7,10],[9,10],[11,10],[13,10],[15,10],[17,10],
          [6,11],[8,11],[10,11],[12,11],[14,11],[16,11],[18,11],
          [7,12],[9,12],[11,12],[13,12],[15,12],[17,12],
          [6,13],[8,13],[10,13],[12,13],[14,13],[16,13],[18,13],
          [7,14],[9,14],[11,14],[13,14],[15,14],[17,14],
        ], colors.secondary, 0.4) +
        pixels([ // Vertical weave pattern (interlaced)
          [7,8],[7,10],[7,12],[7,14],
          [9,9],[9,11],[9,13],[9,15],
          [11,8],[11,10],[11,12],[11,14],
          [13,9],[13,11],[13,13],[13,15],
          [15,8],[15,10],[15,12],[15,14],
          [17,9],[17,11],[17,13],[17,15],
        ], colors.accent, 0.3) +
        pixels([ // Frayed edges (texture)
          [6,8],[18,8],
          [6,15],[18,15],
        ], colors.secondary, 0.6);
        break;

      case 'flint': {
        // Sharp-edged flint stone for fire-starting
        svgContent =
          pixels(
            // Main stone body (irregular shape)
            [
              [10,7],[11,7],[12,7],
              [9,8],[10,8],[11,8],[12,8],[13,8],
              [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],
              [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],
              [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
              [9,12],[10,12],[11,12],[12,12],[13,12],
              [10,13],[11,13],[12,13],
            ],
            '#6B6B6B'
          ) +
          pixels(
            // Darker areas (depth)
            [
              [8,9],[8,10],[9,11],[9,12],
              [12,13],[11,13]
            ],
            '#4A4A4A'
          ) +
          pixels(
            // Lighter/sharp edges
            [
              [11,7],[12,7],
              [13,8],[14,9],
              [13,10],[14,10]
            ],
            '#9B9B9B'
          ) +
          pixels(
            // Bright highlight (glassy surface)
            [[12,8],[13,9]],
            '#BEBEBE', 0.8
          ) +
          pixels(
            // Chipped edges (texture)
            [[10,7],[9,8],[14,11],[13,12]],
            '#858585'
          );
        break;
      }

      case 'wool_cards': {
        // Pair of carding paddles with wire teeth
        svgContent =
          pixels(
            // Left paddle handle
            [[6,15],[6,16],[6,17],[6,18]],
            '#8B5A3C'
          ) +
          pixels(
            // Left paddle base
            [
              [7,9],[8,9],[9,9],[10,9],
              [7,10],[8,10],[9,10],[10,10],
              [7,11],[8,11],[9,11],[10,11],
              [7,12],[8,12],[9,12],[10,12],
              [7,13],[8,13],[9,13],[10,13],
              [7,14],[8,14],[9,14],[10,14],
            ],
            '#A0826D'
          ) +
          pixels(
            // Left card wire teeth (silver lines)
            [
              [7,10],[8,10],[9,10],[10,10],
              [7,11],[9,11],
              [8,12],[10,12],
              [7,13],[9,13],
            ],
            '#C0C0C0'
          ) +
          pixels(
            // Right paddle handle
            [[18,15],[18,16],[18,17],[18,18]],
            '#8B5A3C'
          ) +
          pixels(
            // Right paddle base
            [
              [14,9],[15,9],[16,9],[17,9],
              [14,10],[15,10],[16,10],[17,10],
              [14,11],[15,11],[16,11],[17,11],
              [14,12],[15,12],[16,12],[17,12],
              [14,13],[15,13],[16,13],[17,13],
              [14,14],[15,14],[16,14],[17,14],
            ],
            '#A0826D'
          ) +
          pixels(
            // Right card wire teeth (silver lines)
            [
              [14,10],[15,10],[16,10],[17,10],
              [15,11],[17,11],
              [14,12],[16,12],
              [15,13],[17,13],
            ],
            '#C0C0C0'
          ) +
          pixels(
            // Highlights on paddles
            [[7,9],[14,9]],
            '#ffffff', 0.3
          );
        break;
      }

      case 'cotton': {
        // Fluffy cotton boll
        svgContent =
          pixels(
            // Cotton fluff (white puffy shape)
            [
              [10,8],[11,8],[12,8],[13,8],
              [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],
              [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
              [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
              [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],
              [10,13],[11,13],[12,13],[13,13],
            ],
            '#F8F8F8'
          ) +
          pixels(
            // Soft shadow on fluff
            [
              [8,10],[8,11],[9,12],
              [11,13],[12,13]
            ],
            '#E8E8E0', 0.7
          ) +
          pixels(
            // Brown boll base/pod pieces
            [
              [9,13],[14,13],
              [10,14],[11,14],[12,14],[13,14],
            ],
            '#8B6F47'
          ) +
          pixels(
            // Seeds (tiny dots)
            [[10,10],[12,11],[11,12]],
            '#D4AF37', 0.6
          ) +
          pixels(
            // Highlights (bright spots)
            [[11,9],[13,10],[12,11]],
            '#ffffff', 0.9
          );
        break;
      }

      case 'resin': {
        // Amber/tree resin droplet
        svgContent =
          pixels(
            // Resin blob shape
            [
              [11,7],[12,7],
              [10,8],[11,8],[12,8],[13,8],
              [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],
              [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],
              [10,11],[11,11],[12,11],[13,11],[14,11],
              [10,12],[11,12],[12,12],[13,12],
              [11,13],[12,13],
            ],
            '#D4A574'
          ) +
          pixels(
            // Darker amber (translucent effect)
            [
              [9,9],[9,10],
              [10,11],[10,12],
              [11,13]
            ],
            '#B8860B'
          ) +
          pixels(
            // Light shine/transparency
            [
              [11,8],[12,8],[13,9],
              [13,10],[14,10]
            ],
            '#F4E4C1', 0.8
          ) +
          pixels(
            // Bright highlight (glassy)
            [[12,8],[13,9]],
            '#FFFACD', 0.9
          ) +
          pixels(
            // Small debris inside (authentic detail)
            [[11,10],[12,11]],
            '#8B7355', 0.4
          );
        break;
      }

      case 'bamboo': {
        // Bamboo stalk with segments
        svgContent =
          pixels(
            // Main stalk body
            [
              [11,4],[12,4],
              [11,5],[12,5],
              [11,6],[12,6],
              [11,7],[12,7],
              [11,8],[12,8],
              [11,9],[12,9],
              [11,10],[12,10],
              [11,11],[12,11],
              [11,12],[12,12],
              [11,13],[12,13],
              [11,14],[12,14],
              [11,15],[12,15],
              [11,16],[12,16],
              [11,17],[12,17],
            ],
            '#90B77D'
          ) +
          pixels(
            // Segment rings (nodes)
            [[10,7],[11,7],[12,7],[13,7]],
            '#6B8E5F'
          ) +
          pixels(
            [[10,11],[11,11],[12,11],[13,11]],
            '#6B8E5F'
          ) +
          pixels(
            [[10,15],[11,15],[12,15],[13,15]],
            '#6B8E5F'
          ) +
          pixels(
            // Highlights (shiny surface)
            [
              [12,5],[12,6],
              [12,8],[12,9],[12,10],
              [12,12],[12,13],[12,14],
              [12,16],[12,17]
            ],
            '#B8D89F', 0.6
          ) +
          pixels(
            // Shadow side
            [
              [11,5],[11,6],
              [11,8],[11,9],[11,10],
              [11,12],[11,13],[11,14],
              [11,16],[11,17]
            ],
            '#7A9B6C', 0.5
          );
        break;
      }

      case 'root': {
        // Gnarled plant root
        svgContent =
          pixels(
            // Main root body (irregular/organic shape)
            [
              [11,6],[12,6],
              [10,7],[11,7],[12,7],[13,7],
              [9,8],[10,8],[11,8],[12,8],
              [9,9],[10,9],[11,9],
              [10,10],[11,10],[12,10],
              [11,11],[12,11],[13,11],
              [12,12],[13,12],[14,12],
              [13,13],[14,13],
              [14,14],
            ],
            '#8B6F47'
          ) +
          pixels(
            // Secondary root tendril (left)
            [[8,9],[7,10],[7,11],[8,12]],
            '#7D5C3A'
          ) +
          pixels(
            // Secondary root tendril (right)
            [[13,8],[14,9],[15,10]],
            '#7D5C3A'
          ) +
          pixels(
            // Root hairs/fibers
            [[6,11],[8,13],[15,11]],
            '#6B5635', 0.6
          ) +
          pixels(
            // Darker spots (dirt/nodes)
            [[9,8],[10,10],[13,12],[14,14]],
            '#5C4033'
          ) +
          pixels(
            // Highlights
            [[11,7],[12,8],[13,11]],
            '#A0826D', 0.5
          );
        break;
      }

      case 'earthworm': {
        // Segmented earthworm (no overlapping pixels)
        svgContent =
          pixels(
            // Worm body base
            [
              [14,7],
              [13,8],[14,8],[15,8],
              [12,9],[13,9],[14,9],[15,9],
              [11,10],[12,10],[13,10],
              [10,11],[11,11],
              [9,12],[10,12],
              [9,13],[10,13],
              [9,14],[10,14],
              [10,15],[11,15],
              [11,16],
            ],
            '#B8917F'
          ) +
          pixels(
            // Darker underside (non-overlapping)
            [[13,8],[12,9],[11,10],[10,11]],
            '#A68072'
          ) +
          pixels(
            // Segment lines
            [[12,10],[10,12],[11,14]],
            '#8B6F5E'
          ) +
          pixels(
            // Lighter top side highlights
            [[15,8],[15,9],[13,10],[12,11]],
            '#D4B5A3'
          ) +
          pixels(
            // Head
            [[14,7]],
            '#9B7A6A'
          );
        break;
      }

      case 'sextant': {
        // Small brass sextant
        svgContent =
          pixels(
            // Frame arc
            [[7,12],[8,11],[9,10],[10,9],[11,8],[12,7],[13,6]],
            '#B8860B'
          ) +
          pixels(
            // Cross-brace
            [[10,9],[10,10],[10,11]],
            '#A2740A'
          ) +
          pixels(
            // Sight/arm
            [[12,9],[13,9],[14,9],[15,9]],
            '#CFA12C'
          ) +
          pixels(
            // Knob
            [[9,12]],
            '#E7C75A'
          ) +
          pixels(
            // Highlights
            [[12,7],[13,6]],
            '#FFF1A6', 0.5
          );
        break;
      }

      case 'amphora': {
        // Classical amphora with twin handles
        svgContent =
          pixels(
            // Neck & lip
            [[11,4],[12,4],[13,4],[10,5],[11,5],[12,5],[13,5],[14,5]],
            colors.secondary || '#A0522D'
          ) +
          pixels(
            // Body
            [
              [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
              [8,7],[15,7],
              [8,8],[15,8],
              [8,9],[15,9],
              [9,10],[14,10],
              [10,11],[13,11],
              [11,12],[12,12]
            ],
            colors.primary || '#CD853F'
          ) +
          pixels(
            // Handles
            [[8,7],[7,8],[7,9],[15,7],[16,8],[16,9]],
            colors.primary || '#CD853F'
          ) +
          pixels(
            // Shine
            [[11,7],[10,9]],
            '#F5DEB3', 0.35
          );
        break;
      }

      case 'gem': {
        // Faceted gemstone (diamond cut)
        const body = colors.accent || '#6EC1FF';
        svgContent =
          pixels(
            // Crown
            [[10,6],[11,6],[12,6],[13,6]],
            body
          ) +
          pixels(
            // Top facets
            [[9,7],[10,7],[11,7],[12,7],[13,7],[14,7]],
            body
          ) +
          pixels(
            // Girdle
            [[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8]],
            body
          ) +
          pixels(
            // Pavilion
            [[10,9],[11,9],[12,9],[13,9],[11,10],[12,10],[12,11]],
            '#4FA8E8'
          ) +
          pixels(
            // Sparkles
            [[10,7],[13,8]],
            '#FFFFFF', 0.6
          );
        break;
      }

      case 'incense': {
        // Stick incense in a small holder with smoke
        svgContent =
          pixels(
            // Holder
            [[9,15],[10,15],[11,15],[12,15],[13,15]],
            '#8B6F47'
          ) +
          pixels(
            // Ash bed
            [[10,14],[11,14],[12,14]],
            '#B0A89A'
          ) +
          pixels(
            // Stick
            [[11,9],[12,10],[13,11],[14,12]],
            '#7A3E1E'
          ) +
          pixels(
            // Ember tip
            [[15,13]],
            '#FF5A3A'
          ) +
          pixels(
            // Smoke wisps
            [[11,7],[12,6],[12,5],[11,4]],
            '#EDEDED', 0.5
          );
        break;
      }

      case 'whetstone': {
        // Oval stone with bevel + tiny spark
        svgContent =
          pixels(
            // Stone body
            [
              [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],
              [8,11],[13,11],
              [8,12],[13,12],
              [8,13],[13,13],
              [9,14],[10,14],[11,14],[12,14]
            ],
            '#9AA3A8'
          ) +
          pixels(
            // Bevel
            [[9,11],[12,13]],
            '#7E878C', 0.6
          ) +
          pixels(
            // Spark
            [[14,11]],
            '#FFD700', 0.8
          );
        break;
      }

      case 'bucket': {
        // Wooden bucket with band and wire handle
        svgContent =
          pixels(
            // Rim
            [[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6]],
            '#8B6F47'
          ) +
          pixels(
            // Body
            [
              [7,7],[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
              [7,8],[15,8],
              [7,9],[15,9],
              [7,10],[15,10],
              [8,11],[14,11]
            ],
            colors.primary || '#B9824E'
          ) +
          pixels(
            // Metal band
            [[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9]],
            colors.secondary || '#6B6B6B'
          ) +
          pixels(
            // Wire handle
            [[8,6],[9,5],[10,5],[11,5],[12,5],[13,6]],
            '#A0A0A0'
          ) +
          pixels(
            // Highlights
            [[9,7],[12,8]],
            '#F0D5B0', 0.35
          );
        break;
      }

      case 'spice': {
        // Small spice pouch spilling grains
        svgContent =
          pixels(
            // Pouch
            [
              [8,8],[9,8],[10,8],[11,8],[12,8],
              [7,9],[13,9],
              [7,10],[13,10],
              [8,11],[12,11],
              [9,12],[10,12],[11,12]
            ],
            colors.primary || '#9C6B3E'
          ) +
          pixels(
            // Cord
            [[8,9],[9,9],[10,9],[11,9],[12,9]],
            '#5C4033'
          ) +
          pixels(
            // Spilled grains
            [[13,11],[14,12],[12,12],[13,13]],
            colors.accent || '#C26828'
          ) +
          pixels(
            // Highlights
            [[10,8],[8,10]],
            '#F0D5B0', 0.35
          );
        break;
      }

      case 'salt': {
        // Cone of salt crystals with a pinch
        svgContent =
          pixels(
            // Cone
            [
              [11,6],
              [10,7],[11,7],[12,7],
              [9,8],[10,8],[11,8],[12,8],[13,8],
              [9,9],[10,9],[11,9],[12,9],[13,9],
              [10,10],[11,10],[12,10]
            ],
            '#F5F7FA'
          ) +
          pixels(
            // Sparkle crystals
            [[8,10],[14,10],[11,6]],
            '#DDE6EE'
          ) +
          pixels(
            // Pinch
            [[15,9],[16,10]],
            '#FFFFFF', 0.8
          );
        break;
      }

      case 'flour': {
        // Sack of flour with light dusting
        svgContent =
          pixels(
            // Sack body
            [
              [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],
              [7,8],[14,8],
              [7,9],[14,9],
              [7,10],[14,10],
              [8,11],[13,11],
              [9,12],[10,12],[11,12],[12,12]
            ],
            '#B88A55'
          ) +
          pixels(
            // Sack rim
            [[8,7],[9,7],[10,7],[11,7],[12,7],[13,7]],
            '#8B6F47'
          ) +
          pixels(
            // Flour top
            [[8,8],[9,8],[10,8],[11,8],[12,8],[13,8]],
            '#F6F2EA'
          ) +
          pixels(
            // Dust
            [[9,12],[12,12]],
            '#ECE5D7', 0.6
          );
        break;
      }

      case 'sugar': {
        // Sugar cubes + scoop
        svgContent =
          pixels(
            // Cubes
            [[9,9],[10,9],[9,10],[10,10],[12,8],[13,8],[12,9],[13,9]],
            '#FAFAFA'
          ) +
          pixels(
            // Shadows
            [[10,10],[13,9]],
            '#DADADA', 0.6
          ) +
          pixels(
            // Scoop
            [[7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12]],
            '#A0A6AB'
          ) +
          pixels(
            // Handle
            [[6,12],[5,11],[4,11]],
            '#8B6F47'
          );
        break;
      }

      case 'oil': {
        // Larger oil jug with prominent droplet
        svgContent =
          pixels(
            // Jug body
            [
              [11,6],[12,6],[13,6],
              [10,7],[11,7],[12,7],[13,7],[14,7],
              [9,8],[10,8],[14,8],[15,8],
              [9,9],[10,9],[14,9],[15,9],
              [9,10],[10,10],[14,10],[15,10],
              [9,11],[10,11],[14,11],[15,11],
              [10,12],[11,12],[12,12],[13,12],[14,12]
            ],
            colors.primary || '#C08C3A'
          ) +
          pixels(
            // Handle
            [[15,8],[16,9],[16,10],[15,11]],
            colors.primary || '#C08C3A'
          ) +
          pixels(
            // Spout
            [[9,7],[8,8]],
            colors.primary || '#C08C3A'
          ) +
          pixels(
            // Large oil droplet falling
            [
              [6,10],[7,10],
              [6,11],[7,11],
              [6,12],[7,12],
              [6,13]
            ],
            '#E3C15A'
          ) +
          pixels(
            // Jug shine
            [[11,7],[12,8]],
            '#F5DEB3', 0.5
          ) +
          pixels(
            // Droplet shine
            [[6,11]],
            '#FFF8DC', 0.8
          );
        break;
      }

      case 'mortar_pestle':
        // Mortar and pestle (grinding tool)
        svgContent = pixels([ // Mortar bowl
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
          [7,13],[16,13],[17,13],
          [7,14],[17,14],
          [7,15],[17,15],
          [8,16],[9,16],[10,16],[11,16],[12,16],[13,16],[14,16],[15,16],[16,16],
        ], colors.primary) +
        pixels([ // Mortar inner bowl
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
          [9,14],[15,14],[16,14],
          [10,15],[14,15],[15,15],
        ], colors.secondary, 0.6) +
        pixels([ // Pestle (angled grinding tool)
          [13,5],[14,5],
          [13,6],[14,6],[15,6],
          [14,7],[15,7],[16,7],
          [15,8],[16,8],
          [16,9],
        ], colors.primary) +
        pixels([ // Pestle handle (thicker)
          [13,5],[13,6],
        ], colors.secondary, 0.8) +
        pixels([ // Pestle head (rounded end)
          [16,9],[17,9],[17,10],
        ], colors.secondary) +
        pixels([ // Ground substance in mortar
          [11,14],[12,14],[13,14],[14,14],
        ], '#8B7355', 0.6);
        break;

      case 'salve':
        // Small jar/tin of salve
        svgContent = pixels([ // Jar body (round)
          [10,9],[11,9],[12,9],[13,9],[14,9],
          [9,10],[10,10],[14,10],[15,10],
          [9,11],[15,11],
          [9,12],[15,12],
          [9,13],[15,13],
          [10,14],[11,14],[12,14],[13,14],[14,14],
        ], colors.primary) +
        pixels([ // Lid
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [10,7],[11,7],[12,7],[13,7],[14,7],
        ], colors.secondary) +
        pixels([ // Lid knob/handle
          [12,6],
        ], colors.secondary) +
        pixels([ // Salve/ointment inside (visible through glass/light)
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
        ], '#E8D4A0', 0.7) +
        pixels([ // Jar highlights (glass shine)
          [10,9],[14,10],
        ], '#ffffff', 0.6);
        break;

      case 'vegetable': {
        // Carrot with greens
        svgContent =
          pixels(
            // Greens
            [[10,6],[11,6],[12,6],[9,7],[13,7],[10,7],[12,7]],
            '#5FAE4C'
          ) +
          pixels(
            // Carrot body
            [
              [10,8],[11,8],[12,8],
              [10,9],[11,9],[12,9],
              [10,10],[11,10],
              [10,11]
            ],
            '#F28C28'
          ) +
          pixels(
            // Ridges
            [[11,9],[10,10]],
            '#D0711E'
          );
        break;
      }

      case 'fruit': {
        // Apple with leaf
        svgContent =
          pixels(
            // Apple
            [
              [10,7],[11,7],[12,7],
              [9,8],[10,8],[11,8],[12,8],[13,8],
              [9,9],[10,9],[11,9],[12,9],[13,9],
              [10,10],[11,10],[12,10]
            ],
            '#D94A4A'
          ) +
          pixels(
            // Stem
            [[11,6]],
            '#6B3E1E'
          ) +
          pixels(
            // Leaf
            [[12,6],[13,6]],
            '#5FAE4C'
          ) +
          pixels(
            // Highlight
            [[10,8]],
            '#FFFFFF', 0.35
          );
        break;
      }

      case 'fish': {
        // Side-view fish
        svgContent =
          pixels(
            // Body
            [
              [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],
              [9,10],[10,10],[11,10],[12,10],
              [8,11],[9,11],[10,11],[11,11],[12,11],[13,11]
            ],
            '#8EC5D6'
          ) +
          pixels(
            // Tail
            [[14,10],[15,9],[15,11]],
            '#7BB5C8'
          ) +
          pixels(
            // Eye
            [[9,10]],
            '#2B2B2B'
          ) +
          pixels(
            // Belly
            [[10,11],[11,11]],
            '#DDEFF5'
          );
        break;
      }

      case 'meat': {
        // Ham shank
        svgContent =
          pixels(
            // Meat body
            [
              [8,8],[9,8],[10,8],[11,8],[12,8],
              [8,9],[12,9],
              [8,10],[12,10],
              [9,11],[10,11],[11,11]
            ],
            '#C55B5B'
          ) +
          pixels(
            // Marbling
            [[9,9],[11,10]],
            '#ECA6A6', 0.6
          ) +
          pixels(
            // Bone
            [[13,9],[14,9]],
            '#F1E9D7'
          );
        break;
      }

      case 'cheese': {
        // Wedge of cheese
        svgContent =
          pixels(
            // Wedge
            [
              [9,8],[10,8],[11,8],[12,8],
              [9,9],[12,9],
              [9,10],[12,10],
              [9,11],[10,11],[11,11]
            ],
            '#F2D35A'
          ) +
          pixels(
            // Holes
            [[10,9],[11,10]],
            '#DDBB38'
          ) +
          pixels(
            // Rim
            [[12,8],[12,9],[12,10]],
            '#E4C148'
          );
        break;
      }

      case 'soup': {
        // Steaming bowl of soup
        svgContent =
          pixels(
            // Bowl
            [[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12]],
            '#8B6F47'
          ) +
          pixels(
            // Liquid
            [[9,11],[10,11],[11,11],[12,11],[13,11],[14,11]],
            colors.accent || '#D49D5A'
          ) +
          pixels(
            // Steam
            [[10,9],[11,8],[12,9],[13,8]],
            '#EDEDED', 0.5
          ) +
          pixels(
            // Bowl base
            [[10,13],[11,13],[12,13],[13,13]],
            '#6F5535'
          );
        break;
      }

      case 'bowl': {
        // Empty ceramic bowl
        svgContent =
          pixels(
            // Lip
            [[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10]],
            '#B7B7B7'
          ) +
          pixels(
            // Inner
            [[9,11],[10,11],[11,11],[12,11],[13,11]],
            '#E6E6E6'
          ) +
          pixels(
            // Outer
            [[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12]],
            '#CFCFCF'
          ) +
          pixels(
            // Base
            [[10,13],[11,13],[12,13]],
            '#A8A8A8'
          );
        break;
      }

      case 'cup': {
        // Goblet/cup
        svgContent =
          pixels(
            // Cup
            [[10,7],[11,7],[12,7],
             [9,8],[13,8],
             [9,9],[13,9],
             [10,10],[11,10],[12,10]],
            '#D3C7A3'
          ) +
          pixels(
            // Stem
            [[11,11],[11,12]],
            '#B7AA82'
          ) +
          pixels(
            // Foot
            [[10,13],[11,13],[12,13]],
            '#B7AA82'
          ) +
          pixels(
            // Shine
            [[10,8]],
            '#FFFFFF', 0.4
          );
        break;
      }

      case 'pot': {
        // Clay pot / jar
        svgContent =
          pixels(
            // Neck & rim
            [[10,6],[11,6],[12,6],[9,7],[13,7]],
            '#8B5A2B'
          ) +
          pixels(
            // Body
            [
              [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],
              [7,9],[14,9],
              [7,10],[14,10],
              [8,11],[13,11],
              [9,12],[12,12],
            ],
            colors.primary || '#B27639'
          ) +
          pixels(
            // Highlight
            [[10,9],[11,10]],
            '#E6C2A0', 0.35
          );
        break;
      }

      case 'shovel': {
        // Spade with handle
        svgContent =
          pixels(
            // Blade
            [[11,7],[12,7],[10,8],[11,8],[12,8],[13,8],[11,9],[12,9]],
            '#A0A6AB'
          ) +
          pixels(
            // Shaft
            [[12,10],[12,11],[12,12],[12,13],[12,14],[12,15],[12,16],[12,17]],
            '#8B6F47'
          ) +
          pixels(
            // Grip
            [[12,6],[11,6],[13,6]],
            '#5C4033'
          );
        break;
      }

      case 'hoe': {
        // Hoe head + handle
        svgContent =
          pixels(
            // Head
            [[11,8],[12,8],[13,8],[14,8]],
            '#9BA1A5'
          ) +
          pixels(
            // Handle
            [[10,9],[10,10],[10,11],[10,12],[10,13],[10,14],[10,15]],
            '#986C3E'
          ) +
          pixels(
            // Ferrule
            [[11,9]],
            '#6B4A2C'
          );
        break;
      }

      case 'rake': {
        // Rake head + handle
        svgContent =
          pixels(
            // Head bar
            [[10,8],[11,8],[12,8],[13,8],[14,8]],
            '#9BA1A5'
          ) +
          pixels(
            // Tines
            [[10,9],[11,9],[12,9],[13,9],[14,9]],
            '#9BA1A5'
          ) +
          pixels(
            // Handle
            [[12,10],[12,11],[12,12],[12,13],[12,14],[12,15]],
            '#8B6F47'
          );
        break;
      }

      case 'chisel': {
        // Metal chisel with wooden handle
        svgContent =
          pixels(
            // Blade
            [[10,8],[11,8],[12,8]],
            '#AEB3B7'
          ) +
          pixels(
            // Neck
            [[11,9]],
            '#8F9499'
          ) +
          pixels(
            // Handle
            [[11,10],[11,11],[11,12],[11,13]],
            '#9C6B3E'
          ) +
          pixels(
            // Cap
            [[11,14]],
            '#6B4A2C'
          );
        break;
      }

      case 'tongs': {
        // Blacksmith tongs
        svgContent =
          pixels(
            // Jaws
            [[10,8],[11,8],[13,8],[14,8]],
            '#7A7F84'
          ) +
          pixels(
            // Arms crossing
            [[11,9],[12,10],[13,11],[11,11],[12,10]],
            '#7A7F84'
          ) +
          pixels(
            // Handles
            [[10,12],[9,13],[8,14],[14,12],[15,13],[16,14]],
            '#7A7F84'
          ) +
          pixels(
            // Pivot
            [[12,10]],
            '#B9BDC0'
          );
        break;
      }

      case 'bellows': {
        // Forge bellows with nozzle
        svgContent =
          pixels(
            // Body (leather)
            [
              [8,10],[9,10],[10,10],[11,10],
              [8,11],[11,11],
              [8,12],[11,12],
              [9,13],[10,13]
            ],
            colors.primary || '#8B6F47'
          ) +
          pixels(
            // Wood sides
            [[7,10],[12,10],[7,11],[12,11],[7,12],[12,12]],
            '#6B4A2C'
          ) +
          pixels(
            // Nozzle
            [[13,11],[14,11]],
            '#9BA1A5'
          ) +
          pixels(
            // Rivets
            [[7,11],[12,11]],
            '#D4D4D4'
          );
        break;
      }

      /* ===================== NEW ICON CASES ===================== */

// 1) KNIFE (distinct from dagger)
case 'knife': {
  // Slim, single-edged utility knife
  svgContent =
    pixels( // Blade edge (bright)
      [[12,6],[13,6],[14,6],[15,6]],
      '#EDEDED'
    ) +
    pixels( // Spine (darker)
      [[12,7],[13,7],[14,7]],
      '#BFC3C7'
    ) +
    pixels( // Tang/bolster
      [[11,8]],
      '#9BA1A5'
    ) +
    pixels( // Handle scales
      [[10,8],[9,8],[8,8]],
      colors.primary || '#8B4513'
    ) +
    pixels( // Pins
      [[9,8]],
      '#E6D5B8', 0.7
    );
  break;
}

// 2) INK POT
case 'ink_pot': {
  svgContent =
    pixels( // Body
      [[9,10],[10,10],[11,10],[12,10],[13,10],
       [9,11],[13,11],
       [9,12],[13,12],
       [10,13],[11,13],[12,13]],
      '#1F1F1F'
    ) +
    pixels( // Neck/rim
      [[10,9],[11,9],[12,9]],
      '#2B2B2B'
    ) +
    pixels( // Shine
      [[10,10],[10,11]],
      '#5C5C5C', 0.45
    ) +
    pixels( // Ink droplet
      [[14,13]],
      '#101016'
    );
  break;
}

// 3) WHETSTONE  (skip if you already added mine earlier)
case 'whetstone': {
  svgContent =
    pixels(
      [[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],
       [8,11],[13,11],
       [8,12],[13,12],
       [8,13],[13,13],
       [9,14],[10,14],[11,14],[12,14]],
      '#9AA3A8'
    ) +
    pixels([[9,11],[12,13]], '#7E878C', 0.6) +
    pixels([[14,11]], '#FFD700', 0.8);
  break;
}

// 4) SPINDLE
case 'spindle': {
  svgContent =
    pixels( // Shaft
      [[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],[12,14]],
      colors.primary || '#8B6F47'
    ) +
    pixels( // Whorl
      [[11,9],[12,9],[13,9],[11,10],[13,10],[11,11],[12,11],[13,11]],
      '#B08D57'
    ) +
    pixels( // Tip & highlights
      [[12,4]], '#6B4A2C') +
    pixels([[11,10]], '#EED5B7', 0.5);
  break;
}

// 5) STONE CHISEL (distinct from metal chisel)
case 'stone_chisel': {
  svgContent =
    pixels( // Wide stone blade
      [[10,7],[11,7],[12,7],[13,7],[14,7],
       [11,8],[12,8],[13,8]],
      '#A8AAA9'
    ) +
    pixels( // Neck
      [[12,9]],
      '#8D9194'
    ) +
    pixels( // Wooden handle
      [[12,10],[12,11],[12,12],[12,13]],
      '#9C6B3E'
    ) +
    pixels([[12,14]], '#6B4A2C'); // Cap
  break;
}

// 6) LOCKPICK
case 'lockpick': {
  svgContent =
    pixels( // Pick
      [[8,12],[9,12],[10,12],[11,12],[12,12],[13,12]],
      '#AEB3B7'
    ) +
    pixels( // Hook tip
      [[14,11]],
      '#D4D7DA'
    ) +
    pixels( // Tension wrench (angled)
      [[9,14],[10,13],[11,12],[12,11]],
      '#8F9499'
    ) +
    pixels([[8,14]], '#C6CACE', 0.7);
  break;
}

// 7) DRUM
case 'drum': {
  svgContent =
    pixels( // Rim
      [[8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8]],
      '#8B6F47'
    ) +
    pixels( // Skin
      [[9,9],[10,9],[11,9],[12,9],[13,9],
       [9,10],[13,10],
       [9,11],[13,11],
       [10,12],[11,12],[12,12]],
      '#EAD8B0'
    ) +
    pixels( // Lacing
      [[9,10],[10,11],[12,11],[13,10]],
      '#6B4A2C'
    ) +
    pixels( // Shadow
      [[10,12],[12,12]],
      '#C7B48A', 0.5
    );
  break;
}

// 8) POCKET WATCH
case 'pocket_watch': {
  svgContent =
    pixels( // Case ring
      [[11,5]],
      '#C9A23A'
    ) +
    pixels( // Case
      [[9,6],[10,6],[11,6],[12,6],[13,6],
       [8,7],[14,7],
       [8,8],[14,8],
       [8,9],[14,9],
       [9,10],[10,10],[11,10],[12,10],[13,10]],
      '#B8860B'
    ) +
    pixels( // Face
      [[9,7],[10,7],[11,7],[12,7],[13,7],
       [9,8],[13,8],
       [9,9],[13,9],
       [10,10],[11,10],[12,10]],
      '#F5F5DC'
    ) +
    pixels( // Hands
      [[11,8],[12,8],[11,9]],
      '#2B2B2B'
    ) +
    pixels( // Shine
      [[10,7]],
      '#FFF1A6', 0.5
    );
  break;
}

// 9) GOURD FLASK (variant; separate from generic 'gourd')
case 'gourd_flask': {
  svgContent =
    pixels( // Stopper
      [[12,3],[12,4]],
      '#6B4423'
    ) +
    pixels( // Neck
      [[11,5],[12,5],[13,5]],
      '#DEB887'
    ) +
    pixels( // Body
      [[10,6],[11,6],[12,6],[13,6],[14,6],
       [10,7],[14,7],
       [10,8],[14,8],
       [11,9],[12,9],[13,9]],
      '#D2691E'
    ) +
    pixels( // Strap
      [[14,6],[15,7],[15,8]],
      '#5C4033'
    ) +
    pixels( // Highlight
      [[11,7],[12,8]],
      '#F4A460', 0.5
    );
  break;
}

// 10) LEATHER BAG (distinct look from generic bag)
case 'leather_bag': {
  svgContent =
    pixels( // Flap
      [[8,7],[9,7],[10,7],[11,7],[12,7],[13,7]],
      '#8B6F47'
    ) +
    pixels( // Body
      [[7,8],[13,8],
       [7,9],[13,9],
       [7,10],[13,10],
       [8,11],[12,11],
       [9,12],[10,12],[11,12]],
      colors.primary || '#A07448'
    ) +
    pixels( // Strap
      [[13,7],[14,8],[14,9],[13,10]],
      '#5C4033'
    ) +
    pixels( // Clasp
      [[10,9]],
      '#D4AF37'
    );
  break;
}

// 11) PURSE
case 'purse': {
  svgContent =
    pixels( // Mouth with clasp
      [[10,7],[11,7],[12,7]],
      '#C9A23A'
    ) +
    pixels( // Body
      [[9,8],[10,8],[11,8],[12,8],[13,8],
       [9,9],[13,9],
       [9,10],[13,10],
       [10,11],[11,11],[12,11]],
      colors.primary || '#B87333'
    ) +
    pixels([[11,7]], '#FFF1A6', 0.5); // Clasp shine
  break;
}

// 12) PONCHO
case 'poncho': {
  svgContent =
    pixels( // Neck opening
      [[11,6]],
      '#2B2B2B'
    ) +
    pixels( // Body block
      [[8,7],[9,7],[10,7],[11,7],[12,7],[13,7],
       [7,8],[14,8],
       [7,9],[14,9],
       [7,10],[14,10],
       [8,11],[13,11]],
      colors.primary || '#9C5C3A'
    ) +
    pixels( // Pattern band
      [[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9]],
      colors.accent || '#D4AF37', 0.9
    ) +
    pixels( // Fringe
      [[8,12],[9,12],[10,12],[11,12],[12,12],[13,12]],
      '#6B3F27'
    );
  break;
}

// 13) SARI
case 'sari': {
  svgContent =
    pixels( // Drape silhouette
      [[9,6],[10,6],[11,6],
       [8,7],[12,7],
       [8,8],[12,8],
       [8,9],[12,9],
       [9,10],[11,10],
       [10,11]],
      colors.primary || '#8B008B'
    ) +
    pixels( // Border
      [[8,8],[12,8],[9,10],[11,10]],
      colors.accent || '#FFD700'
    ) +
    pixels( // Highlight fold
      [[10,7],[10,9]],
      '#FFC6FF', 0.35
    );
  break;
}

// 14) VEIL
case 'veil': {
  svgContent =
    pixels( // Head band
      [[10,6],[11,6],[12,6]],
      colors.secondary || '#A0A0A0'
    ) +
    pixels( // Sheer drape
      [[9,7],[10,7],[11,7],[12,7],[13,7],
       [9,8],[13,8],
       [9,9],[13,9],
       [10,10],[11,10],[12,10]],
      '#EAEAF5', 0.6
    ) +
    pixels( // Shine
      [[10,8]],
      '#FFFFFF', 0.3
    );
  break;
}

// 15) OCHRE LUMP
case 'ochre': {
  svgContent =
    pixels(
      [[9,10],[10,10],[11,10],
       [8,11],[9,11],[10,11],[11,11],[12,11],
       [9,12],[10,12]],
      '#C26E2D'
    ) +
    pixels([[10,11],[11,10]], '#E39A5A', 0.5);
  break;
}

// 16) VINE
case 'vine': {
  svgContent =
    pixels( // Curving stem
      [[8,12],[9,11],[10,10],[11,9],[12,8],[13,7]],
      '#2E7D32'
    ) +
    pixels( // Leaves
      [[9,12],[11,10],[12,9]],
      '#4CAF50'
    ) +
    pixels( // Tendril tip
      [[14,7]],
      '#66BB6A', 0.7
    );
  break;
}

// 17) SHELL (cowrie-like)
case 'shell': {
  svgContent =
    pixels( // Body
      [[10,7],[11,7],[12,7],
       [9,8],[13,8],
       [9,9],[13,9],
       [10,10],[11,10],[12,10]],
      '#FFF4E1'
    ) +
    pixels( // Slit
      [[11,8],[11,9]],
      '#C2A27E'
    ) +
    pixels( // Rim shade
      [[10,7],[12,7]],
      '#E8D3B3', 0.6
    );
  break;
}

// 18) IVORY TUSK
case 'ivory_tusk': {
  svgContent =
    pixels( // Curve
      [[8,12],[9,11],[10,10],[11,9],[12,8],[13,7]],
      '#FFFFF0'
    ) +
    pixels( // Shadow side
      [[9,11],[10,10],[11,9]],
      '#E8E2CF', 0.6
    );
  break;
}

// 19) CHEESE  (skip if already added earlier)
case 'cheese': {
  svgContent =
    pixels(
      [[9,8],[10,8],[11,8],[12,8],
       [9,9],[12,9],
       [9,10],[12,10],
       [9,11],[10,11],[11,11]],
      '#F2D35A'
    ) +
    pixels([[10,9],[11,10]], '#DDBB38') +
    pixels([[12,8],[12,9],[12,10]], '#E4C148');
  break;
}

      // ---------- FORAGING & CRAFTING ----------

      case 'chips': {
        // Crisp shards (uses accent to tint e.g., gourd chips)
        svgContent =
          pixels(
            // Big shards
            [[8,9],[9,9],[10,9],[9,10],[10,10],
             [12,8],[13,8],[14,8],[13,9],
             [11,12],[12,12],[12,13],
             [15,11],[16,11],[16,12]],
            colors.accent || '#E3983A'
          ) +
          pixels(
            // Smalls / crumbs
            [[7,11],[11,10],[14,10],[15,13]],
            '#F5D2A1', 0.75
          ) +
          pixels(
            // Shadow hint
            [[9,11],[13,9],[12,14]],
            '#A76A2A', 0.35
          );
        break;
      }

      case 'seeds': {
        // Little seed pile (almond/pepita shaped)
        svgContent =
          pixels(
            // Bodies
            [[9,11],[10,11],[12,10],[13,10],[11,12],[12,12],[13,12],[14,11]],
            colors.primary || '#B98B49'
          ) +
          pixels(
            // Highlights
            [[10,11],[12,10],[13,12]],
            '#EED5B7', 0.5
          ) +
          pixels(
            // Scatter
            [[8,12],[15,11]],
            colors.secondary || '#8E6A37'
          );
        break;
      }

      case 'dust': {
        // Soft powder mound (flour dust, ground herbs, etc.)
        svgContent =
          pixels(
            // Mound
            [[9,12],[10,12],[11,12],[12,12],[13,12],
             [10,11],[11,11],[12,11],
             [11,10]],
            '#EFEAE0'
          ) +
          pixels(
            // Grain sparkle / clumps
            [[10,11],[12,12],[13,12]],
            '#D9D2C5', 0.6
          ) +
          pixels(
            // Airy motes
            [[14,10],[8,11]],
            '#FFFFFF', 0.35
          );
        break;
      }

      case 'crumbs': {
        // Chunky crumbs (baking crumbs, crust bits)
        svgContent =
          pixels(
            // Cubes
            [[9,11],[10,11],[12,10],[13,10],[12,12],[13,12]],
            '#D9B47B'
          ) +
          pixels(
            // Darker pieces
            [[11,12],[14,11]],
            '#B7874E'
          ) +
          pixels(
            // Highlights
            [[10,11],[12,10]],
            '#F3D7AD', 0.45
          );
        break;
      }

      case 'log': {
        // Short log; auto-variants for birch vs generic
        const isBirch =
          (item.name || '').toLowerCase().includes('birch') ||
          (item.material || '').toLowerCase().includes('birch');
        const bark = isBirch ? '#ECE7E2' : '#7A542E';
        const barkShade = isBirch ? '#B8B3AE' : '#5A3E23';
        const endFace = isBirch ? '#E9E4DF' : '#A87443';

        svgContent =
          pixels(
            // Body
            [
              [6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],
              [6,10],[17,10],
              [6,11],[17,11],
              [6,12],[17,12],
              [6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13]
            ],
            bark
          ) +
          pixels(
            // Ends (cut rings)
            [[5,10],[5,11],[18,10],[18,11]],
            endFace
          ) +
          (isBirch
            ? pixels(
                // Birch lenticels/stripes
                [[8,10],[10,10],[12,10],[14,10],[16,10],[9,12],[11,12],[13,12],[15,12]],
                barkShade, 0.8
              )
            : pixels(
                // Regular bark texture
                [[8,10],[11,10],[14,10],[9,12],[12,12],[15,12]],
                barkShade, 0.5
              )) +
          pixels(
            // Highlights
            [[8,9],[12,9],[14,13]],
            '#F5DEB3', isBirch ? 0.25 : 0.2
          );
        break;
      }

      // === MODERN CLOTHING ===
      case 'business_suit':
        // Business suit with lapels and structured shoulders
        svgContent = pixels([
          // Lapels
          [9,6],[10,6],[14,6],[15,6],
          [9,7],[15,7],
          // Structured shoulders
          [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],
          // Body (fitted cut)
          [10,8],[11,8],[12,8],[13,8],[14,8],
          [10,9],[11,9],[12,9],[13,9],[14,9],
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
        ], colors.primary) +
        pixels([
          // Button line
          [12,8],[12,10],[12,12],
        ], colors.secondary) +
        pixels([
          // Lapel details
          [9,6],[15,6],
        ], colors.accent);
        break;

      case 'blazer':
        // Casual blazer, less structured than business suit
        svgContent = pixels([
          // Lapels (smaller than suit)
          [10,6],[14,6],
          [10,7],[14,7],
          // Body
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
        ], colors.primary) +
        pixels([
          // Single button
          [12,9],
        ], colors.secondary);
        break;

      case 'dress_shirt':
        // Dress shirt with collar and placket
        svgContent = pixels([
          // Collar
          [10,5],[11,5],[12,5],[13,5],[14,5],
          [10,6],[14,6],
          // Shirt body
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
        ], colors.primary) +
        pixels([
          // Button placket
          [12,7],[12,8],[12,9],[12,10],[12,11],[12,12],
        ], colors.secondary) +
        pixels([
          // Buttons
          [12,8],[12,10],[12,12],
        ], colors.accent);
        break;

      case 'hoodie':
        // Hoodie with attached hood and kangaroo pocket
        svgContent = pixels([
          // Hood
          [9,4],[10,4],[11,4],[12,4],[13,4],[14,4],[15,4],
          [9,5],[15,5],
          // Wide shoulders (casual fit)
          [8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],
          // Body (loose fit)
          [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
        ], colors.primary) +
        pixels([
          // Kangaroo pocket
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[14,11],
        ], colors.secondary) +
        pixels([
          // Hood drawstring
          [11,5],[13,5],
        ], colors.accent);
        break;

      case 't_shirt':
        // Casual t-shirt with wide shoulders
        svgContent = pixels([
          // Neck
          [11,5],[12,5],[13,5],
          // Wide casual shoulders
          [8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],
          // Body
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
        ], colors.primary) +
        pixels([
          // Short sleeves
          [8,6],[8,7],
          [16,6],[16,7],
        ], colors.secondary);
        break;

      case 'polo_shirt':
        // Polo shirt with collar and partial button placket
        svgContent = pixels([
          // Collar
          [10,5],[11,5],[12,5],[13,5],[14,5],
          // Body
          [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
        ], colors.primary) +
        pixels([
          // Short placket
          [12,6],[12,7],[12,8],
        ], colors.secondary) +
        pixels([
          // Two buttons
          [12,7],[12,8],
        ], colors.accent);
        break;

      case 'jeans':
        // Jeans with center seam and pockets
        svgContent = pixels([
          // Waistband
          [10,6],[11,6],[12,6],[13,6],[14,6],
          // Hip area
          [10,7],[11,7],[12,7],[13,7],[14,7],
          // Legs with center seam
          [10,8],[11,8],[13,8],[14,8],
          [10,9],[11,9],[13,9],[14,9],
          [10,10],[11,10],[13,10],[14,10],
          [10,11],[11,11],[13,11],[14,11],
          [10,12],[11,12],[13,12],[14,12],
          [10,13],[11,13],[13,13],[14,13],
        ], colors.primary) +
        pixels([
          // Center seam
          [12,8],[12,9],[12,10],[12,11],[12,12],[12,13],
        ], colors.secondary) +
        pixels([
          // Pockets
          [10,7],[14,7],
        ], colors.accent);
        break;

      case 'slacks':
        // Dress pants with pressed crease
        svgContent = pixels([
          // Waistband
          [10,6],[11,6],[12,6],[13,6],[14,6],
          // Body (fitted)
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [10,8],[11,8],[12,8],[13,8],[14,8],
          [10,9],[11,9],[12,9],[13,9],[14,9],
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
        ], colors.primary) +
        pixels([
          // Pressed creases
          [11,8],[11,9],[11,10],[11,11],[11,12],[11,13],
          [13,8],[13,9],[13,10],[13,11],[13,12],[13,13],
        ], colors.secondary);
        break;

      case 'sneakers':
        // Athletic sneakers with laces
        svgContent = pixels([
          // Sole
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
          [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
          // Upper
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
        ], colors.primary) +
        pixels([
          // Laces
          [10,10],[12,10],[14,10],
        ], colors.secondary) +
        pixels([
          // Sole detail
          [8,12],[16,12],
        ], colors.accent);
        break;

      case 'dress_shoes':
        // Formal dress shoes
        svgContent = pixels([
          // Sole
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          // Upper
          [10,10],[11,10],[12,10],[13,10],[14,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
        ], colors.primary) +
        pixels([
          // Shoe shine highlight
          [11,10],[12,10],[13,10],
        ], colors.accent);
        break;

      case 'tie':
        // Improved necktie with proper shape
        svgContent = pixels([ // Knot
          [10,6],[11,6],[12,6],[13,6],[14,6],
          [10,7],[11,7],[12,7],[13,7],[14,7],
          [11,8],[12,8],[13,8],
        ], colors.secondary) +
        pixels([ // Tie body
          [11,9],[12,9],[13,9],
          [11,10],[12,10],[13,10],
          [11,11],[12,11],[13,11],
          [11,12],[12,12],[13,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
          [10,14],[11,14],[12,14],[13,14],[14,14],
          [10,15],[11,15],[12,15],[13,15],[14,15],
          [11,16],[12,16],[13,16],
          [11,17],[12,17],[13,17],
          [12,18],
        ], colors.primary) +
        pixels([ // Diagonal stripes pattern
          [11,10],[13,10],
          [10,13],[12,13],[14,13],
          [11,15],[13,15],
          [12,17],
        ], colors.accent, 0.5);
        break;

      case 'watch':
        // Improved pocket watch with chain
        svgContent = pixels([ // Watch face outer ring
          [10,9],[11,9],[12,9],[13,9],[14,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [10,14],[11,14],[12,14],[13,14],[14,14],
        ], colors.primary) +
        pixels([ // Watch face inner
          [11,10],[12,10],[13,10],
          [11,11],[12,11],[13,11],
          [11,12],[12,12],[13,12],
          [11,13],[12,13],[13,13],
        ], '#f8f8f8') +
        pixels([ // Watch hands (12 and 3 o'clock)
          [12,10],[12,11],
          [12,11],[13,11],
        ], '#2c3e50') +
        pixels([ // Crown/winder
          [15,11],[16,11],
        ], colors.secondary) +
        pixels([ // Chain
          [12,8],[12,7],[12,6],
        ], colors.secondary, 0.6) +
        pixels([ // Numbers (12, 3, 6, 9)
          [12,10],[14,11],[12,13],[10,11],
        ], '#2c3e50', 0.3);
        break;

      case 'briefcase':
        // Business briefcase
        svgContent = pixels([
          // Body
          [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
          [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
        ], colors.primary) +
        pixels([
          // Handle
          [11,6],[12,6],[13,6],
          [10,7],[14,7],
        ], colors.secondary) +
        pixels([
          // Lock/clasp
          [12,10],
        ], colors.accent);
        break;

      case 'backpack':
        // Modern backpack
        svgContent = pixels([
          // Main compartment
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
        ], colors.primary) +
        pixels([
          // Straps
          [8,6],[8,7],[8,8],
          [16,6],[16,7],[16,8],
        ], colors.secondary) +
        pixels([
          // Front pocket
          [10,9],[11,9],[12,9],[13,9],[14,9],
        ], colors.accent);
        break;

      case 'headwrap':
        // Large traditional head wrap with draped fabric and folds
        svgContent = pixels([ // Main wrap body (wrapped around head)
          [10,6],[11,6],[12,6],[13,6],[14,6],
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
          [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
        ], colors.primary) +
        pixels([ // Draped tail/end hanging down
          [6,9],[7,9],
          [6,10],[7,10],
          [6,11],[7,11],
          [6,12],[7,12],
          [6,13],[7,13],
          [7,14],
        ], colors.secondary) +
        pixels([ // Right side drape
          [17,9],[18,9],
          [17,10],[18,10],
          [17,11],
        ], colors.secondary, 0.9) +
        pixels([ // Fabric folds/texture lines
          [10,8],[12,8],[14,8],
          [9,9],[11,9],[13,9],[15,9],
          [10,10],[12,10],[14,10],
        ], colors.accent, 0.5) +
        pixels([ // Highlights on folds
          [11,7],[13,7],
          [10,8],[14,8],
        ], '#ffffff', 0.4) +
        pixels([ // Shadows in deeper folds
          [9,10],[15,10],
          [10,11],[14,11],
        ], '#000000', 0.2);
        break;

      case 'bracelet':
        // Improved bracelet with beads/links
        svgContent = pixels([ // Main band
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [8,9],[9,9],[15,9],[16,9],
          [7,10],[8,10],[16,10],[17,10],
          [7,11],[17,11],
          [7,12],[17,12],
          [7,13],[8,13],[16,13],[17,13],
          [8,14],[9,14],[15,14],[16,14],
          [9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],
        ], colors.primary) +
        pixels([ // Inner hole
          [10,9],[11,9],[12,9],[13,9],[14,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
          [8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],[16,12],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [10,14],[11,14],[12,14],[13,14],[14,14],
        ], 'transparent') +
        pixels([ // Beads/decorations
          [9,8],[11,8],[13,8],[15,8],
          [8,10],[16,10],
          [8,13],[16,13],
          [9,15],[11,15],[13,15],[15,15],
        ], colors.accent) +
        pixels([ // Clasp
          [12,8],[12,15],
        ], colors.secondary);
        break;

      case 'flask':
        // Water flask/bottle
        svgContent = pixels([
          // Neck
          [11,6],[12,6],[13,6],
          [11,7],[12,7],[13,7],
        ], colors.primary) +
        pixels([
          // Body
          [10,8],[11,8],[12,8],[13,8],[14,8],
          [9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [10,13],[11,13],[12,13],[13,13],[14,13],
          [11,14],[12,14],[13,14],
        ], colors.primary) +
        pixels([
          // Cork/stopper
          [11,5],[12,5],[13,5],
        ], '#8B4513') +
        pixels([
          // Water line/contents
          [10,11],[11,11],[12,11],[13,11],[14,11],
          [10,12],[11,12],[12,12],[13,12],[14,12],
        ], '#87CEEB', 0.6);
        break;

      case 'box':
        // Improved storage box with 3D perspective and details
        svgContent = pixels([ // Front face
          [7,10],[8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],
          [7,11],[8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],
          [7,12],[8,12],[9,12],[10,12],[11,12],[12,12],[13,12],[14,12],
          [7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],
          [7,14],[8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],
          [7,15],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],
        ], '#8b6f47') +
        pixels([ // Top face (lighter)
          [7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
          [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
        ], '#a0826d') +
        pixels([ // Right side face
          [15,10],[16,10],
          [15,11],[16,11],
          [15,12],[16,12],
          [15,13],[16,13],
          [15,14],[16,14],
        ], '#6b563a') +
        pixels([ // Metal corner reinforcements
          [7,10],[8,10],
          [7,11],
          [7,14],
          [7,15],[8,15],
          [13,10],[14,10],
          [14,11],
          [14,14],
          [13,15],[14,15],
        ], '#5a5a5a') +
        pixels([ // Lock/latch
          [10,12],[11,12],
          [10,13],[11,13],
        ], '#d4af37') +
        pixels([ // Wood grain on front
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],
          [8,13],[9,13],[12,13],[13,13],
        ], '#7a6449', 0.3);
        break;

      case 'pottery':
        // Improved pottery/ceramic vase with clear shape
        svgContent = pixels([ // Rim
          [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
        ], '#cd853f') +
        pixels([ // Neck
          [9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],
          [10,11],[11,11],[12,11],[13,11],[14,11],
        ], '#daa520') +
        pixels([ // Body (widening)
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
          [8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],
          [8,14],[9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],[16,14],
          [9,15],[10,15],[11,15],[12,15],[13,15],[14,15],[15,15],
        ], '#d2691e') +
        pixels([ // Base
          [10,16],[11,16],[12,16],[13,16],[14,16],
        ], '#a0522d') +
        pixels([ // Decorative band
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
        ], '#8b4513', 0.5) +
        pixels([ // Highlight
          [9,9],[10,10],
          [9,12],
        ], '#f4a460', 0.4) +
        pixels([ // Shadow
          [14,11],
          [15,13],[16,13],
          [15,14],[16,14],
          [14,15],
        ], '#8b4513', 0.3);
        break;

      case 'hoe':
        svgContent = pixels([
          // Handle
          [12,2],[12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],[12,14],
        ], '#8B4513') +
        pixels([
          // Blade horizontal
          [7,13],[8,13],[9,13],[10,13],[11,13],[13,13],[14,13],[15,13],[16,13],[17,13],
          [7,14],[8,14],[9,14],[10,14],[11,14],[13,14],[14,14],[15,14],[16,14],[17,14],
        ], colors.primary) +
        pixels([
          // Blade edge (sharp)
          [7,14],[8,14],[9,14],[10,14],[11,14],[13,14],[14,14],[15,14],[16,14],[17,14],
        ], colors.secondary) +
        pixels([
          // Handle grip
          [11,5],[13,5],[11,7],[13,7],[11,9],[13,9],
        ], '#654321', 0.6);
        break;

      case 'rake':
        svgContent = pixels([
          // Handle
          [12,2],[12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],
        ], '#8B4513') +
        pixels([
          // Cross beam
          [7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],
        ], colors.primary) +
        pixels([
          // Tines
          [8,14],[8,15],
          [10,14],[10,15],
          [12,14],[12,15],
          [14,14],[14,15],
          [16,14],[16,15],
        ], colors.primary) +
        pixels([
          // Handle connection
          [12,12],[12,13],
        ], colors.secondary);
        break;

      case 'shovel':
        svgContent = pixels([
          // Handle
          [12,2],[12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],
        ], '#8B4513') +
        pixels([
          // Blade
          [10,12],[11,12],[12,12],[13,12],[14,12],
          [9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],
          [9,14],[10,14],[11,14],[12,14],[13,14],[14,14],[15,14],
          [10,15],[11,15],[12,15],[13,15],[14,15],
          [11,16],[12,16],[13,16],
        ], colors.primary) +
        pixels([
          // Blade edge
          [11,16],[12,16],[13,16],
        ], colors.secondary) +
        pixels([
          // Handle connection
          [11,11],[12,11],[13,11],
        ], colors.secondary);
        break;

      case 'scythe':
        svgContent = pixels([
          // Long handle
          [5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],
        ], '#8B4513') +
        pixels([
          // Curved blade
          [6,13],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],
          [7,14],[8,14],[9,14],[10,14],[11,14],[12,14],
          [8,15],[9,15],[10,15],[11,15],
          [9,16],[10,16],
        ], colors.primary) +
        pixels([
          // Blade edge
          [8,15],[9,15],[10,15],[11,15],
          [9,16],[10,16],
        ], colors.secondary) +
        pixels([
          // Handle grip
          [4,8],[6,8],[4,10],[6,10],
        ], '#654321', 0.6);
        break;

      case 'plow':
        svgContent = pixels([
          // Main beam
          [6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],
        ], '#8B4513') +
        pixels([
          // Share (cutting blade)
          [12,7],[13,7],[14,7],[15,7],[16,7],
          [13,8],[14,8],[15,8],[16,8],[17,8],
          [14,9],[15,9],[16,9],[17,9],[18,9],
          [15,10],[16,10],[17,10],[18,10],
          [16,11],[17,11],[18,11],
        ], colors.primary) +
        pixels([
          // Moldboard
          [10,7],[11,7],[12,7],
          [9,8],[10,8],[11,8],[12,8],
          [8,9],[9,9],[10,9],[11,9],
          [8,10],[9,10],[10,10],
          [8,11],[9,11],
        ], colors.secondary) +
        pixels([
          // Handle/stilt
          [8,5],[8,4],[8,3],[8,2],
          [12,5],[12,4],[12,3],[12,2],
        ], '#8B4513');
        break;

      case 'business_suit':
        svgContent = pixels([
          // Jacket collar
          [9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],
          [8,6],[9,6],[15,6],[16,6],
        ], colors.secondary) +
        pixels([
          // Jacket body
          [9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],
          [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
          [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
          [8,11],[9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],[16,11],
          [9,12],[10,12],[11,12],[12,12],[13,12],[14,12],[15,12],
        ], colors.primary) +
        pixels([
          // Buttons
          [11,8],[11,10],
        ], colors.accent) +
        pixels([
          // Tie
          [12,6],[12,7],[12,8],[12,9],
        ], '#8B0000') +
        pixels([
          // Shirt collar visible
          [10,6],[14,6],
        ], '#FFFFFF');
        break;

      case 'hoodie':
        svgContent = pixels([
          // Hood
          [8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],
          [7,4],[8,4],[9,4],[10,4],[11,4],[12,4],[13,4],[14,4],[15,4],[16,4],[17,4],
          [7,5],[8,5],[16,5],[17,5],
        ], colors.primary) +
        pixels([
          // Body
          [8,6],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[15,6],[16,6],
          [8,7],[9,7],[10,7],[11,7],[12,7],[13,7],[14,7],[15,7],[16,7],
          [8,8],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[15,8],[16,8],
          [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],
          [8,10],[9,10],[10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],
          [9,11],[10,11],[11,11],[12,11],[13,11],[14,11],[15,11],
        ], colors.primary) +
        pixels([
          // Kangaroo pocket
          [10,9],[11,9],[12,9],[13,9],[14,9],
          [10,10],[11,10],[12,10],[13,10],[14,10],
        ], colors.secondary, 0.3) +
        pixels([
          // Drawstrings
          [11,6],[13,6],
        ], '#8B4513', 0.6);
        break;

      case 'jeans':
        svgContent = pixels([
          // Left leg
          [7,8],[8,8],[9,8],[10,8],[11,8],
          [7,9],[8,9],[9,9],[10,9],[11,9],
          [7,10],[8,10],[9,10],[10,10],[11,10],
          [7,11],[8,11],[9,11],[10,11],[11,11],
          [7,12],[8,12],[9,12],[10,12],[11,12],
          [8,13],[9,13],[10,13],[11,13],
          [8,14],[9,14],[10,14],[11,14],
          // Right leg
          [13,8],[14,8],[15,8],[16,8],[17,8],
          [13,9],[14,9],[15,9],[16,9],[17,9],
          [13,10],[14,10],[15,10],[16,10],[17,10],
          [13,11],[14,11],[15,11],[16,11],[17,11],
          [13,12],[14,12],[15,12],[16,12],[17,12],
          [13,13],[14,13],[15,13],[16,13],
          [13,14],[14,14],[15,14],[16,14],
        ], colors.primary) +
        pixels([
          // Center seam
          [12,8],[12,9],[12,10],[12,11],[12,12],[12,13],[12,14],
        ], colors.secondary, 0.7) +
        pixels([
          // Pocket stitching
          [9,9],[10,9],
          [14,9],[15,9],
        ], colors.accent, 0.5) +
        pixels([
          // Cuffs
          [8,14],[9,14],[10,14],[11,14],
          [13,14],[14,14],[15,14],[16,14],
        ], colors.secondary);
        break;

      case 'sneakers':
        svgContent = pixels([
          // Left sneaker sole
          [3,12],[4,12],[5,12],[6,12],[7,12],[8,12],
          [2,13],[3,13],[4,13],[5,13],[6,13],[7,13],[8,13],
          [2,14],[3,14],[4,14],[5,14],[6,14],[7,14],[8,14],[9,14],
          // Right sneaker sole
          [15,12],[16,12],[17,12],[18,12],[19,12],[20,12],
          [15,13],[16,13],[17,13],[18,13],[19,13],[20,13],[21,13],
          [14,14],[15,14],[16,14],[17,14],[18,14],[19,14],[20,14],[21,14],
        ], '#FFFFFF') +
        pixels([
          // Left upper
          [4,10],[5,10],[6,10],[7,10],
          [4,11],[5,11],[6,11],[7,11],
          // Right upper
          [16,10],[17,10],[18,10],[19,10],
          [16,11],[17,11],[18,11],[19,11],
        ], colors.primary) +
        pixels([
          // Nike swoosh style
          [5,10],[6,11],
          [17,10],[18,11],
        ], colors.accent) +
        pixels([
          // Laces
          [5,9],[6,9],
          [17,9],[18,9],
        ], '#FFFFFF', 0.8);
        break;

      default:
        // Check if baseSprites has a mapping for this item
        const itemName = (item?.name || '').toLowerCase();
        const baseSpriteArchetype = getItemArchetypeMax(itemName);

        // Log items that have baseSprite mappings we haven't implemented yet
        if (baseSpriteArchetype && !['GENERIC', 'BOX', 'CRATE'].includes(baseSpriteArchetype)) {
          console.log(`Item '${itemName}' has baseSprite archetype: ${baseSpriteArchetype} (not yet implemented in GenerativeItemIcon)`);
        }
        
        // Generic item (warm wooden crate) - with golden corner if baseSprite mapping exists
        svgContent = (
          // Add a subtle indicator if baseSprites has a specific mapping
          baseSpriteArchetype && !['GENERIC', 'BOX', 'CRATE'].includes(baseSpriteArchetype) ? 
          pixels([
            // Small golden star in corner showing baseSprite exists
            [6,6],[7,5],[8,6],
            [6,7],[7,7],[8,7],
            [7,8],
          ], '#FFD700', 0.4) : ''
        ) + pixels([
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
    
    // Phase 7: Add quality and condition indicators
    const addQualityOverlay = () => {
      // Quality overlays disabled - no sparkles or visual effects
      return '';
    };
    
    // Apply quality overlay to the base sprite
    svgContent += addQualityOverlay();
    
    return svgContent;
  }, [item, size]);

 return (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    className={className}
    style={{ imageRendering: 'pixelated', shapeRendering: 'crispEdges' }}
    dangerouslySetInnerHTML={{
      __html: `<g transform="translate(${offset},${offset}) scale(${scaleToFit})">${renderIcon}</g>`
    }}
  />
);

};

// Custom comparison function to prevent unnecessary re-renders
// Only re-render if item properties actually change
const arePropsEqual = (
  prevProps: GenerativeItemIconProps,
  nextProps: GenerativeItemIconProps
): boolean => {
  // If same reference, don't re-render
  if (prevProps.item === nextProps.item && prevProps.size === nextProps.size && prevProps.className === nextProps.className) {
    return true;
  }

  // If different items, check key properties
  if (!prevProps.item || !nextProps.item) {
    return prevProps.item === nextProps.item;
  }

  // Compare essential item properties that affect rendering
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.material === nextProps.item.material &&
    prevProps.item.color === nextProps.item.color &&
    prevProps.item.category === nextProps.item.category &&
    prevProps.size === nextProps.size &&
    prevProps.className === nextProps.className
  );
};

export default React.memo(GenerativeItemIcon, arePropsEqual);