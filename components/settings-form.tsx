"use client";

import type { EncodeSettings, SourceMeta } from "@/lib/encoder/types";
import { DEFAULT_CRF } from "@/lib/encoder/types";
import { Segmented } from "./segmented";

type Props = {
  settings: EncodeSettings;
  meta: SourceMeta;
  onChange: (settings: EncodeSettings) => void;
};

const CRF_RANGE = { h264: { min: 12, max: 23 }, hevc: { min: 14, max: 26 } };
const RESOLUTIONS = [2160, 1440, 1080, 720];

export function qualityLabel(crf: number, codec: EncodeSettings["codec"]): string {
  const offset = crf - DEFAULT_CRF[codec];
  if (offset <= -2) return "near lossless";
  if (offset <= 1) return "visually lossless";
  if (offset <= 4) return "high";
  return "efficient";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-sm text-zinc-400">{label}</span>
      {children}
    </div>
  );
}

export function SettingsForm({ settings, meta, onChange }: Props) {
  const range = CRF_RANGE[settings.codec];

  return (
    <div className="space-y-5">
      <Row label="Format">
        <Segmented
          value={settings.codec}
          options={[
            { value: "h264", label: "H.264" },
            { value: "hevc", label: "H.265" },
          ]}
          onChange={(codec) =>
            onChange({ ...settings, codec, crf: DEFAULT_CRF[codec] })
          }
        />
      </Row>

      <div>
        <div className="flex items-baseline justify-between gap-6">
          <span className="text-sm text-zinc-400">Quality</span>
          <span className="text-xs text-zinc-300">
            {qualityLabel(settings.crf, settings.codec)}{" "}
            <span className="font-mono text-zinc-600">CRF {settings.crf}</span>
          </span>
        </div>
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={1}
          value={settings.crf}
          onChange={(e) => onChange({ ...settings, crf: Number(e.target.value) })}
          className="mt-4 w-full"
        />
      </div>

      <Row label="Effort">
        <Segmented
          value={settings.preset}
          options={[
            { value: "slow", label: "Slow" },
            { value: "slower", label: "Slower" },
            { value: "veryslow", label: "Veryslow" },
          ]}
          onChange={(preset) => onChange({ ...settings, preset })}
        />
      </Row>

      <Row label="Resolution">
        <Segmented
          value={settings.maxHeight === null ? "source" : String(settings.maxHeight)}
          options={[
            { value: "source", label: "Source" },
            ...RESOLUTIONS.map((h) => ({
              value: String(h),
              label: `${h}p`,
              disabled: meta.height <= h,
            })),
          ]}
          onChange={(v) =>
            onChange({ ...settings, maxHeight: v === "source" ? null : Number(v) })
          }
        />
      </Row>

      {meta.hasAudio && (
        <Row label="Audio">
          <Segmented
            value={settings.audio}
            options={[
              { value: "auto", label: "Auto" },
              { value: "reencode", label: "AAC 256k" },
              { value: "none", label: "None" },
            ]}
            onChange={(audio) => onChange({ ...settings, audio })}
          />
        </Row>
      )}

      {settings.codec === "hevc" && (
        <Row label="Bit depth">
          <Segmented
            value={settings.tenBit ? "10" : "8"}
            options={[
              { value: "8", label: "8-bit" },
              { value: "10", label: "10-bit" },
            ]}
            onChange={(v) => onChange({ ...settings, tenBit: v === "10" })}
          />
        </Row>
      )}
    </div>
  );
}
