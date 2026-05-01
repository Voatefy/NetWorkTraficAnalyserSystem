from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.security import obtenir_utilisateur_actuel, verifier_role_admin
from typing import List

router = APIRouter(prefix="/blacklist", tags=["Blacklist"])

@router.post("/", response_model=schemas.IPBloqueeResponse)
def bloquer_ip(
    data: schemas.IPBloqueeCreate,
    db: Session = Depends(get_db),
    admin = Depends(verifier_role_admin)
):
    existante = db.query(models.IPBloquee).filter(
        models.IPBloquee.ip == data.ip,
        models.IPBloquee.active == True
    ).first()
    if existante:
        raise HTTPException(status_code=400, detail="IP déjà bloquée")

    ip_bloquee = models.IPBloquee(**data.dict())
    db.add(ip_bloquee)
    db.commit()
    db.refresh(ip_bloquee)
    return ip_bloquee

@router.get("/", response_model=List[schemas.IPBloqueeResponse])
def lister_ips_bloquees(
    db: Session = Depends(get_db),
    utilisateur = Depends(obtenir_utilisateur_actuel)
):
    return db.query(models.IPBloquee).filter(
        models.IPBloquee.active == True
    ).all()

@router.delete("/{ip}", response_model=schemas.IPBloqueeResponse)
def debloquer_ip(
    ip: str,
    db: Session = Depends(get_db),
    admin = Depends(verifier_role_admin)
):
    ip_bloquee = db.query(models.IPBloquee).filter(
        models.IPBloquee.ip == ip,
        models.IPBloquee.active == True
    ).first()
    if not ip_bloquee:
        raise HTTPException(status_code=404, detail="IP non trouvée dans la blacklist")

    ip_bloquee.active = False
    db.commit()
    db.refresh(ip_bloquee)
    return ip_bloquee

@router.get("/verifier/{ip}")
def verifier_ip(ip: str, db: Session = Depends(get_db)):
    bloquee = db.query(models.IPBloquee).filter(
        models.IPBloquee.ip == ip,
        models.IPBloquee.active == True
    ).first()
    return {"ip": ip, "bloquee": bloquee is not None}