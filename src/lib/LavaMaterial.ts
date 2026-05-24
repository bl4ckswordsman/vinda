import { MeshPhysicalMaterial, Color } from 'three';

export interface LavaMaterialOptions {
  color?: string;     // hex, e.g. '#b5a4f5'
  emissive?: string;  // defaults to same as color at low intensity
  isDarkMode?: boolean;
}

/**
 * Create ONE material instance per model load.
 * Assign the same instance to every mesh in the scene to avoid
 * redundant GPU uploads and ensure a visually consistent look.
 */
export function createLavaMaterial(opts: LavaMaterialOptions = {}): MeshPhysicalMaterial {
  const base = new Color(opts.color ?? '#b5a4f5');
  
  // Calculate relative luminance of the color (r, g, b are 0-1)
  const luminance = 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b;
  
  const isDark = opts.isDarkMode ?? true;
  
  // PBR best practice: scale down albedo for extremely bright colors to prevent clipping/blowout
  if (!isDark) {
    if (luminance > 0.7) {
      // Scale down more in light mode to provide contrast against the light background
      // and prevent clipping/blooming under intense light mode illumination
      base.multiplyScalar(0.62);
    } else {
      // Even for normal colors, scale down slightly in light mode to prevent washing out
      base.multiplyScalar(0.85);
    }
  } else {
    // Dark mode
    if (luminance > 0.8) {
      base.multiplyScalar(0.74);
    }
  }
  
  // Recalculate luminance for emissive scaling after clamping
  const finalLuminance = 0.2126 * base.r + 0.7152 * base.g + 0.0722 * base.b;
  
  // Emissive color should be much weaker for bright colors to prevent flat wash-out and bloom blowout
  // And it should be completely disabled in light mode to keep shadows crisp
  let emissiveMult = 0;
  if (isDark) {
    // In dark mode, scale down emissive for bright colors so they don't blow out
    emissiveMult = 0.15 * Math.max(0.0, 1.0 - finalLuminance);
  } else {
    // In light mode, no emissive glow at all to maintain crisp shadows
    emissiveMult = 0.0;
  }
  
  const emissiveColor = new Color(opts.emissive ?? opts.color ?? '#b5a4f5').multiplyScalar(emissiveMult);

  return new MeshPhysicalMaterial({
    color: base,
    emissive: emissiveColor,
    roughness: 0.85,
    metalness: 0.0,
    clearcoat: 0.02,
    clearcoatRoughness: 0.6,
    transmission: 0.0,
    thickness: 0.0,
    envMapIntensity: 0.12,
    transparent: false,
  });
}
