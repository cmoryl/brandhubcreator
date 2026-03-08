/**
 * DraggablePanel3D - Wrapper around BoothPanel3D that adds drag-and-drop repositioning
 */
import { useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { BoothPanel3D } from './BoothPanel3D';
import type { PanelConfig } from './boothConfigs';
import type { PrintStyle } from './boothLightingConfig';

interface DraggablePanel3DProps {
  panel: PanelConfig;
  isSelected: boolean;
  onSelect: (panelId: string) => void;
  showLabels: boolean;
  showDimensions: boolean;
  showSafeZones?: boolean;
  isDragMode: boolean;
  onPositionChange: (panelId: string, position: [number, number, number]) => void;
  printStyle?: PrintStyle;
  edgeLightIntensity?: number;
  edgeLightColor?: string;
}

export function DraggablePanel3D({
  panel,
  isSelected,
  onSelect,
  showLabels,
  showDimensions,
  showSafeZones,
  isDragMode,
  onPositionChange,
  printStyle,
  edgeLightIntensity,
  edgeLightColor,
}: DraggablePanel3DProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { raycaster } = useThree();

  // We drag along a vertical plane parallel to the panel's facing direction
  // For simplicity, use XZ (floor) plane for horizontal movement, keep Y fixed
  const floorPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const dragOffset = useRef(new THREE.Vector3());

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragMode) return;
    e.stopPropagation();
    setIsDragging(true);

    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, intersect);
    if (intersect) {
      dragOffset.current.set(
        panel.position[0] - intersect.x,
        0,
        panel.position[2] - intersect.z
      );
    }
    (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
  }, [isDragMode, raycaster, floorPlane, panel.position]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !isDragMode) return;
    e.stopPropagation();
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane, intersect);
    if (intersect) {
      const x = Math.round((intersect.x + dragOffset.current.x) * 10) / 10;
      const z = Math.round((intersect.z + dragOffset.current.z) * 10) / 10;
      onPositionChange(panel.id, [x, panel.position[1], z]);
    }
  }, [isDragging, isDragMode, raycaster, floorPlane, panel.id, panel.position, onPositionChange, dragOffset]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId);
    }
  }, [isDragging]);

  return (
    <group
      onPointerDown={isDragMode ? handlePointerDown : undefined}
      onPointerMove={isDragMode ? handlePointerMove : undefined}
      onPointerUp={isDragMode ? handlePointerUp : undefined}
    >
      <BoothPanel3D
        panel={panel}
        isSelected={isSelected}
        onSelect={onSelect}
        showLabels={showLabels}
        showDimensions={showDimensions}
        showSafeZones={showSafeZones}
        printStyle={printStyle}
        edgeLightIntensity={edgeLightIntensity}
        edgeLightColor={edgeLightColor}
      />
    </group>
  );
}
