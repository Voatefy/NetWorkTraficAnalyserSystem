import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from app.database import get_db
from app import models
from app.security import obtenir_utilisateur_actuel

router = APIRouter(prefix="/exports", tags=["Exports"])


@router.get("/logs/csv")
def exporter_logs_csv(
    db: Session = Depends(get_db),
    utilisateur=Depends(obtenir_utilisateur_actuel)
):
    logs = db.query(models.Log).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # En-têtes
    writer.writerow([
        "id", "timestamp", "ip_source", "ip_destination",
        "port_source", "port_destination", "protocole",
        "taille_paquet", "flags", "raw"
    ])

    # Données
    for log in logs:
        writer.writerow([
            log.id, log.timestamp, log.ip_source, log.ip_destination,
            log.port_source, log.port_destination, log.protocole,
            log.taille_paquet, log.flags, log.raw
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=logs.csv"}
    )


@router.get("/alertes/csv")
def exporter_alertes_csv(
    db: Session = Depends(get_db),
    utilisateur=Depends(obtenir_utilisateur_actuel)
):
    alertes = db.query(models.Alerte).all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["id", "type_alerte", "ip_source", "description", "date", "resolue"])

    for alerte in alertes:
        writer.writerow([
            alerte.id, alerte.type_alerte, alerte.ip_source,
            alerte.description, alerte.date, alerte.resolue
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=alertes.csv"}
    )


@router.get("/rapport/pdf")
def exporter_rapport_pdf(
    db: Session = Depends(get_db),
    utilisateur=Depends(obtenir_utilisateur_actuel)
):
    logs = db.query(models.Log).limit(50).all()
    alertes = db.query(models.Alerte).all()
    ips_bloquees = db.query(models.IPBloquee).filter(models.IPBloquee.active == True).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Titre
    elements.append(Paragraph("Rapport — Système Logs Réseau", styles["Title"]))
    elements.append(Spacer(1, 20))

    # Section stats
    elements.append(Paragraph("Résumé", styles["Heading2"]))
    elements.append(Paragraph(f"Total logs : {len(logs)}", styles["Normal"]))
    elements.append(Paragraph(f"Total alertes : {len(alertes)}", styles["Normal"]))
    elements.append(Paragraph(f"IPs bloquées actives : {len(ips_bloquees)}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    # Table alertes
    elements.append(Paragraph("Alertes détectées", styles["Heading2"]))
    if alertes:
        data = [["ID", "Type", "IP Source", "Date", "Résolue"]]
        for a in alertes:
            data.append([
                str(a.id), a.type_alerte, a.ip_source,
                str(a.date)[:19], "Oui" if a.resolue else "Non"
            ])

        table = Table(data, colWidths=[30, 100, 110, 140, 60])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2C3E50")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        elements.append(table)
    else:
        elements.append(Paragraph("Aucune alerte.", styles["Normal"]))

    elements.append(Spacer(1, 20))

    # Table IPs bloquées
    elements.append(Paragraph("IPs bloquées", styles["Heading2"]))
    if ips_bloquees:
        data2 = [["IP", "Raison", "Date blocage"]]
        for ip in ips_bloquees:
            data2.append([ip.ip, ip.raison, str(ip.date_blocage)[:19]])

        table2 = Table(data2, colWidths=[120, 200, 140])
        table2.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#C0392B")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        elements.append(table2)
    else:
        elements.append(Paragraph("Aucune IP bloquée.", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=rapport.pdf"}
    )