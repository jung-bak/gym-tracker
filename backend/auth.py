from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from pydantic import BaseModel
from typing import Optional

security = HTTPBearer()


class AuthenticatedUser(BaseModel):
    uid: str
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticatedUser:
    """Verify Firebase ID token and return the authenticated user."""
    token = credentials.credentials

    try:
        decoded_token = auth.verify_id_token(token)
        return AuthenticatedUser(
            uid=decoded_token["uid"],
            email=decoded_token.get("email"),
            name=decoded_token.get("name"),
            picture=decoded_token.get("picture"),
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
