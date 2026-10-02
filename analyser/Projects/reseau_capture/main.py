import sys
import os
from dotenv import load_dotenv
from sender import login
from capture import demarrer_capture
from simulation import (
    simuler_port_scan,
    simuler_ddos,
    simuler_connexion_suspecte,
    test_integration_backend
)

load_dotenv()

def menu():
    print("\n====== Système Capture Réseau ======")
    print("1. Démarrer la capture (tout le trafic)")
    print("2. Démarrer la capture (TCP seulement)")
    print("3. Simuler un port scan")
    print("4. Simuler un DDoS")
    print("5. Simuler une connexion suspecte")
    print("6. Test d'intégration backend complet")
    print("0. Quitter")
    print("=====================================")
    return input("Choix : ").strip()

if __name__ == "__main__":
    print("[*] Connexion au backend...")
    if not login():
        print("[-] Impossible de se connecter au backend. Vérifie le .env")
        sys.exit(1)

    # Import du token après login
    import sender
    token = sender.token

    ip_cible = os.getenv("BACKEND_URL", "").replace("http://", "").split(":")[0]

    while True:
        choix = menu()

        if choix == "1":
            demarrer_capture(filtre="ip")
        elif choix == "2":
            demarrer_capture(filtre="tcp")
        elif choix == "3":
            ip = input(f"IP cible [{ip_cible}] : ").strip() or ip_cible
            simuler_port_scan(ip, nb_ports=20)
        elif choix == "4":
            ip = input(f"IP cible [{ip_cible}] : ").strip() or ip_cible
            simuler_ddos(ip, nb_paquets=150)
        elif choix == "5":
            ip_src = input("IP source (simulée) : ").strip()
            ip_dst = input(f"IP cible [{ip_cible}] : ").strip() or ip_cible
            port = int(input("Port [4444] : ").strip() or "4444")
            simuler_connexion_suspecte(ip_src, ip_dst, port)
        elif choix == "6":
            test_integration_backend(token)
        elif choix == "0":
            print("Au revoir !")
            break
        else:
            print("Choix invalide")
