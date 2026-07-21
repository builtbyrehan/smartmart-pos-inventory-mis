from __future__ import annotations

import csv
import io
from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.dependencies import require_roles
from app.core.permissions import roles_for
from app.db.models import User
from app.db.session import get_db
from app.services.reports import REPORTS

router = APIRouter(prefix="/reports", tags=["Reports"])


def get_rows(report_name: str, db: Session) -> list[dict]:
    service = REPORTS.get(report_name)
    if not service:
        raise HTTPException(status_code=404, detail="Unknown report")
    return service(db)


@router.get("/{report_name}")
def report(report_name: str, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("reports")))) -> dict:
    rows = get_rows(report_name, db)
    return {"name": report_name, "columns": list(rows[0]) if rows else [], "rows": rows}


@router.get("/{report_name}/csv")
def report_csv(report_name: str, db: Session = Depends(get_db), _user: User = Depends(require_roles(*roles_for("reports")))) -> StreamingResponse:
    rows = get_rows(report_name, db)
    columns = list(rows[0]) if rows else []
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=columns)
    writer.writeheader()
    for row in rows:
        writer.writerow({key: value.isoformat() if isinstance(value, (date, datetime)) else str(value) if isinstance(value, Decimal) else value for key, value in row.items()})
    response = StreamingResponse(iter([buffer.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f'attachment; filename="{report_name}.csv"'
    return response

