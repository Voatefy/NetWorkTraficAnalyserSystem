from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from datetime import datetime, timedelta

# Ports considérés comme suspects
PORTS_SUSPECTS = [22, 23, 4444, 1337, 6666, 31337, 3389, 5900]

# Seuils
SEUIL_DDOS = 100        # paquets par minute depuis une même IP
SEUIL_PORT_SCAN = 15    # ports différents en 1 minute depuis une même IP


def verifier_port_suspect(log: models.Log, db: Session):
    if log.port_destination in PORTS_SUSPECTS:
        alerte = models.Alerte(
            type_alerte="PORT_SUSPECT",
            ip_source=log.ip_source,
            description=f"Connexion sur port suspect {log.port_destination} "
                        f"depuis {log.ip_source} vers {log.ip_destination}"
        )
        db.add(alerte)
        db.commit()


def verifier_ddos(log: models.Log, db: Session):
    une_minute_avant = datetime.utcnow() - timedelta(minutes=1)
    
    nb_paquets = db.query(func.count(models.Log.id)).filter(
        models.Log.ip_source == log.ip_source,
        models.Log.timestamp >= une_minute_avant
    ).scalar()

    if nb_paquets >= SEUIL_DDOS:
        # Vérifier qu'une alerte n'existe pas déjà récemment
        alerte_existante = db.query(models.Alerte).filter(
            models.Alerte.ip_source == log.ip_source,
            models.Alerte.type_alerte == "DDOS",
            models.Alerte.date >= une_minute_avant
        ).first()

        if not alerte_existante:
            alerte = models.Alerte(
                type_alerte="DDOS",
                ip_source=log.ip_source,
                description=f"Possible DDoS : {nb_paquets} paquets en 1 minute "
                            f"depuis {log.ip_source}"
            )
            db.add(alerte)
            db.commit()


def verifier_port_scan(log: models.Log, db: Session):
    une_minute_avant = datetime.utcnow() - timedelta(minutes=1)

    ports_distincts = db.query(
        func.count(func.distinct(models.Log.port_destination))
    ).filter(
        models.Log.ip_source == log.ip_source,
        models.Log.timestamp >= une_minute_avant
    ).scalar()

    if ports_distincts >= SEUIL_PORT_SCAN:
        alerte_existante = db.query(models.Alerte).filter(
            models.Alerte.ip_source == log.ip_source,
            models.Alerte.type_alerte == "PORT_SCAN",
            models.Alerte.date >= une_minute_avant
        ).first()

        if not alerte_existante:
            alerte = models.Alerte(
                type_alerte="PORT_SCAN",
                ip_source=log.ip_source,
                description=f"Port scan détecté : {ports_distincts} ports différents "
                            f"en 1 minute depuis {log.ip_source}"
            )
            db.add(alerte)
            db.commit()


def analyser_log(log: models.Log, db: Session):
    """Fonction principale — appelée à chaque nouveau log"""
    verifier_port_suspect(log, db)
    verifier_ddos(log, db)
    verifier_port_scan(log, db)