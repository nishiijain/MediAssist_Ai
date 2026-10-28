from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.security import decode_access_token
from app.models import User

# OAuth2 scheme configured for token retrieval
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/doctor/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate Bearer token and return active User instance."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing. Please sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def require_doctor(current_user: User = Depends(get_current_user)) -> User:
    """Require user to hold 'doctor' clinical role."""
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: This clinical area requires Doctor credentials."
        )
    return current_user

def require_patient(current_user: User = Depends(get_current_user)) -> User:
    """Require user to hold 'patient' role."""
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: This portal is reserved for registered patients."
        )
    return current_user

def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Retrieve user if token present, otherwise None."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            return db.query(User).filter(User.id == payload["sub"]).first()
    except Exception:
        pass
    return None
