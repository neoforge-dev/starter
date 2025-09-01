from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/docs", tags=["documentation"])

# Configure the path to the docs directory relative to the project root
DOCS_ROOT = Path(__file__).parent.parent.parent.parent / "docs"


@router.get("/{path:path}")
async def get_documentation(path: str) -> dict:
    """
    Serve documentation files from the main project docs directory.
    The path parameter can include subdirectories, e.g. 'frontend/getting-started.md'
    """
    try:
        # Ensure the path doesn't try to access files outside the docs directory
        file_path = (DOCS_ROOT / path).resolve()
        if not str(file_path).startswith(str(DOCS_ROOT)):
            raise HTTPException(status_code=403, detail="Access denied")

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Document not found")

        content = file_path.read_text()
        return {
            "content": content,
            "path": path,
            "title": file_path.stem.replace("-", " ").title(),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
