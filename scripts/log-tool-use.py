#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    response = str(data.get("tool_response", ""))
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": data.get("session_id", ""),
        "tool_name": data.get("tool_name", ""),
        "tool_input": data.get("tool_input", {}),
        "response_preview": response[:500],
    }

    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(exist_ok=True)
    try:
        with open(logs_dir / "tool-use.jsonl", "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        pass


if __name__ == "__main__":
    main()
