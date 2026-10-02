import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Domain Knowledge Base for Common and Specialized Domains
# ---------------------------------------------------------------------------
DOMAIN_CONCEPTS = {
    "software": {
        "topics": ["Data Structures & Algorithms", "API Design & REST", "System Architecture", "Concurrency & Threading", "Testing & CI/CD", "Databases & Indexing", "Clean Code & Design Patterns", "Security & OWASP"],
        "keywords": ["time complexity", "scalability", "caching", "idempotency", "microservices", "unit tests", "indexes", "async", "modularity", "error handling"]
    },
    "frontend": {
        "topics": ["React / Framework Architecture", "State Management & Reactivity", "Web Performance & Core Web Vitals", "CSS & Responsive Layouts", "Accessibility (a11y)", "Browser Rendering Lifecycle", "API Integration & Error Boundaries"],
        "keywords": ["virtual dom", "component lifecycle", "hooks", "memoization", "bundle size", "aria", "repaint/reflow", "optimistic updates", "css grid/flexbox"]
    },
    "backend": {
        "topics": ["API Design & Serialization", "Database Normalization & Query Optimization", "Caching Strategies (Redis/Memcached)", "Message Queues & Event-Driven Systems", "Authentication & Authorization", "Distributed Systems & Scalability", "Resilience & Circuit Breakers"],
        "keywords": ["acid transactions", "sharding", "jwt/oauth", "pub/sub", "kafka/rabbitmq", "connection pooling", "rate limiting", "latency", "load balancer"]
    },
    "data": {
        "topics": ["Data Pipeline Engineering & ETL", "SQL & Query Performance", "Data Modeling & Warehousing", "Feature Engineering", "Model Evaluation & Metrics", "Statistical Significance", "Big Data Processing (Spark/Flink)"],
        "keywords": ["star schema", "joins & indexes", "parquet", "overfitting", "precision/recall", "p-value", "cross-validation", "null imputation", "pipeline orchestration"]
    },
    "machine learning": {
        "topics": ["Supervised vs Unsupervised Learning", "Neural Network Architecture & Training", "Loss Functions & Optimization", "Overfitting Prevention & Regularization", "Model Deployment & Monitoring (MLOps)", "Transformers & LLMs", "Feature Selection"],
        "keywords": ["gradient descent", "backpropagation", "learning rate", "dropout", "embeddings", "attention mechanism", "inference latency", "data drift", "hyperparameters"]
    },
    "devops": {
        "topics": ["Containerization & Docker", "Kubernetes Orchestration", "CI/CD Pipelines", "Infrastructure as Code (Terraform)", "Cloud Infrastructure (AWS/GCP/Azure)", "Observability & Monitoring", "Security & Secrets Management"],
        "keywords": ["containers", "helm", "pods & services", "zero-downtime deployment", "prometheus/grafana", "gitops", "iam roles", "slos/slas", "idempotent scripts"]
    },
    "product": {
        "topics": ["User Research & Pain Point Discovery", "Prioritization Frameworks (RICE/MoSCoW)", "Product Roadmapping & Strategy", "Metrics Definition (AARRR/North Star)", "A/B Testing & Experimentation", "Cross-Functional Collaboration", "Go-To-Market Strategy"],
        "keywords": ["user empathy", "trade-offs", "mvp", "retention", "conversion funnels", "stakeholder management", "feedback loops", "kpis", "agile sprints"]
    },
    "behavioral": {
        "topics": ["Conflict Resolution & Team Dynamics", "Overcoming Technical Setbacks", "Leadership & Mentorship", "Handling Tight Deadlines & Pressure", "Cross-Department Collaboration", "Prioritization & Time Management", "Feedback & Adaptability"],
        "keywords": ["situation", "task", "action", "result", "stakeholders", "active listening", "compromise", "ownership", "reflection", "impact"]
    },
    "system design": {
        "topics": ["High-Level Architecture & Requirements", "Capacity Estimation & Bottlenecks", "Data Storage & Database Choices", "Caching & CDN Tiering", "Load Balancing & Auto-scaling", "Fault Tolerance & Disaster Recovery", "Consistent Hashing & Partitioning"],
        "keywords": ["throughput", "availability vs consistency (cap)", "sharding", "read-heavy vs write-heavy", "replication", "single point of failure", "message brokers"]
    }
}


def _detect_primary_domain(role: str, interview_type: str) -> str:
    r = role.lower()
    t = interview_type.lower()
    if "system design" in t:
        return "system design"
    if t in ["hr", "behavioral", "managerial"]:
        return "behavioral"
    if any(k in r for k in ["front", "react", "vue", "angular", "ui", "web dev"]):
        return "frontend"
    if any(k in r for k in ["ml", "machine learning", "deep learning", "ai", "artificial intelligence"]):
        return "machine learning"
    if any(k in r for k in ["data", "analytics", "business intelligence", "bi"]):
        return "data"
    if any(k in r for k in ["devops", "sre", "cloud", "infra", "kubernetes", "platform"]):
        return "devops"
    if any(k in r for k in ["product", "project manager", "scrum", "agile"]):
        return "product"
    if any(k in r for k in ["back", "api", "node", "python", "golang", "java", "django", "fastapi", "spring"]):
        return "backend"
    return "software"


# ---------------------------------------------------------------------------
# Prompt Engineering & Question Generation
# ---------------------------------------------------------------------------

def generate_first_question(
    job_role: str,
    job_description: Optional[str],
    experience_level: str,
    interview_type: str,
    difficulty: str,
) -> Dict[str, Any]:
    """Generates the opening interview question tailored to role, type, and experience level."""
    domain = _detect_primary_domain(job_role, interview_type)
    exp = experience_level.lower()
    itype = interview_type.lower()

    if itype in ["hr", "behavioral"]:
        q_text = (
            f"Welcome to your interview for the {job_role} position. To start off, please introduce yourself, "
            f"highlighting your background and what motivated you to pursue this {job_role} opportunity."
        )
        topic = "Introduction & Motivation"
        keywords = ["background", "motivation", "strengths", "experience", "cultural fit", "goals"]
    elif itype == "system design":
        if "senior" in exp:
            q_text = (
                f"As a Senior {job_role}, walk me through how you would architect a high-throughput, distributed notification system "
                f"that needs to deliver millions of real-time alerts with near-zero latency and high availability."
            )
        else:
            q_text = (
                f"For this {job_role} system design exercise, how would you design a scalable URL shortener service (like Bitly)? "
                f"Walk me through your requirements, data model, and API endpoints."
            )
        topic = "System Design & Scalability"
        keywords = ["scale", "architecture", "database", "caching", "throughput", "availability", "trade-offs"]
    elif itype == "coding":
        q_text = (
            f"In the context of {job_role}, explain how you would detect and handle memory leaks or algorithmic bottlenecks in an application. "
            f"What tools and data structures would you leverage to measure and optimize performance?"
        )
        topic = "Algorithms & Performance Optimization"
        keywords = ["time complexity", "space complexity", "profiling", "data structures", "memory management", "optimization"]
    elif itype == "managerial":
        q_text = (
            f"As a {job_role}, tell me about a time when you had to manage conflicting technical priorities between stakeholders or team members. "
            f"How did you reach alignment and keep delivery on track?"
        )
        topic = "Stakeholder Management & Leadership"
        keywords = ["stakeholders", "priorities", "communication", "conflict resolution", "delivery", "trade-offs"]
    else:
        # Technical / Mixed
        if exp in ["fresher", "junior"]:
            q_text = (
                f"As an entry-level candidate for the {job_role} role, can you explain the core foundational concepts, "
                f"tools, or frameworks you have worked with, and how you approach debugging an unfamiliar issue in a project?"
            )
            topic = "Core Fundamentals & Problem Solving"
            keywords = ["fundamentals", "syntax", "debugging", "problem solving", "learning agility", "tools"]
        elif exp == "senior":
            q_text = (
                f"As an experienced {job_role}, how do you approach architectural trade-offs between speed of delivery and "
                f"long-term maintainability/scalability? Can you provide a concrete example from your past technical projects?"
            )
            topic = "Architecture & Engineering Trade-offs"
            keywords = ["trade-offs", "scalability", "tech debt", "maintainability", "architecture", "best practices"]
        else:
            q_text = (
                f"Can you explain the end-to-end lifecycle of a typical project or feature you built as a {job_role}? "
                f"Walk me through your design, implementation, testing, and deployment considerations."
            )
            topic = "Technical Lifecycle & Implementation"
            keywords = ["architecture", "implementation", "testing", "deployment", "design patterns", "scalability"]

    # Incorporate JD skills if provided
    if job_description and len(job_description.strip()) > 20:
        jd_words = [w.strip(".,;:()") for w in job_description.split() if len(w) > 4 and w.isalnum()]
        if jd_words:
            keywords.extend(jd_words[:5])

    return {
        "question_number": 1,
        "question_text": q_text,
        "topic": topic,
        "difficulty_level": difficulty if difficulty != "adaptive" else "medium",
        "expected_keywords": list(set(keywords)),
    }


def generate_adaptive_next_question(
    job_role: str,
    job_description: Optional[str],
    experience_level: str,
    interview_type: str,
    difficulty: str,
    current_question_number: int,
    previous_question_text: str,
    previous_user_answer: str,
    previous_score: float,
    detected_weakness: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates an adaptive subsequent question based on candidate's performance on the prior question.
    If candidate performed poorly (score < 6), asks a clarifying/remedial follow-up.
    If candidate excelled (score >= 8), elevates complexity.
    """
    next_num = current_question_number + 1
    domain = _detect_primary_domain(job_role, interview_type)
    topics = DOMAIN_CONCEPTS.get(domain, DOMAIN_CONCEPTS["software"])["topics"]
    topic_index = (next_num - 1) % len(topics)
    current_topic = topics[topic_index]

    # Adaptive difficulty calculation
    if difficulty == "adaptive":
        if previous_score >= 8.0:
            calc_diff = "hard"
        elif previous_score <= 5.5:
            calc_diff = "easy"
        else:
            calc_diff = "medium"
    else:
        calc_diff = difficulty

    # Role-specific question bank / dynamic templates
    if interview_type.lower() in ["hr", "behavioral"]:
        scenarios = [
            (
                f"Describe a challenging situation in your work as a {job_role} where a project deadline was at risk or specifications changed abruptly. "
                f"What specific actions did you take to mitigate the risk and what was the outcome?",
                "Adaptability & Project Delivery"
            ),
            (
                f"Can you share an instance where you disagreed with a colleague or manager regarding a technical direction or decision for {job_role}? "
                f"How did you articulate your viewpoint and what was the resolution?",
                "Constructive Disagreement & Collaboration"
            ),
            (
                f"Tell me about a time you made a mistake or experienced an outage/failure in a {job_role} deliverable. "
                f"How did you diagnose the issue, communicate with stakeholders, and prevent it from recurring?",
                "Accountability & Post-Mortem Learning"
            ),
            (
                f"In your capacity as a {job_role}, how do you prioritize competing deadlines across different features or team requests? "
                f"Give an example of how you said 'no' or renegotiated a delivery timeline.",
                "Prioritization & Boundary Setting"
            )
        ]
        chosen_idx = (next_num - 2) % len(scenarios)
        q_text, topic = scenarios[chosen_idx]
        keywords = ["situation", "task", "action", "result", "communication", "impact"]
    else:
        # Technical / System / Domain Questions
        if previous_score < 6.0 and detected_weakness:
            # Remedial / follow-up pivot
            q_text = (
                f"Touching on what you mentioned earlier regarding {detected_weakness}, let's drill down into the fundamentals. "
                f"In a production {job_role} setup, how would you systematically diagnose and verify this component to ensure stability?"
            )
            topic = f"Deep Dive: {detected_weakness.title()}"
            keywords = ["troubleshooting", "verification", "root cause", "monitoring", "fundamentals"]
        elif calc_diff == "hard":
            q_text = (
                f"Let's explore a complex scenario for a {job_role}: Suppose your service experiences an unexpected 10x traffic spike "
                f"causing database connection exhaustion and cascading latency. How would you redesign the {current_topic} layer "
                f"using caching, circuit breakers, or asynchronous processing to ensure resilience?"
            )
            topic = current_topic
            keywords = ["circuit breaker", "caching", "rate limiting", "resilience", "concurrency", "trade-offs"]
        elif calc_diff == "easy":
            q_text = (
                f"Let's cover {current_topic} for a {job_role}. What are the primary responsibilities and best practices "
                f"associated with this area, and how do you ensure code readability and maintainability when writing solutions for it?"
            )
            topic = current_topic
            keywords = ["best practices", "readability", "maintainability", "standards", "error handling"]
        else:
            # Medium
            q_text = (
                f"Regarding {current_topic} in your role as a {job_role}, how do you handle error handling, logging, and edge cases? "
                f"Walk me through a real-world problem you solved in this domain."
            )
            topic = current_topic
            keywords = ["edge cases", "logging", "monitoring", "validation", "practical experience"]

    return {
        "question_number": next_num,
        "question_text": q_text,
        "topic": topic,
        "difficulty_level": calc_diff,
        "expected_keywords": keywords,
    }


# ---------------------------------------------------------------------------
# NLP & Coaching Evaluation Engine ("How to Say It the Right Way")
# ---------------------------------------------------------------------------

def _build_how_to_say_it_right(
    job_role: str,
    interview_type: str,
    topic: str,
    expected_keywords: List[str],
    user_answer: str,
    score: float,
) -> Dict[str, Any]:
    """
    Constructs spoken coaching scripts, mistake diagnostics, phrasing starters,
    and interview recovery strategies for any candidate response.
    """
    domain = _detect_primary_domain(job_role, interview_type)
    kws = expected_keywords[:3] if expected_keywords else ["trade-offs", "scalability", "best practices"]
    kw1 = kws[0] if len(kws) > 0 else "core architecture"
    kw2 = kws[1] if len(kws) > 1 else "resilience and edge cases"
    kw3 = kws[2] if len(kws) > 2 else "measurable performance"

    ans_lower = user_answer.lower().strip()
    words = ans_lower.split()
    word_count = len(words)

    missing_kws = [k for k in expected_keywords if k.lower() not in ans_lower] if expected_keywords else []

    # 1. Diagnose what was missing or incorrect
    if word_count < 15:
        diagnosis = (
            f"Your response was only {word_count} words and lacked technical substance. "
            f"In an interview, brief one-liners signal hesitation or unfamiliarity with {topic}. "
            f"Interviewers want to hear your step-by-step reasoning, trade-offs, and practical experience."
        )
    elif score < 6.0:
        if missing_kws:
            diagnosis = (
                f"Your answer was off-track or too generic for a {job_role}. "
                f"You missed essential domain concepts like {', '.join(missing_kws[:3])}. "
                f"Rather than stating high-level generalities, specify exact tools, mechanisms, and concrete actions."
            )
        else:
            diagnosis = (
                f"The response lacked a cohesive structure. While you mentioned key ideas, "
                f"you didn't explain the underlying 'how' and 'why' or demonstrate how {topic} operates in production."
            )
    elif score < 8.0:
        diagnosis = (
            f"Good baseline response, but missing senior-level depth. "
            f"To turn this into a top-tier answer, discuss production edge-cases, error-handling strategies, "
            f"and quantify the business or performance outcome."
        )
    else:
        diagnosis = (
            f"Strong and accurate response! You covered key concepts well. "
            f"To achieve perfection, mention alternative approaches you evaluated and why you chose this specific path."
        )

    # 2. Spoken Ideal Answer ("How to Say It Right")
    itype = interview_type.lower()
    if itype in ["hr", "behavioral", "managerial"]:
        spoken_script = (
            f"\"In my work as a {job_role}, I approach this using the STAR method: "
            f"First, the Situation: in a previous project, we faced a critical challenge where {topic.lower()} required immediate attention. "
            f"My Task was to resolve the issue while keeping our team aligned and avoiding timeline slips. "
            f"The Action I took was proactively applying {kw1}, collaborating with stakeholders on trade-offs, and introducing {kw2} to prevent recurring bottlenecks. "
            f"As a Result, we delivered the milestone with zero production regressions and improved overall team velocity by 25%.\""
        )
        phrasing = [
            f"Start with context: 'In my previous project as a {job_role}, the core challenge was...'",
            f"Highlight your action: 'I took the initiative to implement {kw1} because...'",
            f"Show collaboration: 'I communicated trade-offs with stakeholders regarding {kw2}...'",
            "Quantify results: 'Ultimately, this reduced latency by 30% and improved team velocity.'"
        ]
    elif domain == "frontend":
        spoken_script = (
            f"\"When addressing {topic} as a {job_role}, my primary focus is delivering high user responsiveness and maintainable code. "
            f"First, I structure the component architecture with {kw1} to prevent unnecessary re-renders and isolate side effects. "
            f"Second, for reliability and UX, I implement {kw2} along with accessible error states and optimistic updates. "
            f"Finally, I verify performance using Core Web Vitals tooling to ensure fast LCP and minimal interaction latency.\""
        )
        phrasing = [
            f"Open with user & system impact: 'When optimizing {topic}, my priority is responsiveness and low latency.'",
            f"Specify technique: 'I leverage {kw1} to isolate state and prevent redundant renders.'",
            f"Address edge cases: 'To handle asynchronous errors, I implement {kw2} with clear fallback UI.'",
            "Conclude with metrics: 'I track Core Web Vitals to guarantee sub-second interaction times.'"
        ]
    elif domain in ["data", "machine learning"]:
        spoken_script = (
            f"\"For {topic} in a {job_role} role, I look at the full data and modeling lifecycle. "
            f"I start by analyzing data distributions and verifying assumptions using {kw1}. "
            f"When training or transforming pipelines, I guard against data drift and leakage by integrating {kw2}. "
            f"In production, I measure both offline statistical metrics and online inference latency to verify that {kw3} meets business SLAs.\""
        )
        phrasing = [
            f"Structure the pipeline: 'My workflow for {topic} begins with rigorous data validation using {kw1}.'",
            f"Detail mitigation: 'To guard against drift and edge cases, I incorporate {kw2}.'",
            f"Discuss deployment: 'I evaluate both offline accuracy metrics and real-time inference latency.'",
            "Show business alignment: 'This ensures the models deliver reliable predictions at scale.'"
        ]
    elif domain == "devops":
        spoken_script = (
            f"\"When managing {topic} as a {job_role}, I design for idempotency, automation, and zero-downtime reliability. "
            f"I configure our infrastructure and CI/CD pipelines using {kw1}, ensuring version-controlled reproducibility. "
            f"To handle failover and high availability, I establish {kw2} with automated health checks and rollback triggers. "
            f"Finally, I wire in observability alerts so the team has real-time insight into SLAs and error budgets.\""
        )
        phrasing = [
            f"Emphasize reliability: 'I treat {topic} through the lens of zero-downtime and automated recovery.'",
            f"Detail tooling: 'I implement declarative infrastructure using {kw1} for reproducibility.'",
            f"Failure mitigation: 'For high availability, I establish automated rollbacks and {kw2}.'",
            "Monitoring: 'I set up Prometheus/Grafana alerts against our SLO thresholds.'"
        ]
    else:
        # Software / Backend / System Design / General
        spoken_script = (
            f"\"To approach {topic} effectively for a {job_role} position, I break the problem down into architecture, reliability, and scale: "
            f"First, at the architectural layer, I leverage {kw1} to maintain modular separation of concerns and predictable data flow. "
            f"Second, for resilience, I handle edge cases using {kw2}, incorporating retry policies, connection pooling, and structured logging. "
            f"Finally, I address scalability by evaluating trade-offs with {kw3}, validating the system through stress testing under concurrent load.\""
        )
        phrasing = [
            f"Anchor the approach: 'When implementing {topic}, I prioritize separation of concerns and low latency.'",
            f"Technical choice: 'I choose {kw1} over alternatives because it provides predictable scale.'",
            f"Resilience & errors: 'To protect against cascading failures, I integrate {kw2} and circuit breakers.'",
            "Verification: 'I validate the architecture with end-to-end integration tests and benchmark profiling.'"
        ]

    # 3. Live Interview Recovery Strategy
    if score < 6.0:
        recovery = (
            f"Interview Recovery Tip: If you realize you gave an incomplete or incorrect answer during a real interview, "
            f"stay calm and say: 'Actually, let me clarify and refine that thought—in a production environment for {job_role}, "
            f"the more robust approach would be utilizing {kw1}, because...' "
            f"Interviewers respect candidates who demonstrate self-correction, composure, and critical thinking under pressure."
        )
    else:
        recovery = (
            f"Pro Interview Tip: After delivering your answer, invite dialogue by asking: "
            f"'Does that match the architectural depth you're looking for, or would you like me to dive deeper into how I handle {kw2}?' "
            f"This demonstrates collaborative seniority and executive presence."
        )

    return {
        "how_to_say_it_right": spoken_script,
        "what_was_missing_or_incorrect": diagnosis,
        "phrasing_guide": phrasing,
        "recovery_tip": recovery,
    }


def evaluate_response_nlp(
    job_role: str,
    interview_type: str,
    experience_level: str,
    question_text: str,
    topic: str,
    user_answer: str,
    expected_keywords: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Evaluates candidate's spoken or typed answer across 4 key dimensions:
    1. Technical Accuracy & Relevance
    2. Clarity & Communication
    3. Completeness & Depth
    4. Structure (STAR method / Problem-Solving logic)
    Also generates comprehensive 'How to Say It Right' spoken response scripts.
    """
    clean_ans = user_answer.strip()
    words = clean_ans.split()
    word_count = len(words)
    ans_lower = clean_ans.lower()
    expected_kws = expected_keywords or []

    if word_count < 10:
        # Extremely brief answer
        coaching = _build_how_to_say_it_right(
            job_role=job_role,
            interview_type=interview_type,
            topic=topic,
            expected_keywords=expected_kws,
            user_answer=clean_ans,
            score=3.0,
        )
        return {
            "score": 3.0,
            "strengths": ["Acknowledged the question directly."],
            "improvements": [
                "Your answer was very brief. Provide concrete technical details or real-world project context.",
                "Explain the 'why' behind your approach, not just a one-sentence statement.",
                "Structure your response with clear examples and quantifiable outcomes."
            ],
            "model_answer": coaching["how_to_say_it_right"],
            "criteria_scores": {
                "technical_accuracy": 3.5,
                "clarity_and_communication": 4.0,
                "completeness": 2.0,
                "structure": 2.5
            },
            "coaching_tip": "Use the PREP method (Point, Reason, Example, Point) or STAR method to structure your spoken answers.",
            "detected_weakness": topic,
            "how_to_say_it_right": coaching["how_to_say_it_right"],
            "what_was_missing_or_incorrect": coaching["what_was_missing_or_incorrect"],
            "phrasing_guide": coaching["phrasing_guide"],
            "recovery_tip": coaching["recovery_tip"],
        }

    # Keyword match detection
    matched_keywords = []
    for kw in expected_kws:
        if kw.lower() in ans_lower:
            matched_keywords.append(kw)

    # Dimensional evaluations
    # 1. Technical Accuracy & Relevance
    tech_score = 6.0
    if len(matched_keywords) >= 4:
        tech_score += 3.0
    elif len(matched_keywords) >= 2:
        tech_score += 2.0
    elif len(matched_keywords) >= 1:
        tech_score += 1.0

    if word_count > 60:
        tech_score = min(10.0, tech_score + 0.5)

    # 2. Clarity & Communication
    clarity_score = 7.0
    transition_words = ["first", "second", "however", "therefore", "for example", "specifically", "because", "resulted in", "finally"]
    found_transitions = [t for t in transition_words if t in ans_lower]
    if len(found_transitions) >= 2:
        clarity_score += 2.0
    elif len(found_transitions) >= 1:
        clarity_score += 1.0
    clarity_score = min(10.0, max(4.0, clarity_score))

    # 3. Completeness & Depth
    if word_count > 120:
        completeness_score = 8.5
    elif word_count > 70:
        completeness_score = 7.5
    elif word_count > 35:
        completeness_score = 6.0
    else:
        completeness_score = 4.5

    # 4. Structure & Reasoning (STAR method for behavioral, architectural for technical)
    is_behavioral = interview_type.lower() in ["hr", "behavioral"]
    structure_score = 6.5
    star_elements = {
        "situation/context": any(w in ans_lower for w in ["when", "during", "at my", "project", "situation", "context"]),
        "task/problem": any(w in ans_lower for w in ["goal", "challenge", "task", "needed to", "problem", "issue"]),
        "action": any(w in ans_lower for w in ["i decided", "i implemented", "i built", "i led", "we used", "i analyzed", "i resolved"]),
        "result/impact": any(w in ans_lower for w in ["outcome", "result", "improved", "reduced", "delivered", "learned", "success"])
    }
    star_hits = sum(1 for v in star_elements.values() if v)
    if star_hits >= 3:
        structure_score += 2.5
    elif star_hits >= 2:
        structure_score += 1.5

    structure_score = min(10.0, structure_score)

    # Weighted Overall Score
    overall_score = round(
        (tech_score * 0.35) + (clarity_score * 0.25) + (completeness_score * 0.25) + (structure_score * 0.15),
        1
    )
    overall_score = max(1.0, min(10.0, overall_score))

    # Dynamic Strengths
    strengths = []
    if matched_keywords:
        strengths.append(f"Demonstrated technical vocabulary by referencing {', '.join(matched_keywords[:3])}.")
    if word_count >= 60:
        strengths.append("Provided a well-elaborated response with adequate depth.")
    if star_elements["action"]:
        strengths.append("Highlighted specific proactive actions taken.")
    if found_transitions:
        strengths.append("Organized thoughts logically using connective transitions.")
    if not strengths:
        strengths.append("Clear communication and relevant subject familiarity.")

    # Dynamic Improvement Areas
    improvements = []
    if len(matched_keywords) < 2 and expected_kws:
        unmatched = [k for k in expected_kws if k.lower() not in ans_lower][:3]
        if unmatched:
            improvements.append(f"Incorporate key concepts such as: {', '.join(unmatched)}.")
    if word_count < 50:
        improvements.append("Elaborate further on edge cases, implementation specifics, and measurable metrics.")
    if not star_elements["result/impact"]:
        improvements.append("Quantify the final result or business impact (e.g., 'reduced latency by 30%', 'saved 10 hours weekly').")
    if not star_elements["task/problem"]:
        improvements.append("Clarify the core objective or problem constraint right at the beginning.")
    if not improvements:
        improvements.append("Consider detailing potential architectural trade-offs or alternative options you considered.")

    # Generate Spoken Coaching & "How to Say It Right"
    coaching = _build_how_to_say_it_right(
        job_role=job_role,
        interview_type=interview_type,
        topic=topic,
        expected_keywords=expected_kws,
        user_answer=clean_ans,
        score=overall_score,
    )

    detected_weakness = topic if overall_score < 7.0 else None

    return {
        "score": overall_score,
        "strengths": strengths[:3],
        "improvements": improvements[:3],
        "model_answer": coaching["how_to_say_it_right"],
        "criteria_scores": {
            "technical_accuracy": round(tech_score, 1),
            "clarity_and_communication": round(clarity_score, 1),
            "completeness": round(completeness_score, 1),
            "structure": round(structure_score, 1)
        },
        "coaching_tip": coaching["recovery_tip"],
        "detected_weakness": detected_weakness,
        "how_to_say_it_right": coaching["how_to_say_it_right"],
        "what_was_missing_or_incorrect": coaching["what_was_missing_or_incorrect"],
        "phrasing_guide": coaching["phrasing_guide"],
        "recovery_tip": coaching["recovery_tip"],
    }


# ---------------------------------------------------------------------------
# Final Session Summary & Analytics Report
# ---------------------------------------------------------------------------

def generate_session_summary_report(
    job_role: str,
    interview_type: str,
    experience_level: str,
    questions_data: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Generates the comprehensive final report summarizing the entire interview performance."""
    scores = [q.get("score", 6.0) for q in questions_data if q.get("score") is not None]
    if not scores:
        avg_score = 6.0
    else:
        avg_score = round(sum(scores) / len(scores), 1)

    overall_percentage = round(avg_score * 10, 1)

    # Dimensional aggregated scores
    dim_totals = {"technical": 0.0, "communication": 0.0, "completeness": 0.0, "structure": 0.0}
    count = 0
    for q in questions_data:
        fb = q.get("feedback")
        if fb and isinstance(fb, dict) and "criteria_scores" in fb:
            cs = fb["criteria_scores"]
            dim_totals["technical"] += cs.get("technical_accuracy", 6.0)
            dim_totals["communication"] += cs.get("clarity_and_communication", 6.0)
            dim_totals["completeness"] += cs.get("completeness", 6.0)
            dim_totals["structure"] += cs.get("structure", 6.0)
            count += 1

    if count > 0:
        dimensional_scores = {
            "technical_knowledge": round((dim_totals["technical"] / count) * 10, 1),
            "communication_clarity": round((dim_totals["communication"] / count) * 10, 1),
            "depth_and_completeness": round((dim_totals["completeness"] / count) * 10, 1),
            "problem_solving_structure": round((dim_totals["structure"] / count) * 10, 1),
        }
    else:
        dimensional_scores = {
            "technical_knowledge": overall_percentage,
            "communication_clarity": overall_percentage,
            "depth_and_completeness": overall_percentage,
            "problem_solving_structure": overall_percentage,
        }

    # Readiness Verdict
    if overall_percentage >= 85:
        verdict = f"Strong Hire - Outstanding Preparation for {job_role}"
        summary_text = (
            f"You demonstrated excellent command of {job_role} competencies with articulately structured responses, "
            f"strong technical depth, and clear explanations of trade-offs."
        )
    elif overall_percentage >= 70:
        verdict = f"Hire - Solid Candidate for {job_role}"
        summary_text = (
            f"You showed reliable knowledge and good communication for the {job_role} role. "
            f"Focusing on quantifying measurable results and discussing edge cases will elevate your performance to top tier."
        )
    elif overall_percentage >= 55:
        verdict = f"Conditional / Practice Needed for {job_role}"
        summary_text = (
            f"You have a solid initial foundation for {job_role}, but several responses lacked depth or key technical terminology. "
            f"Practicing with the STAR method and studying core architectural patterns is recommended."
        )
    else:
        verdict = f"Needs Substantial Practice for {job_role}"
        summary_text = (
            f"Your responses were too brief or lacked domain-specific specifics for {job_role}. "
            f"Review fundamental concepts and practice answering out loud with detailed examples."
        )

    # Collect strengths and growth areas
    all_strengths = []
    all_improvements = []
    for q in questions_data:
        fb = q.get("feedback")
        if fb and isinstance(fb, dict):
            all_strengths.extend(fb.get("strengths", []))
            all_improvements.extend(fb.get("improvements", []))

    unique_strengths = list(dict.fromkeys(all_strengths))[:4]
    unique_improvements = list(dict.fromkeys(all_improvements))[:4]

    return {
        "overall_score": overall_percentage,
        "readiness_verdict": verdict,
        "summary": summary_text,
        "dimensional_scores": dimensional_scores,
        "key_strengths": unique_strengths or ["Clear spoken cadence", "Relevant background awareness"],
        "growth_areas": unique_improvements or ["Elaborate on edge cases", "Quantify business outcomes"],
        "questions_summary": [
            {
                "question_number": q.get("question_number"),
                "question_text": q.get("question_text"),
                "topic": q.get("topic"),
                "score": round((q.get("score") or 6.0) * 10, 1),
                "user_answer": q.get("user_answer"),
                "model_answer": q.get("feedback", {}).get("model_answer", "") if isinstance(q.get("feedback"), dict) else "",
                "strengths": q.get("feedback", {}).get("strengths", []) if isinstance(q.get("feedback"), dict) else [],
                "improvements": q.get("feedback", {}).get("improvements", []) if isinstance(q.get("feedback"), dict) else [],
                "how_to_say_it_right": q.get("feedback", {}).get("how_to_say_it_right", "") if isinstance(q.get("feedback"), dict) else "",
                "what_was_missing_or_incorrect": q.get("feedback", {}).get("what_was_missing_or_incorrect", "") if isinstance(q.get("feedback"), dict) else "",
                "phrasing_guide": q.get("feedback", {}).get("phrasing_guide", []) if isinstance(q.get("feedback"), dict) else [],
                "recovery_tip": q.get("feedback", {}).get("recovery_tip", "") if isinstance(q.get("feedback"), dict) else "",
            }
            for q in questions_data
        ]
    }
