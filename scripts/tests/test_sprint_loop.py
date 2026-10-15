import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("sprint_loop", Path(__file__).parents[1] / "sprint_loop.py")
loop = importlib.util.module_from_spec(spec)
spec.loader.exec_module(loop)


def sample(primary=35, secondary=58):
    return {"ordinaryUsageAllowed": True, "rateLimitsByLimitId": {"codex": {
        "primary": {"usedPercent": primary, "windowDurationMins": 300, "resetsAt": 1200},
        "secondary": {"usedPercent": secondary, "windowDurationMins": 10080, "resetsAt": 9000},
    }}}


class QuotaPolicy(unittest.TestCase):
    def test_work_with_both_windows_available(self):
        self.assertEqual(loop.decide(sample(), 1000)["decision"], "work")

    def test_wait_for_five_hour_window(self):
        self.assertEqual(loop.decide(sample(95), 1000)["not_before"], 1500)

    def test_weekly_limit_remains_after_five_hour_reset(self):
        self.assertEqual(loop.decide(sample(100, 100), 1000)["not_before"], 9300)
        self.assertEqual(loop.decide(sample(0, 100), 1300)["not_before"], 9300)
        raw = sample(100, 100)
        raw["ordinaryUsageAllowed"] = False
        self.assertEqual(loop.decide(raw, 1000)["not_before"], 9300)

    def test_past_reset_requires_actual_refresh(self):
        self.assertEqual(loop.decide(sample(100), 1500)["decision"], "refresh_required")

    def test_missing_windows_are_not_zero_usage(self):
        raw = sample()
        raw["rateLimitsByLimitId"]["codex"]["secondary"] = None
        self.assertEqual(loop.decide(raw, 1000)["decision"], "refresh_required")

    def test_unavailable_or_invalid_usage_stops_work(self):
        for raw in [None, {}, sample(float("nan")), sample(-1), sample(True), sample(101)]:
            self.assertEqual(loop.decide(raw, 1000)["decision"], "refresh_required")

    def test_tool_wrapper_and_legacy_view(self):
        import json
        raw = sample()
        wrapped = {"content": [{"type": "text", "text": json.dumps(raw)}]}
        self.assertEqual(loop.decide(wrapped, 1000)["decision"], "work")
        raw["rateLimits"] = raw.pop("rateLimitsByLimitId")["codex"]
        self.assertEqual(loop.decide(raw, 1000)["decision"], "work")

    def test_credits_never_override_subscription_denial(self):
        raw = sample()
        raw["ordinaryUsageAllowed"] = False
        raw["rateLimitsByLimitId"]["codex"]["credits"] = {"hasCredits": True}
        self.assertEqual(loop.decide(raw, 1000)["decision"], "refresh_required")


if __name__ == "__main__":
    unittest.main()
