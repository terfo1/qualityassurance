from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.presentation.api.api import api_router
from app.presentation.web.router import router as web_router


app = FastAPI(
    title="NovaCart Commerce Platform",
    version="2.0.0",
    description="Structured e-commerce demo built with FastAPI and a React frontend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
app.include_router(api_router, prefix="/api")
app.include_router(web_router)
