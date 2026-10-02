# Règles de détection inspirées de Sigma et Yara
# L'étudiant 3 peut enrichir ces règles selon les menaces connues

PORTS_DANGEREUX = {
    22:   "SSH — accès distant",
    23:   "Telnet — protocole non chiffré",
    3389: "RDP — bureau à distance Windows",
    4444: "Metasploit default port",
    1337: "Port hacker classique",
    6666: "IRC/Backdoor",
    5900: "VNC — bureau à distance",
    8080: "Proxy/Web alternatif",
    31337: "Back Orifice trojan",
}

PROTOCOLES_SUSPECTS = ["ICMP"]  # Peut indiquer un ping flood

TAILLE_PAQUET_SUSPECTE = 65000  # Paquets anormalement grands

def analyser_paquet_local(paquet: dict) -> list:
    """
    Analyse locale AVANT envoi au backend.
    Retourne une liste de tags suspects détectés.
    """
    tags = []

    # Règle 1 — Port dangereux
    port_dst = paquet.get("port_destination", 0)
    if port_dst in PORTS_DANGEREUX:
        tags.append(f"PORT_DANGEREUX:{port_dst}:{PORTS_DANGEREUX[port_dst]}")

    # Règle 2 — Protocole suspect
    if paquet.get("protocole") in PROTOCOLES_SUSPECTS:
        tags.append(f"PROTOCOLE_SUSPECT:{paquet.get('protocole')}")

    # Règle 3 — Paquet anormalement grand
    if paquet.get("taille_paquet", 0) > TAILLE_PAQUET_SUSPECTE:
        tags.append("PAQUET_TROP_GRAND")

    # Règle 4 — IP source privée qui contacte port public suspect
    ip_src = paquet.get("ip_source", "")
    if ip_src.startswith("192.168.") and port_dst in [4444, 1337, 31337]:
        tags.append("POSSIBLE_MALWARE_INTERNE")

    return tags

def afficher_rapport_local(paquet: dict, tags: list):
    if tags:
        print(f"[ALERTE LOCAL] {paquet['ip_source']} → {paquet['ip_destination']}:{paquet.get('port_destination')}")
        for tag in tags:
            print(f"  ⚠ {tag}")
