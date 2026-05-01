from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List

router = APIRouter(prefix="/alertes", tags=["Alertes"])

@router.get("/", response_model=List[schemas.AlerteResponse])
def lister_alertes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    alertes = db.query(models.Alerte).offset(skip).limit(limit).all()
    return alertes

@router.get("/non-resolues", response_model=List[schemas.AlerteResponse])
def alertes_non_resolues(db: Session = Depends(get_db)):
    return db.query(models.Alerte).filter(models.Alerte.resolue == False).all()

@router.put("/{alerte_id}/resoudre", response_model=schemas.AlerteResponse)
def resoudre_alerte(alerte_id: int, db: Session = Depends(get_db)):
    alerte = db.query(models.Alerte).filter(models.Alerte.id == alerte_id).first()
    alerte.resolue = True
    db.commit()
    db.refresh(alerte)
    return alerte