import time
import requests
import os
from dotenv import load_dotenv

load_dotenv()
BACKEND_URL = os.getenv("BACKEND_URL")
IP_SOURCE = os.getenv("IP_SOURCE", "192.168.0.8")  # IP de Kali

def simuler_port_scan(ip_cible: str, nb_ports: int = 20):
    import sender
    if not sender.token:
        sender.login()
    print(f"[SIM] Port scan {IP_SOURCE} → {ip_cible} — {nb_ports} ports...")
    for port in range(1, nb_ports + 1):
        log = {
            "ip_source": IP_SOURCE,
            "ip_destination": ip_cible,
            "port_source": 9999,
            "port_destination": port,
            "protocole": "TCP",
            "taille_paquet": 64,
            "flags": "SYN",
            "raw": f"SYN scan port {port}"
        }
        sender.envoyer_log(log)
        time.sleep(0.05)
    print(f"[SIM] Port scan terminé — {nb_ports} logs envoyés")


def simuler_ddos(ip_cible: str, nb_paquets: int = 150):
    import sender
    if not sender.token:
        sender.login()
    print(f"[SIM] DDoS {IP_SOURCE} → {ip_cible} — {nb_paquets} paquets...")
    for i in range(nb_paquets):
        log = {
            "ip_source": IP_SOURCE,
            "ip_destination": ip_cible,
            "port_source": 9999,
            "port_destination": 80,
            "protocole": "UDP",
            "taille_paquet": 1024,
            "flags": None,
            "raw": f"DDoS paquet {i}"
        }
        sender.envoyer_log(log)
    print(f"[SIM] DDoS terminé — {nb_paquets} logs envoyés")


def simuler_connexion_suspecte(ip_source: str, ip_cible: str, port: int = 4444):
    import sender
    if not sender.token:
        sender.login()
    print(f"[SIM] Connexion suspecte {ip_source} → {ip_cible}:{port}")
    log = {
        "ip_source": ip_source,
        "ip_destination": ip_cible,
        "port_source": 9999,
        "port_destination": port,
        "protocole": "TCP",
        "taille_paquet": 64,
        "flags": "SYN",
        "raw": f"connexion suspecte port {port}"
    }
    sender.envoyer_log(log)
    print(f"[SIM] Connexion suspecte envoyée")


def test_integration_backend(token: str):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    base = BACKEND_URL

    print("\n===== TEST INTÉGRATION BACKEND =====")

    res = requests.post(f"{base}/logs/", json={
        "ip_source": IP_SOURCE, "ip_destination": "10.0.0.1",
        "port_source": 1234, "port_destination": 443,
        "protocole": "TCP", "taille_paquet": 256,
        "flags": "ACK", "raw": "HTTPS normal"
    }, headers=headers)
    print(f"[1] Log normal → {res.status_code} {'OK' if res.status_code == 200 else 'ERREUR'}")

    res = requests.post(f"{base}/logs/", json={
        "ip_source": IP_SOURCE, "ip_destination": "10.0.0.1",
        "port_source": 9999, "port_destination": 4444,
        "protocole": "TCP", "taille_paquet": 64,
        "flags": "SYN", "raw": "connexion port 4444"
    }, headers=headers)
    print(f"[2] Port suspect (4444) → {res.status_code} {'OK' if res.status_code == 200 else 'ERREUR'}")

    import time
    time.sleep(1)
    res = requests.get(f"{base}/alertes/non-resolues", headers=headers)
    alertes = res.json()
    print(f"[3] Alertes générées : {len(alertes)}")
    for a in alertes:
        print(f"    → {a['type_alerte']} — {a['ip_source']} — {a['description'][:60]}")
    print("===== FIN TEST =====\n")
