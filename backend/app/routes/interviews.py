from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.interview import (
    AnswerSubmitRequest,
    AnswerSubmitResponse,
    InterviewCreateRequest,
    InterviewHistoryResponse,
    InterviewSessionDetail,
)
from app.services import interview_service

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


@router.post("", response_model=InterviewSessionDetail)
def start_interview(
    payload: InterviewCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionDetail:
    """Start a new interview session for any job role and generate the first question."""
    session_detail = interview_service.create_interview_session(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )
    return session_detail


@router.get("", response_model=InterviewHistoryResponse)
def list_user_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewHistoryResponse:
    """List all interview sessions and analytics for the authenticated user."""
    return interview_service.get_user_history(db=db, user_id=current_user.id)


@router.get("/{session_id}", response_model=InterviewSessionDetail)
def get_interview(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InterviewSessionDetail:
    """Get the full details, current status, and question history of an interview."""
    session_detail = interview_service.get_session_detail(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
    )
    if not session_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )
    return session_detail


@router.post("/{session_id}/answer", response_model=AnswerSubmitResponse)
def submit_interview_answer(
    session_id: int,
    payload: AnswerSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnswerSubmitResponse:
    """Submit a candidate response (spoken or typed), evaluate via NLP, and get the next adaptive question."""
    result = interview_service.submit_answer(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
        answer_text=payload.answer_text,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit answer for this session. It may be completed or inactive.",
        )
    return result
