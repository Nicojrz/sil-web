from app.core.protocol_rules import build_suggested_actions


def test_build_suggested_actions_for_death_certificate() -> None:
    actions = build_suggested_actions("El productor dice que su padre falleció y necesita ayuda")

    assert "Solicitar acta de defunción" in actions
    assert len(actions) >= 1
