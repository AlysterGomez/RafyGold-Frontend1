from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import jwt
import base64
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from io import BytesIO

# --- REPORTLAB IMPORTS (Utilisés par ton moteur) ---
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- CONFIGURATION ---
MASTER_PASSWORD = "RGSECURE2026"
EMAILS_AUTORISES = ["a.guignier@rafygold.com", "b.via@rafygold.com", "a.tcherniak@rafygold.com", "a.gomez@rafygold.com", "e.mermet@rafygold.com", "r.montolio@rafygold.com", "direction@rafygold.com", "j.amsellem@rafygold.com"]
SECRET_KEY = os.environ.get('JWT_SECRET', 'rafy-gold-secret-key-2024')
ALGORITHM = "HS256"

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# --- AUTH HELPER ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        raise HTTPException(status_code=401)

# ==================== TON MOTEUR PDF (GARDÉ TEL QUEL) ====================

def generate_audit_pdf(audit: dict) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#FFD700'),
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        alignment=TA_CENTER,
        spaceAfter=30
    )
    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#000000'),
        spaceBefore=15,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    normal_style = styles['Normal']
    
    elements = []
    
    # Header
    elements.append(Paragraph("RAFY GOLD", title_style))
    elements.append(Paragraph("Procès-Verbal de Contrôle Interne", subtitle_style))
    
    # Info Section
    elements.append(Paragraph("INFORMATIONS GÉNÉRALES", section_style))
    info_data = [
        ["Date du contrôle", audit.get('date_controle', '')],
        ["Heure", audit.get('heure', '')],
        ["Lieu", audit.get('lieu', '')],
        ["Commercial contrôlé", audit.get('commercial_controle', '')],
        ["Contrôleur interne", audit.get('controleur_interne', '')],
    ]
    info_table = Table(info_data, colWidths=[6*cm, 10*cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#FFD700')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))
    
    # Checklist Section
    elements.append(Paragraph("POINTS DE CONTRÔLE", section_style))
    checklist = audit.get('checklist', {})
    
    def get_status_color(status):
        return colors.HexColor('#10B981') if status == 'CONFORME' else colors.HexColor('#EF4444')
    
    checklist_labels = [
        ("affichages_legaux_presents", "Affichages légaux présents"),
        ("affichages_legaux_visible", "Affichages légaux visible"),
        ("kakemono", "Kakémono"),
        ("positionnement_balance", "Positionnement balance"),
        ("bulle_centree_balance", "Bulle centrée balance"),
        ("port_du_badge", "Port du badge"),
        ("cours_a_jour", "Cours à jour"),
        ("source_du_cours", "Source du cours"),
        ("date_du_cours", "Date du cours"),
        ("affichage_flyer", "Affichage flyer"),
        ("etiquettes_date_flacons_acide", "Étiquettes date flacons acide"),
        ("date_revision_balance", "Date de révision balance"),
        ("tenue", "Tenue"),
        ("conformites_a_jour", "Conformités à jour"),
        ("ldp_a_jour", "LDP à jour"),
        ("date_sortie_a_jour", "Date de sortie à jour"),
        ("designation_correcte_ldp", "Désignation correcte LDP"),
        ("indicatif_g_present_ldp", "Indicatif g présent LDP"),
        ("remplissage_ldp_procedure", "Remplissage LDP selon procédure"),
        ("rom_a_jour", "ROM à jour"),
        ("remplissage_rom_procedure", "Remplissage ROM selon procédure"),
        ("book_acheteur_a_jour", "Book acheteur à jour"),
        ("envoi_photo_groupe_deloc", "Envoi photo groupe déloc"),
        ("exactitude_facture", "Exactitude de la facture"),
        ("conditionnements_bijoux", "Conditionnements bijoux"),
        ("scotch_facture_cheque", "Scotch sur facture / chèque"),
        ("exactitude_designations", "Exactitude des désignations"),
        ("respect_titrages", "Respect des titrages"),
        ("erreur_or", "Erreur or?"),
        ("erreur_agt", "Erreur agt?"),
        ("erreur_po", "Erreur PO?"),
        ("erreur_ma", "Erreur MA?"),
        ("ecart_poids_facture_reel", "Écart poids facture / réel"),
        ("bijoux_non_poinconnes_coupes_48h", "Bijoux non poinçonnés coupés après 48h"),
        ("facturier_secours", "Facturier de secours"),
        ("verification_etat_valise", "Vérification état valise"),
    ]
    
    checklist_data = [["Point de contrôle", "Résultat", "Commentaire"]]
    for key, label in checklist_labels:
        item = checklist.get(key, {})
        if isinstance(item, dict):
            status = item.get('status', 'NON CONFORME')
            comment = item.get('comment', '') or ''
        else:
            status = item if isinstance(item, str) else 'NON CONFORME'
            comment = ''
        checklist_data.append([label, status, comment])
    
    checklist_table = Table(checklist_data, colWidths=[7*cm, 4*cm, 5*cm])
    table_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FFD700')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    
    for i, row in enumerate(checklist_data[1:], start=1):
        status = row[1]
        color = get_status_color(status)
        table_style.append(('BACKGROUND', (1, i), (1, i), color))
        table_style.append(('TEXTCOLOR', (1, i), (1, i), colors.white))
        table_style.append(('FONTSIZE', (1, i), (1, i), 7))
    
    checklist_table.setStyle(TableStyle(table_style))
    elements.append(checklist_table)
    elements.append(Spacer(1, 20))
    
    # Observations Section
    elements.append(Paragraph("OBSERVATIONS & ACTIONS", section_style))
    obs_data = [
        ["Observations", audit.get('observations', '') or 'Aucune'],
        ["Actions correctives", audit.get('actions_correctives', '') or 'Aucune'],
    ]
    obs_table = Table(obs_data, colWidths=[4*cm, 12*cm])
    obs_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#FFD700')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(obs_table)
    elements.append(Spacer(1, 20))
    
    # Global Result
    elements.append(Paragraph("RÉSULTAT GLOBAL", section_style))
    result = audit.get('resultat_global', 'NON CONFORME')
    result_color = get_status_color(result)
    result_data = [["Résultat du contrôle", result]]
    result_table = Table(result_data, colWidths=[10*cm, 6*cm])
    result_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#FFD700')),
        ('BACKGROUND', (1, 0), (1, 0), result_color),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.black),
        ('TEXTCOLOR', (1, 0), (1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(result_table)
    elements.append(Spacer(1, 20))
    
    # Photos Section
    elements.append(Paragraph("PHOTOS", section_style))
    photos_added = False
    
    for photo_key, photo_label in [
        ('photo_livre_police', 'Livre de Police'),
        ('photo_erreur_1', 'Erreur 1'),
        ('photo_erreur_2', 'Erreur 2'),
    ]:
        photo_data = audit.get(photo_key)
        if photo_data and photo_data.startswith('data:image'):
            try:
                base64_data = photo_data.split(',')[1] if ',' in photo_data else photo_data
                img_data = base64.b64decode(base64_data)
                img_buffer = BytesIO(img_data)
                img = RLImage(img_buffer, width=6*cm, height=4*cm)
                elements.append(Paragraph(photo_label, normal_style))
                elements.append(img)
                elements.append(Spacer(1, 10))
                photos_added = True
            except Exception as e:
                logging.error(f"Error adding photo {photo_key}: {e}")
    
    if not photos_added:
        elements.append(Paragraph("Aucune photo jointe", normal_style))
    elements.append(Spacer(1, 20))
    
    # Signatures Section
    elements.append(Paragraph("SIGNATURES", section_style))
    sig_elements = []
    
    for sig_key, sig_label in [
        ('signature_commercial', 'Signature Commercial'),
        ('signature_controleur', 'Signature Contrôleur'),
    ]:
        sig_data = audit.get(sig_key)
        if sig_data and sig_data.startswith('data:image'):
            try:
                base64_data = sig_data.split(',')[1] if ',' in sig_data else sig_data
                sig_bytes = base64.b64decode(base64_data)
                sig_buffer = BytesIO(sig_bytes)
                sig_img = RLImage(sig_buffer, width=5*cm, height=2.5*cm)
                sig_elements.append([sig_label, sig_img])
            except Exception as e:
                logging.error(f"Error adding signature {sig_key}: {e}")
                sig_elements.append([sig_label, "Non fournie"])
        else:
            sig_elements.append([sig_label, "Non fournie"])
    
    if sig_elements:
        sig_table = Table(sig_elements, colWidths=[6*cm, 10*cm])
        sig_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(sig_table)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer

# --- ROUTES ---

@api_router.post("/auth/login")
async def login(credentials: dict):
    email = credentials.get("email", "").lower().strip()
    if email in EMAILS_AUTORISES and credentials.get("password") == MASTER_PASSWORD:
        token = jwt.encode({"sub": email, "exp": datetime.now(timezone.utc) + timedelta(days=1)}, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": token, "user": {"email": email, "name": email.split('@')[0].upper()}}
    raise HTTPException(status_code=401)

@api_router.get("/audits")
async def get_audits(user=Depends(get_current_user)):
    audits = await db.audits.find().sort("created_at", -1).to_list(100)
    for a in audits:
        a["id"] = str(a["_id"])
        del a["_id"]
    return audits

@api_router.get("/audits/{audit_id}")
async def get_audit(audit_id: str, user=Depends(get_current_user)):
    try:
        audit = await db.audits.find_one({"_id": ObjectId(audit_id)})
        if not audit: raise HTTPException(status_code=404)
        audit["id"] = str(audit["_id"])
        del audit["_id"]
        return audit
    except: raise HTTPException(status_code=400)

@api_router.get("/audits/{audit_id}/pdf")
async def download_pdf(audit_id: str, user=Depends(get_current_user)):
    try:
        audit = await db.audits.find_one({"_id": ObjectId(audit_id)})
        if not audit: raise HTTPException(status_code=404)
        
        # Appel de TON moteur PDF
        pdf_buffer = generate_audit_pdf(audit)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=PV_Audit_{audit.get('commercial_controle')}.pdf",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        logging.error(f"Erreur PDF : {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération du PDF")

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])