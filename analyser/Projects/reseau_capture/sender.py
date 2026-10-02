import requests
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL")
token = None

def login():
    """Se connecte au backend et récupère le token JWT"""
    global token
    try:
        res = requests.post(
            f"{BACKEND_URL}/auth/login",
            data={
                "username": os.getenv("BACKEND_USER"),
                "password": os.getenv("BACKEND_PASSWORD")
            }
        )
        if res.status_code == 200:
            token = res.json()["access_token"]
            print(f"[+] Connecté au backend ({BACKEND_URL})")
            return True
        else:
            print(f"[-] Échec login : {res.text}")
            return False
    except Exception as e:
        print(f"[-] Backend inaccessible : {e}")
        return False

def envoyer_log(log_data: dict):
    """Envoie un log au backend"""
    global token
    if not token:
        if not login():
            return False
    try:
        res = requests.post(
            f"{BACKEND_URL}/logs/",
            json=log_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        if res.status_code == 401:
            # Token expiré, on se reconnecte
            login()
            res = requests.post(
                f"{BACKEND_URL}/logs/",
                json=log_data,
                headers={"Authorization": f"Bearer {token}"}
            )
        if res.status_code == 403:
            print(f"[!] IP bloquée : {log_data.get('ip_source')}")
            return False
        if res.status_code == 200:
            return True
        print(f"[-] Erreur envoi log : {res.status_code} {res.text}")
        return False
    except Exception as e:
        print(f"[-] Erreur connexion : {e}")
        return False
