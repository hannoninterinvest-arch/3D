"use client";

import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import type { Mesh } from "three";
import type { FaceImages } from "@/lib/faces";
import { buildBox, disposeBox, type BoxSize } from "@/lib/build-box";

type ViewportProps = {
  images: FaceImages;
  size: BoxSize;
  capColor: string;
  onMesh: (mesh: Mesh | null) => void;
};

function Stage({
  images,
  size,
  capColor,
  onMesh,
}: ViewportProps) {
  const [mesh, setMesh] = useState<Mesh | null>(null);

  useEffect(() => {
    const next = buildBox(images, size, capColor);
    setMesh(next);
    onMesh(next);
    return () => {
      onMesh(null);
      disposeBox(next);
    };
  }, [images, size, capColor, onMesh]);

  if (!mesh) return null;

  return <primitive object={mesh} />;
}

export default function Viewport(props: ViewportProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [2.6, 1.7, 3.1], fov: 40 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#12151b"]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <Stage {...props} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -props.size.height / 2, 0]} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <shadowMaterial opacity={0.28} />
      </mesh>
      <Grid
        args={[8, 8]}
        position={[0, -props.size.height / 2, 0]}
        cellSize={0.25}
        cellThickness={0.6}
        sectionSize={1}
        sectionThickness={1}
        cellColor="#2a3140"
        sectionColor="#3d475c"
        fadeDistance={10}
        infiniteGrid
      />
      <OrbitControls makeDefault enableDamping minDistance={0.8} maxDistance={12} />
    </Canvas>
  );
}
