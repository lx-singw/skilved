"""Quota preflight for the native task heartbeat; never starts another agent.

Pass the private JSON returned by get_usage_limits using --usage-file. Runtime
state belongs under ignored .artifacts; the subscription API is not scraped.
"""
import argparse
import json
import math
import os
from pathlib import Path
import tempfile
from datetime import datetime, timezone


def usage_payload(raw):
    if isinstance(raw, dict) and "content" in raw:
        for block in raw["content"]:
            if block.get("type") == "text":
                try:
                    value = json.loads(block["text"])
                    if isinstance(value, dict) and "ordinaryUsageAllowed" in value:
                        return value
                except (ValueError, TypeError):
                    pass
        raise ValueError("USAGE_UNAVAILABLE")
    if not isinstance(raw, dict):
        raise ValueError("USAGE_UNAVAILABLE")
    return raw


def decide(raw, now, reserve=5):
    """Use the actual reset epochs of both blocking subscription windows."""
    unknown = {"decision": "refresh_required", "reason": "usage_unavailable", "not_before": None}
    try:
        data = usage_payload(raw)
        buckets = data.get("rateLimitsByLimitId") or {}
        limit = buckets.get("codex") or data.get("rateLimits")
        if not isinstance(limit, dict) or limit.get("spendControlReached"):
            return unknown
        windows = []
        for key, expected in [("primary", 300), ("secondary", 10080)]:
            value = limit.get(key)
            if not isinstance(value, dict) or value.get("windowDurationMins") != expected:
                return unknown
            used, reset = value.get("usedPercent"), value.get("resetsAt")
            if isinstance(used, bool) or not isinstance(used, (int, float)) or not math.isfinite(used) or not 0 <= used <= 100:
                return unknown
            windows.append({"window": "five_hour" if key == "primary" else "weekly", "used_percent": used, "reset": reset})
        blocking = [w for w in windows if w["used_percent"] >= 100 - reserve]
        if blocking:
            resets = [w["reset"] for w in blocking]
            if any(isinstance(r, bool) or not isinstance(r, (int, float)) or not math.isfinite(r) or r <= now for r in resets):
                return {**unknown, "reason": "reset_requires_refresh"}
            return {"decision": "wait", "reason": "checkpoint_reserve", "not_before": max(resets) + 300, "windows": windows}
        if data.get("ordinaryUsageAllowed") is not True:
            return {**unknown, "reason": "ordinary_usage_not_allowed"}
        if limit.get("rateLimitReachedType"):
            return {**unknown, "reason": "limit_requires_refresh"}
        return {"decision": "work", "reason": "allowance_available", "not_before": None, "windows": windows}
    except (ValueError, TypeError, KeyError):
        return unknown


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=".checkpoint-", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w") as output:
            json.dump(value, output, indent=2)
            output.write("\n")
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state", type=Path, default=Path(".artifacts/sprint-loop/state.json"))
    parser.add_argument("--usage-file", type=Path)
    parser.add_argument("--refresh", action="store_true", help="Check fresh usage even before a recorded reset.")
    parser.add_argument("--reserve-percent", type=int, choices=range(1, 21), default=5)
    args = parser.parse_args()
    # Refuse accidentally placing live account usage/checkpoints in tracked docs.
    root = Path(__file__).resolve().parents[1]
    for path in [args.state, args.usage_file]:
        if path is not None and not path.resolve().is_relative_to(root / ".artifacts"):
            parser.error("Runtime state and usage input must stay under repository .artifacts/")
    now = datetime.now(timezone.utc).timestamp()
    state = json.loads(args.state.read_text()) if args.state.exists() else {"version": 1}
    not_before = state.get("quota", {}).get("not_before")
    if not args.refresh and isinstance(not_before, (int, float)) and not_before > now:
        result = {"decision": "wait", "reason": "recorded_reset", "not_before": not_before}
    elif args.usage_file:
        try:
            result = decide(json.loads(args.usage_file.read_text()), now, args.reserve_percent)
        except (ValueError, OSError):
            result = {"decision": "refresh_required", "reason": "usage_unavailable", "not_before": None}
        state["quota"] = result
        state["quota_checked_at"] = datetime.now(timezone.utc).isoformat()
        atomic_json(args.state, state)
    else:
        result = {"decision": "refresh_required", "reason": "read_account_usage", "not_before": None}
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
