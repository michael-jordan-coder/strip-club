"use client";

import { useRef } from "react";

type Props = {
  onFiles: (files: File[]) => void;
};

/** Click-to-browse surface; drag & drop is handled window-wide by the page. */
export function Dropzone({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-900/50 transition-colors duration-150 hover:bg-zinc-900"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-600"
        aria-hidden
      >
        <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
        <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
      </svg>
      <span className="text-sm text-zinc-300">Drop videos</span>
      <span className="text-xs text-zinc-600">or browse</span>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,.mkv,.avi,.mov,.webm,.m4v,.mts,.m2ts,.ts,.flv,.wmv,.mpg,.mpeg,.3gp,.ogv"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onFiles(files);
          e.target.value = "";
        }}
      />
    </button>
  );
}
