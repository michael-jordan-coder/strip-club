# strip club

Strips the weight off videos. A local, quality-first MP4 encoder — drop a video, it leaves lighter.

```
            ||
            ||        \o/
            ||         |          ~ 88 MB gone ~
            ||        <|
            ||         |\
            ||        / \
            ||       /   \
      ======##================
        142 MB  →  54 MB (−62%)
```

## What it is

A web UI on top of real ffmpeg (x264/x265), running entirely on your machine. Nothing is uploaded anywhere — the "upload" is a stream to your own temp dir.

- **CRF constant-quality** rate control — pick a quality, not a bitrate. Defaults to visually lossless (CRF 16 H.264 / 18 H.265)
- `aq-mode=3` for better bit allocation in dark scenes
- **Apple AudioToolbox AAC** at 256 kb/s — AAC sources are stream-copied untouched
- **Lanczos** scaling when capping resolution, 1px crop instead of resample for odd dimensions
- `+faststart`, `hvc1` tag so QuickTime plays HEVC, optional 10-bit HEVC against banding
- Drop anywhere, live progress with ETA, cancelable encodes, instant preview

## Run it

Needs [ffmpeg](https://ffmpeg.org) with libx264/libx265 (`brew install ffmpeg`) and Node 20+. Audio re-encoding uses `aac_at`, so macOS.

```bash
npm install
npm run dev
```

Open http://localhost:3000 and drop a video.
