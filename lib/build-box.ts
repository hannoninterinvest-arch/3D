import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { FaceImages } from "./faces";

export type BoxSize = {
  width: number;
  height: number;
  depth: number;
};

const MISSING_FACE = "#b7aa9a";

function textureFromCanvas(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function faceMaterial(canvas: HTMLCanvasElement | null, fallback: string) {
  const map = canvas ? textureFromCanvas(canvas) : null;
  return new THREE.MeshStandardMaterial({
    map,
    color: map ? "#ffffff" : fallback,
    roughness: 0.58,
    metalness: 0,
  });
}

export function buildBox(images: FaceImages, size: BoxSize, capColor: string) {
  const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
  const materials = [
    faceMaterial(images.right, MISSING_FACE),
    faceMaterial(images.left, MISSING_FACE),
    faceMaterial(null, capColor),
    faceMaterial(null, capColor),
    faceMaterial(images.front, MISSING_FACE),
    faceMaterial(images.back, MISSING_FACE),
  ];

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.name = "objet-4-faces";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function disposeBox(mesh: THREE.Mesh) {
  mesh.geometry.dispose();
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) {
    const standard = material as THREE.MeshStandardMaterial;
    standard.map?.dispose();
    standard.dispose();
  }
}

export async function exportBoxGlb(mesh: THREE.Object3D) {
  const exporter = new GLTFExporter();
  const buffer = await exporter.parseAsync(mesh, { binary: true });
  return new Blob([buffer as ArrayBuffer], { type: "model/gltf-binary" });
}
