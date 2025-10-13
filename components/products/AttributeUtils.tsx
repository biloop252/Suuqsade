// Utility functions for attribute display and visual representation

export interface ColorMapping {
  [key: string]: string;
}

// Common color mappings for better visual representation
export const COLOR_MAPPINGS: ColorMapping = {
  // Basic colors
  'red': '#FF0000',
  'blue': '#0000FF',
  'green': '#008000',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#800080',
  'pink': '#FFC0CB',
  'brown': '#A52A2A',
  'black': '#000000',
  'white': '#FFFFFF',
  'gray': '#808080',
  'grey': '#808080',
  
  // Extended colors
  'navy': '#000080',
  'maroon': '#800000',
  'olive': '#808000',
  'lime': '#00FF00',
  'aqua': '#00FFFF',
  'teal': '#008080',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'beige': '#F5F5DC',
  'tan': '#D2B48C',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'turquoise': '#40E0D0',
  'violet': '#EE82EE',
  'indigo': '#4B0082',
  'magenta': '#FF00FF',
  'cyan': '#00FFFF',
  
  // Fashion colors
  'burgundy': '#800020',
  'charcoal': '#36454F',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  'khaki': '#F0E68C',
  'mint': '#98FB98',
  'peach': '#FFE5B4',
  'plum': '#DDA0DD',
  'rust': '#B7410E',
  'sage': '#9CAF88',
  'taupe': '#8B7D6B',
  'wine': '#722F37',
  
  // Metallic colors
  'rose-gold': '#E8B4B8',
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'platinum': '#E5E4E2',
  'gunmetal': '#2C3539',
  
  // Pattern descriptions
  'striped': 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%)',
  'polka-dot': 'radial-gradient(circle, #000 20%, transparent 20%)',
  'checkered': 'repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)',
  'solid': '#000000',
  'patterned': 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)',
};

// Size category mappings for better display
export const SIZE_CATEGORIES = {
  clothing: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  shoes: ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
  rings: ['4', '5', '6', '7', '8', '9', '10', '11', '12'],
  general: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
};

// Get color hex code from color name
export const getColorHex = (colorName: string): string => {
  const normalizedName = colorName.toLowerCase().trim();
  return COLOR_MAPPINGS[normalizedName] || '#808080'; // Default to gray if not found
};

// Check if a string is a valid hex color
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// Get display name for attribute
export const getAttributeDisplayName = (slug: string): string => {
  const nameMap: { [key: string]: string } = {
    'color': 'Color',
    'primary-color': 'Primary Color',
    'secondary-color': 'Secondary Color',
    'size': 'Size',
    'clothing-size': 'Clothing Size',
    'shoe-size': 'Shoe Size',
    'ring-size': 'Ring Size',
    'material': 'Material',
    'fabric': 'Fabric',
    'metal-type': 'Metal Type',
    'storage-capacity': 'Storage Capacity',
    'screen-size': 'Screen Size',
    'processor': 'Processor',
    'ram': 'RAM',
    'operating-system': 'Operating System',
    'weight': 'Weight',
    'dimensions': 'Dimensions',
    'length': 'Length',
    'width': 'Width',
    'height': 'Height',
    'style': 'Style',
    'pattern': 'Pattern',
    'brand': 'Brand',
    'connectivity': 'Connectivity',
    'battery-life': 'Battery Life',
    'water-resistance': 'Water Resistance',
    'fit': 'Fit',
    'occasion': 'Occasion',
    'season': 'Season',
    'room-type': 'Room Type',
    'assembly-required': 'Assembly Required',
  };
  
  return nameMap[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
};

// Determine attribute type from slug or name
export const getAttributeType = (slug: string, value?: string): string => {
  const colorKeywords = ['color', 'primary-color', 'secondary-color'];
  const sizeKeywords = ['size', 'clothing-size', 'shoe-size', 'ring-size'];
  const materialKeywords = ['material', 'fabric', 'metal-type'];
  
  if (colorKeywords.some(keyword => slug.includes(keyword))) {
    return 'color';
  }
  
  if (sizeKeywords.some(keyword => slug.includes(keyword))) {
    return 'size';
  }
  
  if (materialKeywords.some(keyword => slug.includes(keyword))) {
    return 'material';
  }
  
  // Check if value looks like a color
  if (value && (isValidHexColor(value) || COLOR_MAPPINGS[value.toLowerCase()])) {
    return 'color';
  }
  
  // Check if value looks like a size
  if (value && (SIZE_CATEGORIES.clothing.includes(value.toUpperCase()) || 
      SIZE_CATEGORIES.shoes.includes(value) || 
      SIZE_CATEGORIES.rings.includes(value))) {
    return 'size';
  }
  
  return 'select';
};

// Get size category for proper styling
export const getSizeCategory = (value: string): string => {
  if (SIZE_CATEGORIES.clothing.includes(value.toUpperCase())) return 'clothing';
  if (SIZE_CATEGORIES.shoes.includes(value)) return 'shoes';
  if (SIZE_CATEGORIES.rings.includes(value)) return 'rings';
  return 'general';
};

// Format attribute value for display
export const formatAttributeValue = (value: string, attributeType?: string): string => {
  if (!value) return value;
  
  // Handle different attribute types
  switch (attributeType) {
    case 'size':
      // For sizes, capitalize appropriately
      const upperValue = value.toUpperCase();
      if (SIZE_CATEGORIES.clothing.includes(upperValue)) {
        return upperValue; // XS, S, M, L, XL, etc.
      }
      if (SIZE_CATEGORIES.shoes.includes(value) || SIZE_CATEGORIES.rings.includes(value)) {
        return value; // Keep shoe sizes and ring sizes as numbers
      }
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    
    case 'color':
      // For colors, capitalize first letter of each word
      return value.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    
    case 'material':
    case 'fabric':
      // For materials, capitalize first letter of each word
      return value.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    
    default:
      // For other types, capitalize first letter of each word
      return value.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
  }
};