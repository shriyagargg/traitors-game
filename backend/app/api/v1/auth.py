from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.database.models import UserModel, UserStatsModel
from app.core.account_auth import hash_password, verify_password, issue_account_token, verify_account_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str):
        import re
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address.")
        return value


class LoginRequest(BaseModel):
    email: str
    password: str


async def current_user(authorization: str | None = Header(None), db: AsyncSession = Depends(get_db)) -> UserModel:
    scheme, _, token = (authorization or "").partition(" ")
    user_id = verify_account_token(token if scheme.lower() == "bearer" else None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user


def user_json(user: UserModel):
    return {"id": user.id, "username": user.username, "email": user.email,
            "avatar_url": user.avatar_url, "role_badge": user.role_badge,
            "created_at": user.created_at.isoformat() if user.created_at else None}


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = req.email.lower()
    clean_username = req.username.strip()
    existing = await db.execute(select(UserModel).where((UserModel.email == email) | (UserModel.username == clean_username)))
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="That email or username is already registered.")
    user = UserModel(
        username=clean_username,
        email=email,
        hashed_password=hash_password(req.password),
        avatar_url="",
    )
    db.add(user)
    await db.flush()
    db.add(UserStatsModel(user_id=user.id))
    await db.commit()
    await db.refresh(user)
    return {"access_token": issue_account_token(user.id), "token_type": "bearer", "user": user_json(user)}


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).where(UserModel.email == req.email.lower()))
    user = result.scalars().first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return {"access_token": issue_account_token(user.id), "token_type": "bearer", "user": user_json(user)}


@router.get("/me")
async def me(user: UserModel = Depends(current_user)):
    return {"user": user_json(user)}


@router.get("/dashboard")
async def dashboard_data(user: UserModel = Depends(current_user), db: AsyncSession = Depends(get_db)):
    from app.database.models import MatchHistoryModel
    stats_result = await db.execute(select(UserStatsModel).where(UserStatsModel.user_id == user.id))
    stats = stats_result.scalars().first()
    history_result = await db.execute(select(MatchHistoryModel).where(MatchHistoryModel.user_id == user.id).order_by(MatchHistoryModel.played_at.desc()).limit(20))
    matches = history_result.scalars().all()
    return {
        "user": user_json(user),
        "stats": ({"games_played": stats.games_played, "wins": stats.wins, "losses": stats.losses, "win_rate": stats.win_rate, "current_streak": stats.current_streak, "reputation": stats.reputation, "traitor_count": stats.traitor_count, "faithful_count": stats.faithful_count, "doctor_count": stats.doctor_count, "detective_count": stats.detective_count} if stats else {"games_played": 0, "wins": 0, "losses": 0, "win_rate": 0, "current_streak": 0, "reputation": 0, "traitor_count": 0, "faithful_count": 0, "doctor_count": 0, "detective_count": 0}),
        "matches": [{"id": m.id, "room_code": m.room_code, "player_role": m.player_role, "winning_team": m.winning_team, "outcome": m.outcome, "player_count": m.player_count, "duration_seconds": m.duration_seconds, "played_at": m.played_at.isoformat() if m.played_at else None} for m in matches]
    }
