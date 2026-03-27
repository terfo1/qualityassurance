from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse


router = APIRouter(include_in_schema=False)
FRONTEND_INDEX = Path("frontend/index.html").resolve()


@router.get("/")
@router.get("/catalog")
@router.get("/product")
@router.get("/cart")
@router.get("/admin")
def frontend() -> FileResponse:
    return FileResponse(FRONTEND_INDEX)
