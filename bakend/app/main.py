from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import logs, alertes, blacklist, auth, exports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Système logs réseau")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(logs.router)
app.include_router(alertes.router)
app.include_router(blacklist.router)
app.include_router(exports.router)

@app.get("/")
def root():
    return {"message": "API opérationnelle"}