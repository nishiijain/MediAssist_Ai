from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models import Patient, PatientTimelineEvent, ExtractedField, MedicalDocument, Consultation
from app.schemas import TimelineEventResponse, TrendSeries
from app.services.timeline.builder import timeline_builder

router = APIRouter()

@router.get("/patient/{patient_id}", response_model=List[TimelineEventResponse])
def get_patient_timeline(patient_id: str, db: Session = Depends(get_db)):
    events = db.query(PatientTimelineEvent).filter(
        PatientTimelineEvent.patient_id == patient_id
    ).all()

    if not events:
        # Generate dynamically if not yet persisted
        fields = db.query(ExtractedField).filter(ExtractedField.patient_id == patient_id).all()
        docs = db.query(MedicalDocument).filter(MedicalDocument.patient_id == patient_id).all()
        consults = db.query(Consultation).filter(Consultation.patient_id == patient_id).all()

        fields_dict = [f.__dict__ for f in fields]
        docs_dict = [d.__dict__ for d in docs]
        consults_dict = [c.__dict__ for c in consults]

        built = timeline_builder.build_timeline_events(fields_dict, docs_dict, consults_dict)
        for ev in built:
            t_obj = PatientTimelineEvent(
                patient_id=patient_id,
                document_id=ev.get("document_id"),
                extracted_field_id=ev.get("extracted_field_id"),
                event_date=ev.get("event_date", "1970-01-01"),
                event_type=ev.get("event_type", "observation"),
                title=ev.get("title", ""),
                description=ev.get("description"),
                numeric_value=ev.get("numeric_value"),
                unit=ev.get("unit"),
                reference_range=ev.get("reference_range"),
                source_snippet=ev.get("source_snippet"),
                is_flagged=ev.get("is_flagged", False),
                clinical_flag_reason=ev.get("clinical_flag_reason")
            )
            db.add(t_obj)
        db.commit()
        events = db.query(PatientTimelineEvent).filter(PatientTimelineEvent.patient_id == patient_id).all()

    return events

@router.get("/patient/{patient_id}/trends", response_model=List[TrendSeries])
def get_patient_trends(patient_id: str, db: Session = Depends(get_db)):
    fields = db.query(ExtractedField).filter(
        ExtractedField.patient_id == patient_id,
        ExtractedField.field_category == "lab_result",
        ExtractedField.is_active == True
    ).all()

    fields_dict = [
        {
            "id": f.id,
            "field_name": f.field_name,
            "numeric_value": f.numeric_value,
            "unit": f.unit,
            "event_date": f.event_date,
            "reference_range": f.reference_range,
            "document_id": f.document_id,
            "field_category": f.field_category,
            "is_active": f.is_active
        }
        for f in fields
    ]

    return timeline_builder.build_trend_series(fields_dict)
