# from pydantic import BaseModel
# from datetime import datetime
# from typing import Optional

# class LogCreate(BaseModel):
#     ip_source: str
#     ip_destination: str
#     port_source: int
#     port_destination: int
#     protocole: str
#     taille_paquet: int
#     flags: Optional[str] = None
#     raw: str

# class LogResponse(LogCreate):
#     id: int
#     timestamp: datetime

#     class Config:
#         from_attributes = True

# class AlerteResponse(BaseModel):
#     id: int
#     type_alerte: str
#     ip_source: str
#     description: str
#     date: datetime
#     resolue: bool

#     class Config:
#         from_attributes = True

# class IPBloqueeCreate(BaseModel):
#     ip: str
#     raison: str

# class IPBloqueeResponse(IPBloqueeCreate):
#     id: int
#     date_blocage: datetime
#     active: bool

#     class Config:
#         from_attributes = True

# # --- Auth ---
# class UtilisateurCreate(BaseModel):
#     username: str
#     email: str
#     password: str
#     role: Optional[str] = "user"

# class UtilisateurResponse(BaseModel):
#     id: int
#     username: str
#     email: str
#     role: str
#     actif: bool

#     class Config:
#         from_attributes = True

# class Token(BaseModel):
#     access_token: str
#     token_type: str

# class TokenData(BaseModel):
#     username: Optional[str] = None

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LogCreate(BaseModel):
    ip_source: str
    ip_destination: str
    port_source: int
    port_destination: int
    protocole: str
    taille_paquet: int
    flags: Optional[str] = None
    raw: str

class LogResponse(LogCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class AlerteResponse(BaseModel):
    id: int
    type_alerte: str
    ip_source: str
    description: str
    date: datetime
    derniere_occurrence: datetime
    occurrences: int
    resolue: bool

    class Config:
        from_attributes = True

class IPBloqueeCreate(BaseModel):
    ip: str
    raison: str

class IPBloqueeResponse(IPBloqueeCreate):
    id: int
    date_blocage: datetime
    active: bool

    class Config:
        from_attributes = True

# --- Auth ---
class UtilisateurCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "user"

class UtilisateurResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    actif: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None