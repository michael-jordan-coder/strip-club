"use client";

import { useState } from "react";

type Props = {
  src: string;
};

/** Hides itself when the browser can't decode the container (mkv, avi, …). */
export function VideoPreview({ src }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      className="max-h-72 w-full bg-black object-contain"
    />
  );
}
