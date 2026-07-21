from __future__ import annotations

from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "POS & Inventory MIS API"
    api_prefix: str = "/api/v1"
    environment: str = "development"

    db_host: str = Field(default="127.0.0.1", alias="DB_HOST")
    db_port: int = Field(default=3306, alias="DB_PORT")
    db_name: str = Field(default="POS_IMIS", alias="DB_NAME")
    db_user: str = Field(default="root", alias="DB_USER")
    db_password: str = Field(default="", alias="DB_PASSWORD")
    database_url_override: str | None = Field(default=None, alias="DATABASE_URL")

    jwt_secret: str = Field(
        default="local-development-secret-change-before-deployment",
        alias="JWT_SECRET",
    )
    access_token_minutes: int = Field(default=30, alias="ACCESS_TOKEN_MINUTES")
    refresh_token_days: int = Field(default=7, alias="REFRESH_TOKEN_DAYS")
    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")
    allowed_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="ALLOWED_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )

    @property
    def database_url(self) -> str:
        if self.database_url_override:
            return self.database_url_override
        user = quote_plus(self.db_user)
        password = quote_plus(self.db_password)
        return (
            f"mysql+mysqlconnector://{user}:{password}@{self.db_host}:"
            f"{self.db_port}/{self.db_name}?charset=utf8mb4"
        )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

