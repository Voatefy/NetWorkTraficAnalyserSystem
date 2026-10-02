from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.detection import analyser_log
from typing import List

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.post("/", response_model=schemas.LogResponse)
def creer_log(log: schemas.LogCreate, db: Session = Depends(get_db)):
    ip_bloquee = db.query(models.IPBloquee).filter(
        models.IPBloquee.ip == log.ip_source,
        models.IPBloquee.active == True
    ).first()
    if ip_bloquee:
        raise HTTPException(
            status_code=403,
            detail=f"IP {log.ip_source} bloquée — raison : {ip_bloquee.raison}"
        )

    nouveau_log = models.Log(**log.dict())
    db.add(nouveau_log)
    db.commit()
    db.refresh(nouveau_log)
    analyser_log(nouveau_log, db)
    return nouveau_log

@router.get("/", response_model=List[schemas.LogResponse])
def lister_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Log).offset(skip).limit(limit).all()

@router.get("/{log_id}", response_model=schemas.LogResponse)
def obtenir_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.Log).filter(models.Log.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log non trouvé")
    return log