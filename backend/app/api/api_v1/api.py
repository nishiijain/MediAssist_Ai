from fastapi import APIRouter
from app.api.api_v1.endpoints import (
    patients, documents, extraction, verification,
    timeline, summaries, evaluation, demo, stats
)

api_router = APIRouter()

api_router.include_router(patients.router, prefix="/patients", tags=["Patients"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(extraction.router, prefix="/extraction", tags=["Extraction"])
api_router.include_router(verification.router, prefix="/verification", tags=["Verification"])
api_router.include_router(timeline.router, prefix="/timeline", tags=["Timeline"])
api_router.include_router(summaries.router, prefix="/summaries", tags=["Summaries"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation"])
api_router.include_router(demo.router, prefix="/demo", tags=["Demo"])
api_router.include_router(stats.router, prefix="/stats", tags=["Dashboard Statistics"])
