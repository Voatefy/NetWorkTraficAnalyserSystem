from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from datetime import datetime, timedelta

# Ports considérés comme suspects
PORTS_SUSPECTS = [22, 23, 4444, 1337, 6666, 31337, 3389, 5900]

# Protocoles suspects (ICMP peut indiquer un ping sweep ou tunnel)
PROTOCOLES_SUSPECTS = ["ICMP", "GRE", "ESP", "OTHER"]

# Seuils
SEUIL_DDOS = 100        # paquets par minute depuis une même IP
SEUIL_PORT_SCAN = 15    # ports différents en 1 minute depuis une même IP


def _incrementer_ou_creer_alerte(db: Session, type_alerte: str, ip_source: str, description: str, fenetre: timedelta):
    """
    Si une alerte du même type et de la même IP existe dans la fenêtre de temps,
    on incrémente son compteur d'occurrences.
    Sinon on en crée une nouvelle.
    """
    fenetre_debut = datetime.utcnow() - fenetre

    alerte_existante = db.query(models.Alerte).filter(
        models.Alerte.ip_source == ip_source,
        models.Alerte.type_alerte == type_alerte,
        models.Alerte.resolue == False,
        models.Alerte.derniere_occurrence >= fenetre_debut
    ).first()

    if alerte_existante:
        alerte_existante.occurrences += 1
        alerte_existante.derniere_occurrence = datetime.utcnow()
        alerte_existante.description = description
        db.commit()
    else:
        nouvelle_alerte = models.Alerte(
            type_alerte=type_alerte,
            ip_source=ip_source,
            description=description,
            occurrences=1,
        )
        db.add(nouvelle_alerte)
        db.commit()


def verifier_port_suspect(log: models.Log, db: Session):
    # CORRECTIF : ignorer si port est None ou 0 (cas ICMP)
    if not log.port_destination:
        return
    if log.port_destination in PORTS_SUSPECTS:
        _incrementer_ou_creer_alerte(
            db,
            type_alerte="PORT_SUSPECT",
            ip_source=log.ip_source,
            description=f"Connexion sur port suspect {log.port_destination} "
                        f"depuis {log.ip_source} vers {log.ip_destination}",
            fenetre=timedelta(minutes=5),
        )


def verifier_ddos(log: models.Log, db: Session):
    # CORRECTIF : ignorer ICMP pour la détection DDoS classique
    # (un ping flood a sa propre règle)
    if log.protocole in ("ICMP", "OTHER"):
        return

    une_minute_avant = datetime.utcnow() - timedelta(minutes=1)

    nb_paquets = db.query(func.count(models.Log.id)).filter(
        models.Log.ip_source == log.ip_source,
        models.Log.protocole == log.protocole,   # même protocole seulement
        models.Log.timestamp >= une_minute_avant
    ).scalar()

    if nb_paquets >= SEUIL_DDOS:
        _incrementer_ou_creer_alerte(
            db,
            type_alerte="DDOS",
            ip_source=log.ip_source,
            description=f"Possible DDoS ({log.protocole}) : {nb_paquets} paquets "
                        f"en 1 minute depuis {log.ip_source}",
            fenetre=timedelta(minutes=1),
        )


def verifier_port_scan(log: models.Log, db: Session):
    # CORRECTIF : le port scan ne s'applique qu'au TCP/UDP
    if log.protocole not in ("TCP", "UDP"):
        return

    une_minute_avant = datetime.utcnow() - timedelta(minutes=1)

    ports_distincts = db.query(
        func.count(func.distinct(models.Log.port_destination))
    ).filter(
        models.Log.ip_source == log.ip_source,
        models.Log.port_destination.isnot(None),   # CORRECTIF : exclure les ports NULL
        models.Log.port_destination != 0,           # CORRECTIF : exclure port 0
        models.Log.timestamp >= une_minute_avant
    ).scalar()

    if ports_distincts >= SEUIL_PORT_SCAN:
        _incrementer_ou_creer_alerte(
            db,
            type_alerte="PORT_SCAN",
            ip_source=log.ip_source,
            description=f"Port scan détecté : {ports_distincts} ports différents "
                        f"en 1 minute depuis {log.ip_source}",
            fenetre=timedelta(minutes=1),
        )


def verifier_protocole_suspect(log: models.Log, db: Session):
    """NOUVEAU : détecte les protocoles inhabituels (ICMP flood, tunnel, etc.)"""
    if log.protocole not in PROTOCOLES_SUSPECTS:
        return

    une_minute_avant = datetime.utcnow() - timedelta(minutes=1)

    # Compter les paquets ICMP de cette IP dans la dernière minute
    nb_paquets = db.query(func.count(models.Log.id)).filter(
        models.Log.ip_source == log.ip_source,
        models.Log.protocole == log.protocole,
        models.Log.timestamp >= une_minute_avant
    ).scalar()

    # Alerte si plus de 20 paquets ICMP en 1 minute (ping flood possible)
    SEUIL_PROTOCOLE = 20
    if nb_paquets >= SEUIL_PROTOCOLE:
        _incrementer_ou_creer_alerte(
            db,
            type_alerte="PROTOCOLE_SUSPECT",
            ip_source=log.ip_source,
            description=f"Trafic {log.protocole} anormal : {nb_paquets} paquets "
                        f"en 1 minute depuis {log.ip_source} vers {log.ip_destination}",
            fenetre=timedelta(minutes=5),
        )


def analyser_log(log: models.Log, db: Session):
    """Fonction principale — appelée à chaque nouveau log"""
    verifier_port_suspect(log, db)
    verifier_ddos(log, db)
    verifier_port_scan(log, db)
    verifier_protocole_suspect(log, db)   # NOUVEAU