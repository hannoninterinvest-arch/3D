"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { Mesh } from "three";
import { countFaces, EMPTY_FACES, FACE_SLOTS, type FaceId, type FaceImages } from "@/lib/faces";
import { exportBoxGlb, type BoxSize } from "@/lib/build-box";
import { fileToCanvas } from "@/lib/prepare-image";

const Viewport = dynamic(() => import("@/components/viewport"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-stone-400">
      Chargement de l’aperçu 3D…
    </div>
  ),
});

const DEFAULT_SIZE: BoxSize = { width: 1.15, height: 1.55, depth: 0.42 };

function formatUnit(value: number) {
  return value.toFixed(2);
}

export default function Studio() {
  const [images, setImages] = useState<FaceImages>(EMPTY_FACES);
  const [previews, setPreviews] = useState<Record<FaceId, string | null>>({
    front: null,
    right: null,
    back: null,
    left: null,
  });
  const [size, setSize] = useState<BoxSize>(DEFAULT_SIZE);
  const [capColor, setCapColor] = useState("#6e6256");
  const [fitFront, setFitFront] = useState(true);
  const [mesh, setMesh] = useState<Mesh | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeDrop, setActiveDrop] = useState<FaceId | null>(null);

  const ready = countFaces(images) === 4;

  const onMesh = useCallback((next: Mesh | null) => {
    setMesh(next);
  }, []);

  async function assignFace(id: FaceId, file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("Choisissez une image (PNG, JPG ou WebP).");
      return;
    }
    setStatus(null);
    const canvas = await fileToCanvas(file);
    setImages((current) => ({ ...current, [id]: canvas }));
    setPreviews((current) => {
      if (current[id]) URL.revokeObjectURL(current[id]);
      return { ...current, [id]: URL.createObjectURL(file) };
    });
    if (id === "front" && fitFront) {
      const ratio = canvas.width / canvas.height;
      setSize((current) => ({
        ...current,
        width: Math.min(4, Math.max(0.2, Number((current.height * ratio).toFixed(2)))),
      }));
    }
  }

  function clearFace(id: FaceId) {
    setStatus(null);
    setImages((current) => ({ ...current, [id]: null }));
    setPreviews((current) => {
      if (current[id]) URL.revokeObjectURL(current[id]);
      return { ...current, [id]: null };
    });
  }

  async function download() {
    if (!mesh || !ready) return;
    setBusy(true);
    setStatus(null);
    try {
      const blob = await exportBoxGlb(mesh);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "objet-4-faces.glb";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Fichier GLB téléchargé.");
    } catch {
      setStatus("L’export GLB a échoué. Réessayez avec d’autres images.");
    } finally {
      setBusy(false);
    }
  }

  const sizeFields = useMemo(
    () =>
      [
        ["width", "Largeur"],
        ["height", "Hauteur"],
        ["depth", "Profondeur"],
      ] as const,
    [],
  );

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
      <aside className="flex w-full flex-col gap-6 overflow-y-auto border-b border-white/10 bg-[#17130f] px-5 py-6 lg:h-screen lg:w-[420px] lg:shrink-0 lg:border-r lg:border-b-0 lg:px-6">
        <header>
          <p className="text-xs tracking-[0.22em] text-[#d7a15a] uppercase">Atelier GLB</p>
          <h1 className="mt-2 font-serif text-3xl text-stone-100">Quatre faces, un volume</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            Déposez une photo pour l’avant, la droite, l’arrière et la gauche. L’application
            construit une boîte texturée et l’enregistre en GLB, directement dans le navigateur.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {FACE_SLOTS.map((slot) => {
            const preview = previews[slot.id];
            return (
              <div
                key={slot.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setActiveDrop(slot.id);
                }}
                onDragLeave={() => setActiveDrop((current) => (current === slot.id ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  setActiveDrop(null);
                  const file = event.dataTransfer.files?.[0];
                  if (file) void assignFace(slot.id, file);
                }}
                className={`relative aspect-[4/5] overflow-hidden rounded-2xl border border-dashed transition ${
                  activeDrop === slot.id
                    ? "border-[#d7a15a] bg-[#d7a15a]/10"
                    : "border-white/15 bg-black/20"
                }`}
              >
                <label className="absolute inset-0 cursor-pointer">
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    aria-label={`Image ${slot.label}`}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void assignFace(slot.id, file);
                      event.target.value = "";
                    }}
                  />
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-center text-sm text-stone-400">
                      Déposer
                      <br />
                      une image
                    </span>
                  )}
                </label>
                <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/65 px-2.5 py-1 text-xs text-stone-100 backdrop-blur">
                  {slot.label}
                </span>
                {preview && (
                  <button
                    type="button"
                    className="absolute right-3 bottom-3 z-10 rounded-full bg-black/65 px-2.5 py-1 text-xs text-stone-200 backdrop-blur"
                    onClick={() => clearFace(slot.id)}
                  >
                    Retirer
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <fieldset className="space-y-4">
          <legend className="text-sm text-stone-200">Dimensions</legend>
          {sizeFields.map(([key, label]) => (
            <label key={key} className="block text-xs text-stone-400">
              <span className="mb-1 flex justify-between">
                {label}
                <span className="text-stone-200">{formatUnit(size[key])}</span>
              </span>
              <input
                type="range"
                min={key === "depth" ? 0.08 : 0.2}
                max={key === "depth" ? 2.5 : 4}
                step={0.01}
                value={size[key]}
                aria-label={label}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (key !== "depth") setFitFront(false);
                  setSize((current) => ({ ...current, [key]: value }));
                }}
                className="w-full accent-[#d7a15a]"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-stone-300">
            <input
              type="checkbox"
              checked={fitFront}
              onChange={(event) => setFitFront(event.target.checked)}
              className="accent-[#d7a15a]"
            />
            Ajuster la largeur à la photo avant
          </label>
          <label className="flex items-center justify-between text-sm text-stone-300">
            Dessus et dessous
            <input
              type="color"
              value={capColor}
              aria-label="Couleur du dessus et du dessous"
              onChange={(event) => setCapColor(event.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
            />
          </label>
        </fieldset>

        <div className="mt-auto space-y-3">
          <button
            type="button"
            onClick={() => void download()}
            disabled={!ready || busy || !mesh}
            className="w-full rounded-full bg-[#d7a15a] px-4 py-3 text-sm font-medium text-[#1a140e] transition enabled:hover:bg-[#e3b56e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Export…" : "Télécharger le GLB"}
          </button>
          <p className="min-h-5 text-center text-xs text-stone-400" role="status">
            {status ?? (ready ? "Les quatre faces sont prêtes." : `${countFaces(images)} / 4 faces`)}
          </p>
        </div>
      </aside>

      <main className="relative min-h-[70vh] flex-1 lg:min-h-0">
        <Viewport images={images} size={size} capColor={capColor} onMesh={onMesh} />
        <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs text-stone-300 backdrop-blur">
          Glisser pour tourner · molette pour zoomer
        </p>
      </main>
    </div>
  );
}
