from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..api.sensor_routes import router as sensor_router
from ..database.config import init_db
from ..websocket.routes import router as websocket_router

app = FastAPI(title="Bridge Health Monitoring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensor_router)
app.include_router(websocket_router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()