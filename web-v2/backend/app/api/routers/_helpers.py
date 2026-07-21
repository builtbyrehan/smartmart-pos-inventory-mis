from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError


def conflict_from_integrity(exc: IntegrityError, message: str) -> HTTPException:
    return HTTPException(status_code=409, detail=message)

