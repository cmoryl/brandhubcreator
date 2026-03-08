/**
 * CameraAnimator — smooth camera transitions, first-person walkthrough,
 * and auto-tour flythrough for the 3D booth mapper.
 *
 * Lives inside the R3F Canvas <Suspense> tree.
 */
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import type { CameraPreset } from './environmentPresets';

/* ─── Types ────────────────────────────────────────────── */

export type WalkthroughMode = 'none' | 'walkthrough' | 'tour';

export interface CameraAnimatorProps {
  /** Target preset to transition to */
  activePreset: CameraPreset | null;
  /** Bumped each click for re-trigger */
  version: number;
  /** Ref to the OrbitControls */
  controlsRef: React.RefObject<any>;
  /** Active walkthrough mode */
  walkthroughMode: WalkthroughMode;
  /** All camera presets for auto-tour */
  allPresets: CameraPreset[];
  /** Callback when tour/walkthrough ends or a tour step changes */
  onModeChange?: (mode: WalkthroughMode) => void;
  /** Callback when tour moves to next preset */
  onTourStep?: (presetId: string) => void;
  /** Transition duration in seconds */
  transitionDuration?: number;
  /** Seconds to hold each tour stop */
  tourHoldDuration?: number;
}

/* ─── Walkthrough path — first-person eye-level path around the booth ── */

const WALKTHROUGH_KEYFRAMES: { position: [number, number, number]; target: [number, number, number]; t: number }[] = [
  // Approach from distance
  { position: [0, 1.7, 8], target: [0, 1.4, 0], t: 0 },
  // Walk up to front
  { position: [0, 1.7, 4], target: [0, 1.4, 0], t: 0.12 },
  // Slight right, look at left panel
  { position: [1.5, 1.7, 3], target: [-1, 1.5, 0], t: 0.22 },
  // Move to center, look straight
  { position: [0, 1.7, 2], target: [0, 1.5, -0.5], t: 0.35 },
  // Look left
  { position: [-0.5, 1.7, 2], target: [1.5, 1.4, -0.5], t: 0.45 },
  // Walk along left side
  { position: [-2.5, 1.7, 0], target: [0, 1.5, 0], t: 0.55 },
  // Behind angle
  { position: [-2, 1.7, -2], target: [0, 1.3, 0.5], t: 0.65 },
  // Walk to right side
  { position: [2.5, 1.7, -1], target: [0, 1.5, 0.5], t: 0.78 },
  // Return to front overview
  { position: [2, 1.7, 3.5], target: [0, 1.4, 0], t: 0.88 },
  // Final establishing position
  { position: [0, 1.7, 5], target: [0, 1.3, 0], t: 1.0 },
];

/** Interpolate between walkthrough keyframes at normalised t (0–1) */
function sampleWalkthrough(t: number): { position: THREE.Vector3; target: THREE.Vector3 } {
  const clamped = Math.max(0, Math.min(1, t));
  // Find surrounding keyframes
  let a = WALKTHROUGH_KEYFRAMES[0];
  let b = WALKTHROUGH_KEYFRAMES[WALKTHROUGH_KEYFRAMES.length - 1];
  for (let i = 0; i < WALKTHROUGH_KEYFRAMES.length - 1; i++) {
    if (clamped >= WALKTHROUGH_KEYFRAMES[i].t && clamped <= WALKTHROUGH_KEYFRAMES[i + 1].t) {
      a = WALKTHROUGH_KEYFRAMES[i];
      b = WALKTHROUGH_KEYFRAMES[i + 1];
      break;
    }
  }
  const segLen = b.t - a.t;
  const segT = segLen > 0 ? (clamped - a.t) / segLen : 0;
  // Smooth-step for easing
  const s = segT * segT * (3 - 2 * segT);
  return {
    position: new THREE.Vector3(...a.position).lerp(new THREE.Vector3(...b.position), s),
    target: new THREE.Vector3(...a.target).lerp(new THREE.Vector3(...b.target), s),
  };
}

/* ─── Component ────────────────────────────────────────── */

export function CameraAnimator({
  activePreset,
  version,
  controlsRef,
  walkthroughMode,
  allPresets,
  onModeChange,
  onTourStep,
  transitionDuration = 1.5,
  tourHoldDuration = 3.5,
}: CameraAnimatorProps) {
  const { camera } = useThree();

  /* ── Smooth preset transition state ── */
  const transRef = useRef({
    active: false,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    startFov: 45,
    endFov: 45,
    elapsed: 0,
    duration: transitionDuration,
  });

  /* ── Tour state ── */
  const tourRef = useRef({
    active: false,
    stepIndex: 0,
    holdElapsed: 0,
    transitioning: false,
  });

  /* ── Walkthrough state ── */
  const walkRef = useRef({
    active: false,
    progress: 0, // 0–1
    duration: 18, // seconds for full walk
  });

  /* ── Trigger smooth transition to preset ── */
  useEffect(() => {
    if (!activePreset || walkthroughMode !== 'none') return;
    const tr = transRef.current;
    tr.startPos.copy(camera.position);
    tr.endPos.set(...activePreset.position);
    tr.startFov = (camera as THREE.PerspectiveCamera).fov;
    tr.endFov = activePreset.fov;
    const controls = controlsRef.current;
    if (controls) {
      tr.startTarget.copy(controls.target);
    } else {
      tr.startTarget.set(0, 1.2, 0);
    }
    tr.endTarget.set(...activePreset.target);
    tr.elapsed = 0;
    tr.duration = transitionDuration;
    tr.active = true;
  }, [activePreset, version, walkthroughMode]);

  /* ── Start/stop walkthrough ── */
  useEffect(() => {
    if (walkthroughMode === 'walkthrough') {
      walkRef.current = { active: true, progress: 0, duration: 18 };
      // Disable orbit controls during walkthrough
      if (controlsRef.current) controlsRef.current.enabled = false;
    } else {
      walkRef.current.active = false;
      if (controlsRef.current && walkthroughMode === 'none') controlsRef.current.enabled = true;
    }
  }, [walkthroughMode]);

  /* ── Start/stop auto-tour ── */
  useEffect(() => {
    if (walkthroughMode === 'tour' && allPresets.length > 0) {
      tourRef.current = { active: true, stepIndex: 0, holdElapsed: 0, transitioning: false };
      // Kick off first transition
      const first = allPresets[0];
      const tr = transRef.current;
      tr.startPos.copy(camera.position);
      tr.endPos.set(...first.position);
      tr.startFov = (camera as THREE.PerspectiveCamera).fov;
      tr.endFov = first.fov;
      const controls = controlsRef.current;
      tr.startTarget.copy(controls ? controls.target : new THREE.Vector3(0, 1.2, 0));
      tr.endTarget.set(...first.target);
      tr.elapsed = 0;
      tr.duration = transitionDuration;
      tr.active = true;
      tourRef.current.transitioning = true;
      onTourStep?.(first.id);
    } else if (walkthroughMode !== 'tour') {
      tourRef.current.active = false;
    }
  }, [walkthroughMode, allPresets]);

  /* ── Per-frame animation loop ── */
  useFrame((_, delta) => {
    const perspCam = camera as THREE.PerspectiveCamera;

    /* ── Walkthrough animation ── */
    if (walkRef.current.active) {
      const w = walkRef.current;
      w.progress += delta / w.duration;
      if (w.progress >= 1) {
        w.active = false;
        if (controlsRef.current) controlsRef.current.enabled = true;
        onModeChange?.('none');
        return;
      }
      const sample = sampleWalkthrough(w.progress);
      camera.position.copy(sample.position);
      camera.lookAt(sample.target);
      perspCam.fov = 65;
      perspCam.updateProjectionMatrix();
      if (controlsRef.current) {
        controlsRef.current.target.copy(sample.target);
        controlsRef.current.update();
      }
      return;
    }

    /* ── Smooth transition (preset & tour) ── */
    const tr = transRef.current;
    if (tr.active) {
      tr.elapsed += delta;
      const raw = Math.min(tr.elapsed / tr.duration, 1);
      // Cubic ease-in-out
      const t = raw < 0.5
        ? 4 * raw * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 3) / 2;

      camera.position.lerpVectors(tr.startPos, tr.endPos, t);
      perspCam.fov = THREE.MathUtils.lerp(tr.startFov, tr.endFov, t);
      perspCam.updateProjectionMatrix();

      const controls = controlsRef.current;
      if (controls) {
        controls.target.lerpVectors(tr.startTarget, tr.endTarget, t);
        controls.update();
      }

      if (raw >= 1) {
        tr.active = false;
        if (tourRef.current.active) {
          tourRef.current.transitioning = false;
          tourRef.current.holdElapsed = 0;
        }
      }
      return;
    }

    /* ── Tour hold + advance ── */
    if (tourRef.current.active && !tourRef.current.transitioning) {
      tourRef.current.holdElapsed += delta;
      if (tourRef.current.holdElapsed >= tourHoldDuration) {
        const nextIdx = tourRef.current.stepIndex + 1;
        if (nextIdx >= allPresets.length) {
          // Tour complete
          tourRef.current.active = false;
          onModeChange?.('none');
          return;
        }
        tourRef.current.stepIndex = nextIdx;
        const next = allPresets[nextIdx];
        onTourStep?.(next.id);

        // Start transition to next
        const trn = transRef.current;
        trn.startPos.copy(camera.position);
        trn.endPos.set(...next.position);
        trn.startFov = perspCam.fov;
        trn.endFov = next.fov;
        const controls = controlsRef.current;
        trn.startTarget.copy(controls ? controls.target : new THREE.Vector3(0, 1.2, 0));
        trn.endTarget.set(...next.target);
        trn.elapsed = 0;
        trn.duration = transitionDuration;
        trn.active = true;
        tourRef.current.transitioning = true;
      }
    }
  });

  return null;
}
