import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedicAssist AI"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/medicassist.db"
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "medicassist_secure_clinical_jwt_secret_key_2026_demo"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Uploads & Storage
    STORAGE_DIR: Path = STORAGE_DIR
    UPLOAD_DIR: Path = UPLOAD_DIR
    MAX_FILE_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: set = {".pdf", ".png", ".jpg", ".jpeg", ".txt"}
    
    # LLM Provider Configuration
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    LLM_PROVIDER: str = "auto"  # 'gemini', 'openai', or 'demo'
    
    # OCR Settings
    TESSERACT_CMD: str | None = None  # e.g., /opt/homebrew/bin/tesseract
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    model_config = SettingsConfigDict(
        env_file=f"{BASE_DIR}/.env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
