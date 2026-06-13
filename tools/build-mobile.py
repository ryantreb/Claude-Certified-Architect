#!/usr/bin/env python3
"""Generate the slim mobile build from the canonical single-file index.html.

The canonical index.html is the single self-contained source of truth and is
NEVER modified by this script. We only read it. The art/audio rules still hold:
every asset is written out byte-for-byte (no recolor, no re-encode), just stored
as a real file instead of an inline base64 data URI.

Output:
  mobile/index.html        slim HTML (data URIs -> relative asset paths)
  mobile/assets/imgNNNN.*  extracted images (webp/png/jpg)
  mobile/assets/sndNNNN.*  extracted audio (mp3)

Run from the repo root:  python3 tools/build-mobile.py
"""
import base64
import hashlib
import pathlib
import re
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "index.html"
OUT = ROOT / "mobile"
ASSETS = OUT / "assets"

EXT = {
    "image/webp": "webp",
    "image/png": "png",
    "image/jpeg": "jpg",
    "audio/mpeg": "mp3",
}

# data:<mime>;base64,<blob> — blob runs until the closing quote (base64 charset
# only), so it never overruns into the next token.
PATTERN = re.compile(
    r"data:(image/webp|image/png|image/jpeg|audio/mpeg);base64,([A-Za-z0-9+/=]+)"
)


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    ASSETS.mkdir(parents=True)

    src = SRC.read_text(encoding="utf-8")

    by_hash: dict[str, str] = {}          # content hash -> relative path
    counters = {"img": 0, "snd": 0}
    stats = {"img": 0, "snd": 0, "img_bytes": 0, "snd_bytes": 0}

    def replace(match: re.Match) -> str:
        mime, b64 = match.group(1), match.group(2)
        raw = base64.b64decode(b64)
        digest = hashlib.sha1(raw).hexdigest()
        if digest in by_hash:
            return by_hash[digest]          # dedup identical assets
        kind = "snd" if mime.startswith("audio") else "img"
        counters[kind] += 1
        rel = f"assets/{kind}{counters[kind]:04d}.{EXT[mime]}"
        (OUT / rel).write_bytes(raw)
        by_hash[digest] = rel
        stats[kind] += 1
        stats[f"{kind}_bytes"] += len(raw)
        return rel

    slim = PATTERN.sub(replace, src)
    (OUT / "index.html").write_text(slim, encoding="utf-8")

    leftover = len(re.findall(r"data:(?:image|audio)/", slim))
    mb = 1024 * 1024
    print(f"source index.html : {len(src)/mb:6.2f} MB")
    print(f"slim   index.html : {len(slim)/mb:6.2f} MB")
    print(f"images written    : {stats['img']:>5}  ({stats['img_bytes']/mb:6.2f} MB)")
    print(f"audio  written    : {stats['snd']:>5}  ({stats['snd_bytes']/mb:6.2f} MB)")
    print(f"unique assets     : {len(by_hash):>5}")
    print(f"data: URIs left in slim html : {leftover}  (must be 0)")


if __name__ == "__main__":
    main()
