import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial, Icosahedron, Octahedron, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { useBreakpoint } from '@/hooks/useBreakpoint';

function FloatingIcosahedron({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Icosahedron ref={meshRef} args={[1, 1]} position={position}>
        <MeshDistortMaterial
          color="#14b8a6"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.4}
          metalness={0.8}
          transparent
          opacity={0.8}
        />
      </Icosahedron>
    </Float>
  );
}

function FloatingOctahedron({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.25;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.2}>
      <Octahedron ref={meshRef} args={[0.8]} position={position}>
        <MeshWobbleMaterial
          color="#a855f7"
          attach="material"
          factor={0.4}
          speed={2}
          roughness={0.3}
          metalness={0.9}
          transparent
          opacity={0.7}
        />
      </Octahedron>
    </Float>
  );
}

function FloatingTorus({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.6} floatIntensity={0.8}>
      <Torus ref={meshRef} args={[0.6, 0.2, 16, 32]} position={position}>
        <MeshDistortMaterial
          color="#139cd8"
          attach="material"
          distort={0.2}
          speed={3}
          roughness={0.2}
          metalness={0.9}
          transparent
          opacity={0.75}
        />
      </Torus>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#a855f7" />
      <pointLight position={[10, -10, 5]} intensity={0.5} color="#14b8a6" />
      
      <FloatingIcosahedron position={[-2.5, 0.5, 0]} />
      <FloatingOctahedron position={[2.5, -0.5, -1]} />
      <FloatingTorus position={[0, -1, 1]} />
    </>
  );
}

export function FloatingShapes() {
  const { isTablet, isMobile } = useBreakpoint();
  
  // Disable 3D canvas on tablet/mobile for better performance
  if (isTablet || isMobile) {
    return null;
  }
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
