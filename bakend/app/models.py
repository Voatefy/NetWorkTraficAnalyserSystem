# from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
# from sqlalchemy.sql import func
# from app.database import Base

# class Log(Base):
#     __tablename__ = "logs"

#     id = Column(Integer, primary_key=True, index=True)
#     timestamp = Column(DateTime, default=func.now())
#     ip_source = Column(String, index=True)
#     ip_destination = Column(String, index=True)
#     port_source = Column(Integer)
#     port_destination = Column(Integer)
#     protocole = Column(String)
#     taille_paquet = Column(Integer)
#     flags = Column(String, nullable=True)
#     raw = Column(String)

# class IPBloquee(Base):
#     __tablename__ = "ips_bloquees"

#     id = Column(Integer, primary_key=True, index=True)
#     ip = Column(String, unique=True, index=True)
#     raison = Column(String)
#     date_blocage = Column(DateTime, default=func.now())
#     active = Column(Boolean, default=True)

# class Alerte(Base):
#     __tablename__ = "alertes"

#     id = Column(Integer, primary_key=True, index=True)
#     type_alerte = Column(String)
#     ip_source = Column(String)
#     description = Column(String)
#     date = Column(DateTime, default=func.now())
#     resolue = Column(Boolean, default=False)

# class Utilisateur(Base):
#     __tablename__ = "utilisateurs"

#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True)
#     email = Column(String, unique=True)
#     hashed_password = Column(String)
#     role = Column(String, default="user")
#     actif = Column(Boolean, default=True)



from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from sqlalchemy.sql import func
from app.database import Base

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    ip_source = Column(String, index=True)
    ip_destination = Column(String, index=True)
    port_source = Column(Integer)
    port_destination = Column(Integer)
    protocole = Column(String)
    taille_paquet = Column(Integer)
    flags = Column(String, nullable=True)
    raw = Column(String)

class IPBloquee(Base):
    __tablename__ = "ips_bloquees"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String, unique=True, index=True)
    raison = Column(String)
    date_blocage = Column(DateTime, default=func.now())
    active = Column(Boolean, default=True)

class Alerte(Base):
    __tablename__ = "alertes"

    id = Column(Integer, primary_key=True, index=True)
    type_alerte = Column(String)
    ip_source = Column(String)
    description = Column(String)
    date = Column(DateTime, default=func.now())
    derniere_occurrence = Column(DateTime, default=func.now())
    occurrences = Column(Integer, default=1)
    resolue = Column(Boolean, default=False)

class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)
    role = Column(String, default="user")
    actif = Column(Boolean, default=True)