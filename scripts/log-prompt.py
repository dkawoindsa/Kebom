#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def main():
    raw = sys.stdin.buffer.read().decode('utf-8')
    try:
        data = json.loads(raw)
    except Exception:
        # stdin 내용이 없거나 JSON이 아닌 경우 — 디버그용으로 기록
        logs_dir = Path(__file__).parent.parent / "logs"
        logs_dir.mkdir(exist_ok=True)
        with open(logs_dir / "prompts-debug.txt", "a", encoding="utf-8") as f:
            f.write(f"[{__import__('datetime').datetime.now().isoformat()}] stdin raw: {repr(raw)}\n")
        sys.exit(0)

    prompt = data.get("prompt", "")
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": data.get("session_id", ""),
        "prompt": prompt,
        "char_count": len(prompt),
    }

    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(exist_ok=True)
    try:
        with open(logs_dir / "prompts.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


if __name__ == "__main__":
    main()
