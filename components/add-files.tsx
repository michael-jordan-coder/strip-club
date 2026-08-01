"use client";

import { useRef } from "react";
import { VIDEO_ACCEPT } from "./dropzone";

type Props = {
  onFiles: (files: File[]) => void;
};

export function AddFiles({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors duration-150 hover:text-zinc-200"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 1v10M1 6h10" />
        </svg>
        Add videos
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={VIDEO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onFiles(files);
          e.target.value = "";
        }}
      />
    </>
  );
}
