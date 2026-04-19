from engine import SelfConsistency


def test_self_consistency_picks_consensus_answer():
    voter = SelfConsistency()
    reasonings = [
        "path A\nFinal answer is 42",
        "path B\nFinal answer is 42",
        "path C\nFinal answer is 84",
    ]
    best = voter.select_best(reasonings)
    assert "42" in best


def test_self_consistency_falls_back_when_no_numeric_answer():
    voter = SelfConsistency()
    reasonings = [
        "first rationale with no digits",
        "second rationale with no digits",
    ]
    best = voter.select_best(reasonings)
    assert best == reasonings[0]
