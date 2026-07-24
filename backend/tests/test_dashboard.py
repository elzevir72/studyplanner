from backend.domain.dashboard import build_participant_summary, not_participated


def test_build_participant_summary():
    user = {"user_id": "u1", "display_name": "A"}
    entries = [
        {
            "study_items": [{"method": "인강", "topics": [], "amount": {"value": 60, "unit": "분"}}],
            "goal_snapshot": [{"method": "인강", "value": 120, "unit": "분"}],
        },
    ]
    summary = build_participant_summary(user, entries)
    assert summary == {
        "user_id": "u1",
        "display_name": "A",
        "entry_count": 1,
        "achievement_rate": 50,
    }


def test_not_participated():
    participants = [
        {"user_id": "u1", "entry_count": 5},
        {"user_id": "u2", "entry_count": 0},
    ]
    assert not_participated(participants) == ["u2"]
