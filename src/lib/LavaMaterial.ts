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
  const emissiveColor = new Color(opts.emissive ?? opts.color ?? '#b5a4f5').multiplyScalar(0.15);

  return new MeshPhysicalMaterial({
    color: base,
    emissive: emissiveColor,
    roughness: 0.08,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transmission: 0.25,
    thickness: 0.4,
    envMapIntensity: 1.4,
    transparent: true,
    opacity: 0.97,
  });
}
