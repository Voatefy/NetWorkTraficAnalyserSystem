from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw
from sender import envoyer_log
from detection_rules import analyser_paquet_local, afficher_rapport_local
import os
from dotenv import load_dotenv

load_dotenv()
INTERFACE = os.getenv("INTERFACE", "eth0")
BACKEND_IP = os.getenv("BACKEND_IP", "")
BACKEND_PORT = 8000

def parser_paquet(paquet):
    """Convertit un paquet Scapy en dict pour le backend"""
    try:
        if not paquet.haslayer(IP):
            return None

        ip = paquet[IP]
        protocole = "OTHER"
        port_src = 0
        port_dst = 0
        flags = ""

        if paquet.haslayer(TCP):
            tcp = paquet[TCP]
            protocole = "TCP"
            port_src = int(tcp.sport)
            port_dst = int(tcp.dport)
            flag_map = {
                "F": "FIN", "S": "SYN", "R": "RST",
                "P": "PSH", "A": "ACK", "U": "URG"
            }
            flags = ",".join([v for k, v in flag_map.items() if k in str(tcp.flags)])

        elif paquet.haslayer(UDP):
            udp = paquet[UDP]
            protocole = "UDP"
            port_src = int(udp.sport)
            port_dst = int(udp.dport)

        elif paquet.haslayer(ICMP):
            icmp = paquet[ICMP]
            protocole = "ICMP"
            # Type ICMP : 8=echo request (ping), 0=echo reply
            port_src = int(icmp.type)
            port_dst = int(icmp.code)
            flags = "PING_REQUEST" if icmp.type == 8 else "PING_REPLY" if icmp.type == 0 else f"TYPE_{icmp.type}"

        # Données brutes
        raw = ""
        if paquet.haslayer(Raw):
            try:
                raw = paquet[Raw].load.decode("utf-8", errors="replace")[:200]
            except:
                raw = str(paquet[Raw].load)[:200]

        log = {
            "ip_source":        str(ip.src),
            "ip_destination":   str(ip.dst),
            "port_source":      port_src,
            "port_destination": port_dst,
            "protocole":        protocole,
            "taille_paquet":    len(paquet),
            "flags":            flags or None,
            "raw":              raw or f"{protocole} paquet depuis {ip.src}"
        }

        return log

    except Exception as e:
        print(f"[-] Erreur parsing paquet : {e}")
        return None


def traiter_paquet(paquet):
    """Callback appelé pour chaque paquet capturé"""
    log = parser_paquet(paquet)
    if not log:
        return

    # Ignorer seulement le trafic API (port 8000) vers/depuis le backend
    # Le ping et autres protocoles vers le backend sont capturés
    if (log["ip_destination"] == BACKEND_IP or log["ip_source"] == BACKEND_IP) \
       and (log["port_destination"] == BACKEND_PORT or log["port_source"] == BACKEND_PORT):
        return

    # Analyse locale (règles Sigma/Yara)
    tags = analyser_paquet_local(log)
    if tags:
        afficher_rapport_local(log, tags)

    # Envoi au backend
    succes = envoyer_log(log)
    if succes:
        print(f"[+] Log envoyé : {log['ip_source']} → {log['ip_destination']}:{log['port_destination']} ({log['protocole']})")


def demarrer_capture(filtre="ip", count=0):
    """
    Lance la capture réseau
    filtre : filtre BPF (ex: 'tcp', 'udp', 'ip')
    count  : 0 = capture infinie
    """
    print(f"[*] Démarrage capture sur {INTERFACE} avec filtre '{filtre}'")
    print(f"[*] Appuie sur CTRL+C pour arrêter\n")
    sniff(
        iface=INTERFACE,
        filter=filtre,
        prn=traiter_paquet,
        count=count,
        store=False
    )
