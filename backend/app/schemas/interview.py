from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class InterviewCreateRequest(BaseModel):
    job_role: str = Field(..., min_length=2, max_length=150, description="The job role being interviewed for")
    job_description: Optional[str] = Field(None, max_length=5000, description="Optional job description text")
    experience_level: str = Field("mid", description="fresher, junior, mid, senior")
    interview_type: str = Field("technical", description="technical, hr, behavioral, mixed, coding, system_design, managerial, custom")
    difficulty: str = Field("adaptive", description="easy, medium, hard, adaptive")
    question_count: int = Field(5, ge=3, le=10, description="Number of questions in session")


class AnswerSubmitRequest(BaseModel):
    answer_text: str = Field(..., min_length=1, description="Candidate response text or transcribed speech")


class QuestionOut(BaseModel):
    id: int
    question_number: int
    question_text: str
    topic: str
    difficulty_level: str
    total_questions: int


class CriteriaScores(BaseModel):
    technical_accuracy: float = Field(..., ge=0, le=10)
    clarity_and_communication: float = Field(..., ge=0, le=10)
    completeness: float = Field(..., ge=0, le=10)
    structure: float = Field(..., ge=0, le=10)


class FeedbackOut(BaseModel):
    score: float = Field(..., ge=0, le=10)
    strengths: List[str]
    improvements: List[str]
    model_answer: str
    criteria_scores: CriteriaScores
    coaching_tip: Optional[str] = None
    how_to_say_it_right: Optional[str] = None
    what_was_missing_or_incorrect: Optional[str] = None
    phrasing_guide: Optional[List[str]] = None
    recovery_tip: Optional[str] = None


class AnswerSubmitResponse(BaseModel):
    session_id: int
    question_id: int
    feedback: FeedbackOut
    next_question: Optional[QuestionOut] = None
    is_completed: bool


class QuestionDetail(BaseModel):
    id: int
    question_number: int
    question_text: str
    topic: str
    difficulty_level: str
    user_answer: Optional[str] = None
    score: Optional[float] = None
    feedback: Optional[Any] = None
    created_at: datetime
    answered_at: Optional[datetime] = None


class InterviewSessionDetail(BaseModel):
    id: int
    job_role: str
    job_description: Optional[str] = None
    experience_level: str
    interview_type: str
    difficulty: str
    question_count: int
    status: str
    overall_score: Optional[float] = None
    summary_report: Optional[Any] = None
    current_question: Optional[QuestionOut] = None
    questions: List[QuestionDetail] = []
    created_at: datetime
    completed_at: Optional[datetime] = None


class InterviewHistoryItem(BaseModel):
    id: int
    job_role: str
    interview_type: str
    difficulty: str
    experience_level: str
    status: str
    overall_score: Optional[float] = None
    question_count: int
    answered_questions: int
    created_at: datetime
    completed_at: Optional[datetime] = None


class InterviewHistoryResponse(BaseModel):
    sessions: List[InterviewHistoryItem]
    total_completed: int
    average_score: Optional[float] = None
    top_roles: List[str] = []
