"""Vercel FastAPI entrypoint.

Keeping the application at a supported root entrypoint lets Vercel route the
original request path to FastAPI instead of rewriting every API request to a
file-system path.
"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR / "api"))
sys.path.insert(0, str(ROOT_DIR / "backend"))

from server import app
