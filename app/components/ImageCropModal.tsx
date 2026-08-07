"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X, Check } from "lucide-react";

/**
 * Draws the selected crop region of `src` onto a canvas and returns a JPEG data
 * URL. Runs entirely in the browser so no upload happens until the admin saves
 * the community.
 */
async function getCroppedImg(src: string, crop: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the image for cropping"));
    img.src = src;
  });

  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

interface Props {
  /** Source image (object URL or data URL) to crop. */
  src: string;
  /** Target aspect ratio (width / height). Defaults to 16:9 for cover images. */
  aspect?: number;
  onCancel: () => void;
  onCropped: (dataUrl: string) => void;
}

export function ImageCropModal({ src, aspect = 16 / 9, onCancel, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!areaPixels) {
      onCancel();
      return;
    }
    setSaving(true);
    try {
      const dataUrl = await getCroppedImg(src, areaPixels);
      onCropped(dataUrl);
    } catch {
      // Fall back to the original image so the admin isn't blocked by a crop
      // failure (e.g. a cross-origin URL that can't be read from canvas).
      onCropped(src);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cropOverlay" role="dialog" aria-modal="true">
      <div className="cropModal">
        <div className="cropHeader">
          <h3>Crop cover image</h3>
          <button className="cropClose" onClick={onCancel} aria-label="Cancel cropping">
            <X size={18} />
          </button>
        </div>

        <div className="cropStage">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
          />
        </div>

        <div className="cropControls">
          <label className="cropZoomLabel">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="cropZoom"
          />
        </div>

        <div className="cropFooter">
          <button className="cropBtn cropCancel" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="cropBtn cropApply" onClick={handleApply} disabled={saving}>
            <Check size={16} /> {saving ? "Applying…" : "Apply crop"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .cropOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .cropModal {
          background: var(--surface, #fff);
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
        }
        .cropHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border, #eee);
        }
        .cropHeader h3 {
          margin: 0;
          font-size: 1rem;
          color: var(--ink, #222);
        }
        .cropClose {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--ink-muted, #777);
          display: flex;
        }
        .cropStage {
          position: relative;
          width: 100%;
          height: 340px;
          background: #1a1a1a;
        }
        .cropControls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem 1.25rem 0;
        }
        .cropZoomLabel {
          font-size: 0.85rem;
          color: var(--ink-muted, #777);
          min-width: 42px;
        }
        .cropZoom {
          flex: 1;
          accent-color: var(--accent-cool, #4f7cac);
        }
        .cropFooter {
          display: flex;
          justify-content: flex-end;
          gap: 0.6rem;
          padding: 1rem 1.25rem 1.25rem;
        }
        .cropBtn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border-radius: 10px;
          padding: 0.55rem 1rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .cropBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cropCancel {
          background: transparent;
          border-color: var(--border, #ddd);
          color: var(--ink, #333);
        }
        .cropApply {
          background: var(--accent-cool, #4f7cac);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
