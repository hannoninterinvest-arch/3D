import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

globalThis.self = globalThis;

const png = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  ),
  (char) => char.charCodeAt(0),
);

class FakeImageData {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

globalThis.ImageData = FakeImageData;
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend();
    });
  }
};
globalThis.document = {
  createElement() {
    return {
      width: 1,
      height: 1,
      getContext() {
        return {
          translate() {},
          scale() {},
          putImageData() {},
          drawImage() {},
        };
      },
      toBlob(callback) {
        callback(new Blob([png], { type: "image/png" }));
      },
    };
  },
};

function canvasLike(r, g, b) {
  const width = 8;
  const height = 8;
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

function texture(r, g, b) {
  const image = canvasLike(r, g, b);
  const map = new THREE.DataTexture(image.data, image.width, image.height);
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;
  map.image = image;
  return map;
}

const geometry = new THREE.BoxGeometry(1.2, 1.6, 0.4);
const materials = ["right", "left", "top", "bottom", "front", "back"].map((name, index) => {
  const material = new THREE.MeshStandardMaterial({
    color: index < 4 ? "#ffffff" : "#888888",
    roughness: 0.5,
    metalness: 0,
  });
  if (index === 0 || index === 1 || index === 4 || index === 5) {
    material.map = texture(40 + index * 30, 80, 140);
  }
  material.name = name;
  return material;
});

const mesh = new THREE.Mesh(geometry, materials);
mesh.name = "objet-4-faces";

const exporter = new GLTFExporter();
const buffer = await exporter.parseAsync(mesh, { binary: true });
const bytes = new Uint8Array(buffer);
if (bytes.length < 20) throw new Error("GLB trop petit");
const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
if (magic !== "glTF") throw new Error(`En-tête inattendu: ${magic}`);

const jsonLength = new DataView(buffer).getUint32(12, true);
const json = JSON.parse(new TextDecoder().decode(bytes.slice(20, 20 + jsonLength)));
const imageCount = json.images?.length ?? 0;
if (imageCount !== 4) throw new Error(`Attendu 4 images, reçu ${imageCount}`);
const meshName = json.nodes?.find((node) => node.name === "objet-4-faces");
if (!meshName) throw new Error("Maillage introuvable dans le GLB");

console.log(`GLB valide: ${bytes.length} octets, 4 textures`);
