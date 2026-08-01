"use client";

import type { EncodeSettings } from "@/lib/encoder/types";

type Props = {
  settings: EncodeSettings;
  hasAudio: boolean;
  open: boolean;
  onToggle: () => void;
};

function summarize(s: EncodeSettings, hasAudio: boolean): string {
  const parts = [
    s.codec === "h264" ? "H.264" : `H.265${s.tenBit ? " 10-bit" : ""}`,
    `CRF ${s.crf}`,
    s.preset,
    s.maxHeight ? `${s.maxHeight}p` : "source",
  ];
  if (hasAudio) {
    parts.push(
      s.audio === "auto" ? "audio auto" : s.audio === "none" ? "no audio" : "AAC 256k",
    );
  }
  return parts.join(" · ");
}

export function SettingsSummary({ settings, hasAudio, open, onToggle }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-0 truncate font-mono text-xs text-zinc-500">
        {summarize(settings, hasAudio)}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 transition-colors duration-150 hover:bg-zinc-700"
      >
        {open ? "Done" : "Customize"}
      </button>
    </div>
  );
}
