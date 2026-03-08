/**
 * FirstPersonController — WASD + mouse-look FPS camera for booth walkthrough.
 *
 * Uses Pointer Lock API for mouse look. Lives inside the R3F Canvas <Suspense> tree.
 * Simulates eye-level (1.7m) walking with smooth acceleration/deceleration,
 * head bob, and collision boundaries.
 */
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';

/* ─── Constants ────────────────────────────────────────── */

const EYE_HEIGHT = 1.7;
const MOVE_SPEED = 3.5;       // m/s base walk speed
const SPRINT_SPEED = 6.0;     // m/s sprint
const MOUSE_SENSITIVITY = 0.002;
const SMOOTHING = 8;          // velocity smoothing factor
const HEAD_BOB_SPEED = 8;     // oscillation frequency
const HEAD_BOB_AMOUNT = 0.02; // vertical displacement
const BOUNDS = 12;            // hard boundary from origin

/* ─── Types ────────────────────────────────────────────── */

export interface FirstPersonControllerProps {
  /** Whether this controller is active */
  enabled: boolean;
  /** Ref to OrbitControls — we disable them while in FPS */
  controlsRef: React.RefObject<any>;
  /** Called when user presses Escape to exit FPS mode */
  onExit?: () => void;
}

/* ─── Component ────────────────────────────────────────── */

export function FirstPersonController({
  enabled,
  controlsRef,
  onExit,
}: FirstPersonControllerProps) {
  const { camera, gl } = useThree();

  const stateRef = useRef({
    // Input state
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    // Look state
    yaw: 0,
    pitch: 0,
    // Smoothed velocity
    velocity: new THREE.Vector3(),
    // Head bob
    bobPhase: 0,
    // Pointer lock active
    locked: false,
    // Has been initialized this session
    initialized: false,
  });

  /* ── Pointer Lock ── */
  const requestPointerLock = useCallback(() => {
    if (!enabled) return;
    gl.domElement.requestPointerLock?.();
  }, [enabled, gl.domElement]);

  useEffect(() => {
    if (!enabled) {
      // Release pointer lock when disabled
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock?.();
      }
      stateRef.current.locked = false;
      stateRef.current.initialized = false;
      // Re-enable orbit controls
      if (controlsRef.current) controlsRef.current.enabled = true;
      return;
    }

    // Disable orbit controls
    if (controlsRef.current) controlsRef.current.enabled = false;

    // Initialize camera orientation from current position
    const s = stateRef.current;
    if (!s.initialized) {
      // Derive yaw/pitch from current camera direction
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      s.yaw = Math.atan2(-dir.x, -dir.z);
      s.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
      // Set camera to eye height
      camera.position.y = EYE_HEIGHT;
      s.initialized = true;
    }

    // Request pointer lock on click
    const handleClick = () => {
      if (!stateRef.current.locked) requestPointerLock();
    };
    gl.domElement.addEventListener('click', handleClick);

    // Pointer lock change
    const handleLockChange = () => {
      stateRef.current.locked = document.pointerLockElement === gl.domElement;
      if (!stateRef.current.locked && enabled) {
        // User pressed Escape or lost focus
        onExit?.();
      }
    };
    document.addEventListener('pointerlockchange', handleLockChange);

    // Mouse move for look
    const handleMouseMove = (e: MouseEvent) => {
      if (!stateRef.current.locked) return;
      const s = stateRef.current;
      s.yaw -= e.movementX * MOUSE_SENSITIVITY;
      s.pitch -= e.movementY * MOUSE_SENSITIVITY;
      s.pitch = THREE.MathUtils.clamp(s.pitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
    };
    document.addEventListener('mousemove', handleMouseMove);

    // Keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled) return;
      const s = stateRef.current;
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    s.forward = true; break;
        case 'KeyS': case 'ArrowDown':  s.backward = true; break;
        case 'KeyA': case 'ArrowLeft':  s.left = true; break;
        case 'KeyD': case 'ArrowRight': s.right = true; break;
        case 'ShiftLeft': case 'ShiftRight': s.sprint = true; break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    s.forward = false; break;
        case 'KeyS': case 'ArrowDown':  s.backward = false; break;
        case 'KeyA': case 'ArrowLeft':  s.left = false; break;
        case 'KeyD': case 'ArrowRight': s.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': s.sprint = false; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Auto-request pointer lock on enable
    requestPointerLock();

    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handleLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Release lock
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock?.();
      }
    };
  }, [enabled, camera, gl.domElement, controlsRef, onExit, requestPointerLock]);

  /* ── Per-frame update ── */
  useFrame((_, delta) => {
    if (!enabled) return;
    const s = stateRef.current;
    const perspCam = camera as THREE.PerspectiveCamera;

    // Target velocity from input
    const speed = s.sprint ? SPRINT_SPEED : MOVE_SPEED;
    const input = new THREE.Vector3();
    if (s.forward)  input.z -= 1;
    if (s.backward) input.z += 1;
    if (s.left)     input.x -= 1;
    if (s.right)    input.x += 1;
    input.normalize().multiplyScalar(speed);

    // Rotate input by yaw (move relative to look direction)
    const sinY = Math.sin(s.yaw);
    const cosY = Math.cos(s.yaw);
    const worldInput = new THREE.Vector3(
      input.x * cosY - input.z * sinY,
      0,
      input.x * sinY + input.z * cosY
    );

    // Smooth velocity
    s.velocity.lerp(worldInput, 1 - Math.exp(-SMOOTHING * delta));

    // Move camera
    camera.position.x += s.velocity.x * delta;
    camera.position.z += s.velocity.z * delta;

    // Boundary clamp
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -BOUNDS, BOUNDS);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -BOUNDS, BOUNDS);

    // Head bob
    const isMoving = input.length() > 0.1;
    if (isMoving) {
      s.bobPhase += delta * HEAD_BOB_SPEED * (s.sprint ? 1.4 : 1);
      camera.position.y = EYE_HEIGHT + Math.sin(s.bobPhase) * HEAD_BOB_AMOUNT;
    } else {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, EYE_HEIGHT, 5 * delta);
      s.bobPhase = 0;
    }

    // Apply look rotation
    const euler = new THREE.Euler(s.pitch, s.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    // Set FOV for immersive feel
    perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, s.sprint ? 75 : 65, 5 * delta);
    perspCam.updateProjectionMatrix();

    // Update orbit controls target to match (so exiting FPS is smooth)
    if (controlsRef.current) {
      const lookTarget = new THREE.Vector3(0, 0, -3).applyQuaternion(camera.quaternion).add(camera.position);
      controlsRef.current.target.copy(lookTarget);
    }
  });

  return null;
}
