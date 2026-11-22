"use client";

import React, { useEffect } from "react";
import FilerobotImageEditor, { TABS, TOOLS } from "react-filerobot-image-editor";
import { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";

interface PhotoEditorProps {
  /** Object URL (or any image URL) of the photo being edited */
  source: string;
  fileName?: string;
  /** Receives the edited image as a File, ready for your existing handleFile */
  onApply: (file: File) => void;
  onClose: () => void;
}

// The editor wants real color values, not CSS variables or oklch.
// These are hex versions of your light-mode palette.
const THEME = {
  palette: {
    "bg-primary": "#fcfaf6",
    "bg-primary-active": "#ebe7df",
    "bg-secondary": "#f8f6f1",
    "accent-primary": "#fcd726",
    "accent-primary-active": "#e6c320",
    "icons-primary": "#121212",
    "icons-secondary": "#121212",
    "borders-primary": "#121212",
    "borders-secondary": "#121212",
    "borders-strong": "#121212",
    "txt-primary": "#121212",
    "txt-secondary": "#4d4a45",
    "btn-primary-text": "#121212",
  },
  typography: {
    fontFamily: "var(--font-poppins), Roboto, sans-serif",
  },
};

interface SavedImage {
  imageCanvas?: HTMLCanvasElement;
  imageBase64?: string;
  mimeType?: string;
  fullName?: string;
  quality?: number;
}

async function toFile(data: SavedImage, fallbackName?: string): Promise<File> {
  const mime = data.mimeType || "image/jpeg";
  const name = data.fullName || fallbackName || "edited-photo.jpg";

  // Prefer the canvas: no giant base64 string in memory
  if (data.imageCanvas) {
    const blob = await new Promise<Blob | null>((resolve) =>
      data.imageCanvas!.toBlob(resolve, mime, data.quality ?? 0.92)
    );
    if (blob) return new File([blob], name, { type: mime });
  }

  if (data.imageBase64) {
    const blob = await (await fetch(data.imageBase64)).blob();
    return new File([blob], name, { type: blob.type || mime });
  }

  throw new Error("The editor returned no image.");
}

export default function PhotoEditor({ source, fileName, onApply, onClose }: PhotoEditorProps) {
  // Lock page scroll while the editor is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit photo"
      className="fixed inset-0 z-[100] bg-background"
    >
      {/* styled-components v6 forwards every prop to the DOM. This filters them like v5 did. */}
      <StyleSheetManager
        shouldForwardProp={(prop, target) => (typeof target === "string" ? isPropValid(prop) : true)}
      >
        <FilerobotImageEditor
          source={source}
          theme={THEME}
          // Adjust = crop / rotate / flip, Finetune = brightness, contrast, saturation, blur, warmth
          tabsIds={[TABS.ADJUST, TABS.FINETUNE, TABS.FILTERS]}
          defaultTabId={TABS.ADJUST}
          defaultToolId={TOOLS.CROP}
          // Free-form crop: unlocks the handles on the middle of each edge (top, bottom, left, right)
          // as well as the four corners. A fixed ratio would hide the edge handles.
          Crop={{ ratio: "custom" }}
          // Quality of the exported image. Raise savingPixelRatio if the output looks smaller than your original.
          savingPixelRatio={4}
          previewPixelRatio={typeof window !== "undefined" ? window.devicePixelRatio : 1}
          defaultSavedImageType="jpeg"
          defaultSavedImageQuality={0.92}
          onSave={async (savedImage: SavedImage) => {
            try {
              onApply(await toFile(savedImage, fileName));
            } catch (err) {
              console.error("❌ Photo editor save failed:", err);
            }
          }}
          onClose={onClose}
        />
      </StyleSheetManager>
    </div>
  );
}