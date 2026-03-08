/**
 * PeopleFigures - Orchestrates human figures in the 3D booth scene.
 *
 * Supports two rendering modes:
 * 1. Billboard sprites (photorealistic cutout images facing camera)
 * 2. Procedural fallback (stylized geometry when no sprites available)
 */
import { useMemo } from 'react';
import type { EnvironmentConfig } from './environmentPresets';
import { getPeopleMultiplier } from './environmentPresets';
import { getLayoutFamily } from './boothConfigs';
import { BillboardFigure, BillboardConversationGroup, getCharacterBySeed } from './BillboardFigure';
import { ProceduralFigure } from './ProceduralFigure';

const HUMAN_HEIGHT = 1.75;

interface FigurePlacement {
  position: [number, number, number];
  rotation?: number;
  opacity?: number;
  pose?: string;
  seed?: number;
  isStaff?: boolean;
}

/** Height reference marker */
function HeightMarker({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, HUMAN_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.005, HUMAN_HEIGHT, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, HUMAN_HEIGHT, 0]}>
        <boxGeometry args={[0.15, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
}

/** Occupied zone — a rectangle on the XZ plane that people should avoid */
export interface OccupiedZone {
  cx: number;
  cz: number;
  hw: number;
  hd: number;
}

interface PeopleFiguresProps {
  layout: string;
  envConfig?: EnvironmentConfig;
  occupiedZones?: OccupiedZone[];
  /** Map of characterId → sprite URL for billboard rendering */
  spriteUrls?: Record<string, string>;
  /** When true and sprites available, use billboard rendering */
  useBillboards?: boolean;
}

const PERSON_RADIUS = 0.35;

function collidesWithZone(px: number, pz: number, zone: OccupiedZone): boolean {
  return (
    Math.abs(px - zone.cx) < zone.hw + PERSON_RADIUS &&
    Math.abs(pz - zone.cz) < zone.hd + PERSON_RADIUS
  );
}

export function PeopleFigures({
  layout: rawLayout,
  envConfig,
  occupiedZones = [],
  spriteUrls = {},
  useBillboards = false,
}: PeopleFiguresProps) {
  const layout = getLayoutFamily(rawLayout as any);
  const multiplier = envConfig ? getPeopleMultiplier(envConfig.peopleCount) : 1;
  const showConversationGroups = envConfig?.showConversationGroups ?? false;

  const figures = useMemo(() => {
    const base: FigurePlacement[] = [];
    let seedCounter = 1;

    const add = (pos: [number, number, number], rot: number, opts: Partial<FigurePlacement> = {}) => {
      base.push({ position: pos, rotation: rot, seed: seedCounter++, ...opts });
    };

    // Core visitors
    if (layout === 'inline') {
      add([0.8, 0, 2.5], Math.PI * 0.9);
      add([-0.5, 0, 2.8], Math.PI * 1.1, { pose: 'arms-crossed' });
      add([0.1, 0, 3.2], Math.PI);
    } else if (layout === 'l-shape') {
      add([0.5, 0, 2.5], Math.PI * 0.85);
      add([-1.5, 0, 1.8], Math.PI * 0.6, { pose: 'hands-in-pockets' });
      add([1.2, 0, 3], Math.PI);
      add([-2, 0, 2.8], Math.PI * 0.7);
    } else if (layout === 'u-shape') {
      add([0, 0, 2.5], Math.PI);
      add([1.2, 0, 2.2], Math.PI * 0.8, { pose: 'arms-crossed' });
      add([-1.2, 0, 2.2], Math.PI * 1.2);
      add([0.6, 0, 3.5], Math.PI * 0.95, { pose: 'hands-in-pockets' });
      add([-0.8, 0, 3.8], Math.PI * 1.05);
    } else {
      add([0, 0, 5], Math.PI);
      add([2, 0, 4.5], Math.PI * 0.85, { pose: 'arms-crossed' });
      add([-2, 0, 4.8], Math.PI * 1.1);
      add([4.5, 0, 0], -Math.PI / 2, { pose: 'hands-in-pockets' });
      add([5, 0, 1.5], -Math.PI * 0.4);
      add([-4.5, 0, -1], Math.PI / 2);
      add([-5, 0, 1.2], Math.PI * 0.6, { pose: 'arms-crossed' });
      add([1, 0, -5], 0);
      add([-1.5, 0, -4.5], Math.PI * 0.1);
    }

    // Staff inside booth
    add([0, 0, 0.8], Math.PI, { opacity: 0.9, pose: 'standing', isStaff: true });
    if (layout !== 'inline') {
      add([-0.8, 0, 0.5], Math.PI * 0.7, { opacity: 0.9, pose: 'pointing', isStaff: true });
    }

    // Passersby
    add([5, 0, 2], Math.PI * 0.5, { opacity: 0.4, pose: 'hands-in-pockets' });
    add([-5.5, 0, -1], Math.PI * 1.3, { opacity: 0.4 });
    add([3, 0, -5], Math.PI * 0.2, { opacity: 0.35, pose: 'phone' });
    add([-4, 0, 5], Math.PI * 0.8, { opacity: 0.35 });

    if (multiplier >= 1.5) {
      add([2, 0, 4], Math.PI * 0.9, { opacity: 0.65, pose: 'phone' });
      add([-3, 0, 3], Math.PI * 1.15, { opacity: 0.55, pose: 'arms-crossed' });
      add([6, 0, -2], Math.PI * 0.3, { opacity: 0.35 });
      add([-6, 0, 3], Math.PI * 0.7, { opacity: 0.35 });
    }
    if (multiplier >= 2.5) {
      add([1.5, 0, 5], Math.PI, { opacity: 0.65, pose: 'photographing' });
      add([-2.5, 0, 4.5], Math.PI * 0.95, { opacity: 0.6 });
      add([4, 0, 6], Math.PI * 0.5, { opacity: 0.35, pose: 'hands-in-pockets' });
      add([-4, 0, -4], Math.PI * 1.4, { opacity: 0.3 });
      add([7, 0, 1], -Math.PI * 0.3, { opacity: 0.3 });
      add([-7, 0, -2], Math.PI * 0.6, { opacity: 0.3 });
      add([0.3, 0, 1.2], Math.PI * 0.85, { opacity: 0.85, pose: 'talking' });
    }
    if (multiplier >= 3.5) {
      add([3.5, 0, 3], Math.PI * 0.7, { opacity: 0.55, pose: 'phone' });
      add([-1, 0, 5.5], Math.PI, { opacity: 0.5, pose: 'arms-crossed' });
      add([5.5, 0, -3], Math.PI * 0.4, { opacity: 0.35 });
      add([-6.5, 0, 5], Math.PI * 0.8, { opacity: 0.3 });
      add([8, 0, -4], Math.PI * 0.2, { opacity: 0.25 });
      add([-8, 0, 4], Math.PI * 0.9, { opacity: 0.25, pose: 'hands-in-pockets' });
      add([0, 0, 7], Math.PI, { opacity: 0.4, pose: 'phone' });
      add([4, 0, -7], 0, { opacity: 0.25 });
      add([-3, 0, -6], Math.PI * 0.15, { opacity: 0.25 });
      add([6, 0, 5], Math.PI * 0.6, { opacity: 0.25, pose: 'phone' });
    }

    return base;
  }, [layout, multiplier]);

  // Filter figures that collide with any occupied zone
  const safeFigures = useMemo(() => {
    if (occupiedZones.length === 0) return figures;
    return figures.filter(fig => {
      const [px, , pz] = fig.position;
      return !occupiedZones.some(zone => collidesWithZone(px, pz, zone));
    });
  }, [figures, occupiedZones]);

  const conversationPositions = useMemo(() => {
    if (!showConversationGroups) return [];
    const allGroups: { position: [number, number, number]; count: number }[] = [];
    allGroups.push({ position: [2, 0, 3.5], count: 2 });
    allGroups.push({ position: [-2.5, 0, 4], count: 3 });
    if (multiplier >= 2.5) {
      allGroups.push({ position: [5, 0, 4], count: 2 });
      allGroups.push({ position: [-5, 0, 2], count: 2 });
    }
    if (multiplier >= 3.5) {
      allGroups.push({ position: [7, 0, -3], count: 3 });
      allGroups.push({ position: [-7, 0, 6], count: 2 });
    }
    if (occupiedZones.length === 0) return allGroups;
    return allGroups.filter(g => {
      const [gx, , gz] = g.position;
      return !occupiedZones.some(zone => collidesWithZone(gx, gz, zone));
    });
  }, [showConversationGroups, multiplier, occupiedZones]);

  return (
    <group>
      {safeFigures.map((fig, i) => {
        const character = getCharacterBySeed(fig.seed || i, fig.isStaff);
        const url = spriteUrls[character.id];
        if (!url) return null; // Skip figures without sprites
        return (
          <BillboardFigure
            key={i}
            position={fig.position}
            rotation={fig.rotation}
            opacity={fig.opacity}
            spriteUrl={url}
            height={1.62 + ((fig.seed || 0) % 7) * 0.03}
            aspect={character.aspect}
          />
        );
      })}
      {conversationPositions.map((group, i) => {
        const urls = Array.from({ length: group.count }, (_, j) => {
          const char = getCharacterBySeed(i * 10 + j + 100);
          return spriteUrls[char.id];
        }).filter(Boolean) as string[];

        if (urls.length < 2) return null;
        return (
          <BillboardConversationGroup
            key={`conv-${i}`}
            position={group.position}
            spriteUrls={urls}
            count={group.count}
          />
        );
      })}
      
    </group>
  );
}
