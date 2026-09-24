export const FACE_IDS = ["front", "right", "back", "left"] as const;

export type FaceId = (typeof FACE_IDS)[number];

export type FaceImages = Record<FaceId, HTMLCanvasElement | null>;

export const FACE_SLOTS: { id: FaceId; label: string; hint: string }[] = [
  { id: "front", label: "Avant", hint: "La face qui regarde vers vous" },
  { id: "right", label: "Droite", hint: "Le côté droit de l’objet" },
  { id: "back", label: "Arrière", hint: "La face opposée à l’avant" },
  { id: "left", label: "Gauche", hint: "Le côté gauche de l’objet" },
];

export const EMPTY_FACES: FaceImages = {
  front: null,
  right: null,
  back: null,
  left: null,
};

export function countFaces(images: FaceImages) {
  return FACE_IDS.filter((id) => images[id] !== null).length;
}
