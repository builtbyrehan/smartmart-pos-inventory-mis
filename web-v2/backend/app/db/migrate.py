from __future__ import annotations

from sqlalchemy import inspect, text

from app.db.session import engine


def run_safe_migrations() -> None:
    """Apply the one additive compatibility migration required by modern hashes."""
    if engine.dialect.name != "mysql":
        return
    inspector = inspect(engine)
    columns = {column["name"]: column for column in inspector.get_columns("Users")}
    password_column = columns.get("PasswordHash")
    if not password_column:
        raise RuntimeError("Users.PasswordHash was not found; verify the POS_IMIS schema.")
    length = getattr(password_column["type"], "length", None)
    if length is None or length < 255:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE Users MODIFY PasswordHash VARCHAR(255) NOT NULL")
            )
        print("Applied safe migration: Users.PasswordHash expanded to VARCHAR(255).")
    else:
        print("Database schema is compatible; no migration was required.")


if __name__ == "__main__":
    run_safe_migrations()

