import { MeshPhysicalMaterial, Color } from 'three';

export interface LavaMaterialOptions {
  color?: string;     // hex, e.g. '#b5a4f5'
  emissive?: string;  // defaults to same as color at low intensity
}

/**
 * Create ONE material instance per model load.
 * Assign the same instance to every mesh in the scene to avoid
 * redundant GPU uploads and ensure a visually consistent look.
 */
export function createLavaMaterial(opts: LavaMaterialOptions = {}): MeshPhysicalMaterial {
  const base = new Color(opts.color ?? '#b5a4f5');
  const emissiveColor = new Color(opts.emissive ?? opts.color ?? '#b5a4f5').multiplyScalar(0.12);

  return new MeshPhysicalMaterial({
    color: base,
    emissive: emissiveColor,
    roughness: 0.75,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.6,
    transmission: 0.0,
    thickness: 0.0,
    envMapIntensity: 0.35,
    transparent: false,
  });
}
