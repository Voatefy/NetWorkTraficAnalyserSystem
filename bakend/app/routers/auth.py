from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app import models, schemas
from app.security import (
    hasher_mot_de_passe,
    verifier_mot_de_passe,
    creer_token,
    obtenir_utilisateur_actuel
)
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.UtilisateurResponse)
def inscription(data: schemas.UtilisateurCreate, db: Session = Depends(get_db)):
    # Vérifier si username ou email existe déjà
    existant = db.query(models.Utilisateur).filter(
        models.Utilisateur.username == data.username
    ).first()
    if existant:
        raise HTTPException(status_code=400, detail="Username déjà utilisé")

    utilisateur = models.Utilisateur(
        username=data.username,
        email=data.email,
        hashed_password=hasher_mot_de_passe(data.password),
        role=data.role
    )
    db.add(utilisateur)
    db.commit()
    db.refresh(utilisateur)
    return utilisateur

@router.post("/login", response_model=schemas.Token)
def connexion(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    utilisateur = db.query(models.Utilisateur).filter(
        models.Utilisateur.username == form_data.username
    ).first()

    if not utilisateur or not verifier_mot_de_passe(
        form_data.password, utilisateur.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username ou mot de passe incorrect"
        )

    token = creer_token(
        data={"sub": utilisateur.username},
        expire_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer"}

@router.get("/moi", response_model=schemas.UtilisateurResponse)
def mon_profil(utilisateur = Depends(obtenir_utilisateur_actuel)):
    return utilisateur