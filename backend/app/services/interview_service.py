from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models.interview import InterviewQuestion, InterviewSession
from app.schemas.interview import (
    AnswerSubmitResponse,
    CriteriaScores,
    FeedbackOut,
    InterviewCreateRequest,
    InterviewHistoryItem,
    InterviewHistoryResponse,
    InterviewSessionDetail,
    QuestionDetail,
    QuestionOut,
)
from app.services import llm_engine


def create_interview_session(db: Session, user_id: int, payload: InterviewCreateRequest) -> InterviewSessionDetail:
    # 1. Create the session
    session = InterviewSession(
        user_id=user_id,
        job_role=payload.job_role.strip(),
        job_description=payload.job_description.strip() if payload.job_description else None,
        experience_level=payload.experience_level,
        interview_type=payload.interview_type,
        difficulty=payload.difficulty,
        question_count=payload.question_count,
        status="in_progress",
    )
    db.add(session)
    db.flush()

    # 2. Generate the first question via prompt engineering / NLP
    first_q_data = llm_engine.generate_first_question(
        job_role=session.job_role,
        job_description=session.job_description,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
    )

    first_question = InterviewQuestion(
        session_id=session.id,
        question_number=1,
        question_text=first_q_data["question_text"],
        topic=first_q_data["topic"],
        difficulty_level=first_q_data["difficulty_level"],
        expected_keywords=first_q_data["expected_keywords"],
    )
    db.add(first_question)
    db.commit()
    db.refresh(session)
    db.refresh(first_question)

    return get_session_detail(db, session.id, user_id)


def get_session_detail(db: Session, session_id: int, user_id: int) -> Optional[InterviewSessionDetail]:
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id,
    ).first()

    if not session:
        return None

    questions = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id
    ).order_by(InterviewQuestion.question_number).all()

    # Find the current active question (the first unanswered question)
    current_q_out = None
    if session.status == "in_progress":
        for q in questions:
            if q.user_answer is None:
                current_q_out = QuestionOut(
                    id=q.id,
                    question_number=q.question_number,
                    question_text=q.question_text,
                    topic=q.topic,
                    difficulty_level=q.difficulty_level,
                    total_questions=session.question_count,
                )
                break

    question_details = [
        QuestionDetail(
            id=q.id,
            question_number=q.question_number,
            question_text=q.question_text,
            topic=q.topic,
            difficulty_level=q.difficulty_level,
            user_answer=q.user_answer,
            score=q.score,
            feedback=q.feedback,
            created_at=q.created_at,
            answered_at=q.answered_at,
        )
        for q in questions
    ]

    return InterviewSessionDetail(
        id=session.id,
        job_role=session.job_role,
        job_description=session.job_description,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        difficulty=session.difficulty,
        question_count=session.question_count,
        status=session.status,
        overall_score=session.overall_score,
        summary_report=session.summary_report,
        current_question=current_q_out,
        questions=question_details,
        created_at=session.created_at,
        completed_at=session.completed_at,
    )


def submit_answer(
    db: Session,
    session_id: int,
    user_id: int,
    answer_text: str,
) -> Optional[AnswerSubmitResponse]:
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id,
    ).first()

    if not session or session.status != "in_progress":
        return None

    # Find the current unanswered question
    current_question = db.query(InterviewQuestion).filter(
        InterviewQuestion.session_id == session_id,
        InterviewQuestion.user_answer.is_(None),
    ).order_by(InterviewQuestion.question_number).first()

    if not current_question:
        return None

    # Evaluate the answer using prompt engineering and NLP
    evaluation = llm_engine.evaluate_response_nlp(
        job_role=session.job_role,
        interview_type=session.interview_type,
        experience_level=session.experience_level,
        question_text=current_question.question_text,
        topic=current_question.topic,
        user_answer=answer_text,
        expected_keywords=current_question.expected_keywords or [],
    )

    current_question.user_answer = answer_text
    current_question.score = evaluation["score"]
    current_question.feedback = evaluation
    current_question.answered_at = datetime.now(timezone.utc)
    db.flush()

    is_completed = current_question.question_number >= session.question_count
    next_question_out = None

    if is_completed:
        # Finalize the session and generate the comprehensive performance report
        all_questions = db.query(InterviewQuestion).filter(
            InterviewQuestion.session_id == session_id
        ).order_by(InterviewQuestion.question_number).all()

        questions_data = [
            {
                "question_number": q.question_number,
                "question_text": q.question_text,
                "topic": q.topic,
                "score": q.score,
                "user_answer": q.user_answer,
                "feedback": q.feedback,
            }
            for q in all_questions
        ]

        summary_report = llm_engine.generate_session_summary_report(
            job_role=session.job_role,
            interview_type=session.interview_type,
            experience_level=session.experience_level,
            questions_data=questions_data,
        )

        session.status = "completed"
        session.overall_score = summary_report["overall_score"]
        session.summary_report = summary_report
        session.completed_at = datetime.now(timezone.utc)
    else:
        # Generate the next adaptive question based on previous performance
        next_q_data = llm_engine.generate_adaptive_next_question(
            job_role=session.job_role,
            job_description=session.job_description,
            experience_level=session.experience_level,
            interview_type=session.interview_type,
            difficulty=session.difficulty,
            current_question_number=current_question.question_number,
            previous_question_text=current_question.question_text,
            previous_user_answer=answer_text,
            previous_score=evaluation["score"],
            detected_weakness=evaluation.get("detected_weakness"),
        )

        next_q = InterviewQuestion(
            session_id=session.id,
            question_number=next_q_data["question_number"],
            question_text=next_q_data["question_text"],
            topic=next_q_data["topic"],
            difficulty_level=next_q_data["difficulty_level"],
            expected_keywords=next_q_data["expected_keywords"],
        )
        db.add(next_q)
        db.flush()
        db.refresh(next_q)

        next_question_out = QuestionOut(
            id=next_q.id,
            question_number=next_q.question_number,
            question_text=next_q.question_text,
            topic=next_q.topic,
            difficulty_level=next_q.difficulty_level,
            total_questions=session.question_count,
        )

    db.commit()

    feedback_out = FeedbackOut(
        score=evaluation["score"],
        strengths=evaluation["strengths"],
        improvements=evaluation["improvements"],
        model_answer=evaluation["model_answer"],
        criteria_scores=CriteriaScores(**evaluation["criteria_scores"]),
        coaching_tip=evaluation.get("coaching_tip"),
        how_to_say_it_right=evaluation.get("how_to_say_it_right"),
        what_was_missing_or_incorrect=evaluation.get("what_was_missing_or_incorrect"),
        phrasing_guide=evaluation.get("phrasing_guide"),
        recovery_tip=evaluation.get("recovery_tip"),
    )

    return AnswerSubmitResponse(
        session_id=session.id,
        question_id=current_question.id,
        feedback=feedback_out,
        next_question=next_question_out,
        is_completed=is_completed,
    )


def get_user_history(db: Session, user_id: int) -> InterviewHistoryResponse:
    sessions = db.query(InterviewSession).filter(
        InterviewSession.user_id == user_id
    ).order_by(desc(InterviewSession.created_at)).all()

    items = []
    completed_scores = []
    role_counter: Dict[str, int] = {}

    for s in sessions:
        answered_count = db.query(func.count(InterviewQuestion.id)).filter(
            InterviewQuestion.session_id == s.id,
            InterviewQuestion.user_answer.is_not(None),
        ).scalar() or 0

        items.append(
            InterviewHistoryItem(
                id=s.id,
                job_role=s.job_role,
                interview_type=s.interview_type,
                difficulty=s.difficulty,
                experience_level=s.experience_level,
                status=s.status,
                overall_score=s.overall_score,
                question_count=s.question_count,
                answered_questions=answered_count,
                created_at=s.created_at,
                completed_at=s.completed_at,
            )
        )

        if s.status == "completed" and s.overall_score is not None:
            completed_scores.append(s.overall_score)
            role_counter[s.job_role] = role_counter.get(s.job_role, 0) + 1

    avg_score = round(sum(completed_scores) / len(completed_scores), 1) if completed_scores else None
    sorted_roles = sorted(role_counter.items(), key=lambda x: x[1], reverse=True)
    top_roles = [r[0] for r in sorted_roles[:5]]

    return InterviewHistoryResponse(
        sessions=items,
        total_completed=len(completed_scores),
        average_score=avg_score,
        top_roles=top_roles,
    )
