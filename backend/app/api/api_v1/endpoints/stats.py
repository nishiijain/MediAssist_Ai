from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models import Patient, MedicalDocument, Consultation, GeneratedSummary, VerificationIssue, ExtractedField
from app.schemas import DashboardStatsResponse

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_patients = db.query(func.count(Patient.id)).scalar() or 0
    total_documents = db.query(func.count(MedicalDocument.id)).scalar() or 0
    total_consultations = db.query(func.count(Consultation.id)).scalar() or 0
    
    # Summaries awaiting doctor review
    awaiting_reviews = db.query(func.count(GeneratedSummary.id)).filter(
        GeneratedSummary.status == "draft"
    ).scalar() or 0

    # Unresolved issues
    unresolved_issues = db.query(func.count(VerificationIssue.id)).filter(
        VerificationIssue.resolved == False
    ).scalar() or 0

    # Status distribution of extracted fields
    status_counts = db.query(
        ExtractedField.verification_status,
        func.count(ExtractedField.id)
    ).group_by(ExtractedField.verification_status).all()
    
    status_dist = {s[0]: s[1] for s in status_counts}

    # Recent patients
    recent_patients = db.query(Patient).order_by(Patient.updated_at.desc()).limit(5).all()
    recent_activity = []
    for p in recent_patients:
        issues_cnt = db.query(func.count(VerificationIssue.id)).filter(
            VerificationIssue.patient_id == p.id,
            VerificationIssue.resolved == False
        ).scalar() or 0
        docs_cnt = db.query(func.count(MedicalDocument.id)).filter(
            MedicalDocument.patient_id == p.id
        ).scalar() or 0

        recent_activity.append({
            "patient_id": p.id,
            "patient_name": p.name,
            "mrn": p.mrn,
            "is_demo": p.is_demo,
            "document_count": docs_cnt,
            "unresolved_issues": issues_cnt,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None
        })

    # Document type distribution
    doc_types = db.query(
        MedicalDocument.document_type,
        func.count(MedicalDocument.id)
    ).group_by(MedicalDocument.document_type).all()

    trend_stats = [{"type": dt[0] or "General Record", "count": dt[1]} for dt in doc_types]

    return {
        "total_patients": total_patients,
        "total_documents": total_documents,
        "total_consultations": total_consultations,
        "summaries_awaiting_review": awaiting_reviews,
        "unresolved_issues_count": unresolved_issues,
        "recent_activity": recent_activity,
        "status_distribution": status_dist,
        "trend_stats": trend_stats
    }
