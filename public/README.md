# public/

Static files served from the site root.

## bg.mp4 — the scroll-scrubbed background video

Drop the final, re-encoded background video here as **`bg.mp4`**.

- Until it exists, the site shows a cinematic dark fallback and still works.
- The moment `bg.mp4` is present, the fixed background video loads and scrubs
  with scroll automatically — no code changes.

Encode it for smooth scrubbing first (all-keyframe H.264). From the project root:

```bash
scripts/swap-bg-video.sh "assets/videos/VOLARA-scroll-background.mp4"
```

That script writes the encoded file straight to `website/public/bg.mp4`.

## img/ (optional)

Any still images (posters, reference stills) can live in `public/img/` and be
referenced as `/img/<name>`.
