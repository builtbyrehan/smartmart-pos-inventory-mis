from __future__ import annotations

from pydantic import BaseModel, Field


class PageMeta(BaseModel):
    page: int
    page_size: int
    total: int
    pages: int


class PaginatedResponse(BaseModel):
    items: list[dict]
    meta: PageMeta


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=100)


class MessageResponse(BaseModel):
    message: str

