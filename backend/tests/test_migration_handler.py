from app import main


def test_direct_migration_event_runs_alembic(monkeypatch) -> None:
    called = {}

    def upgrade(config, revision):
        called["script_location"] = config.get_main_option("script_location")
        called["revision"] = revision

    monkeypatch.setattr(main.command, "upgrade", upgrade)

    response = main.handler({"operation": "alembic-upgrade"}, None)

    assert response == {"statusCode": 200, "body": "Migration completed"}
    assert called["script_location"].endswith("/migrations")
    assert called["revision"] == "head"
