"""D-day 계산 — 순수 함수. 능동 알림이 아닌, 접속 시에만 계산되는 정보성 표시용."""
from datetime import date
from typing import Optional


def calc_dday(exam_date: Optional[str], today: date) -> Optional[int]:
    """exam_date: 'YYYY-MM-DD' | None. 시험일까지 남은 일수(지났으면 음수)."""
    if not exam_date:
        return None
    exam = date.fromisoformat(exam_date)
    return (exam - today).days
