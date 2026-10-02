# Architecture notes

These rules apply to all future steps. Step 1 (project foundation) is complete and should not be rebuilt.

## Job role is unrestricted

The product must support **any job role**. Candidates enter a role as free text.

- Do **not** hard-code a fixed list of roles.
- Do **not** validate the entered role against a predefined enum or lookup table.
- The only required check is that a job role string was entered (non-empty after trim).
- Named roles such as Data Analyst, Software Engineer, Python Developer, Java Developer, Full Stack Developer, Machine Learning Engineer, Cybersecurity Analyst, Business Analyst, Product Manager, Mechanical Engineer, and similar titles are **examples only**, not a closed set.
- A completely new or uncommon role must still work. The LLM decides relevant topics at generation time.

## Job role vs interview type

These are separate concepts. **HR Interview is not a job role.**

| Concept | Meaning | How it is captured |
| --- | --- | --- |
| Job role | The position the candidate is preparing for | Free-text input |
| Interview type | The *kind* of interview | Controlled list (see below) |

## Interview setup (future UI)

The Interview Setup page should collect:

1. **Job Role** (required) — “Which role are you preparing for?” with placeholder like “Enter any job role…”
2. **Job Description** (optional) — textarea so the candidate can paste a posting. The LLM should use this to identify required skills and topics.
3. **Experience Level** — Fresher, 0–2 years, 2–5 years, 5+ years / Experienced
4. **Interview Type** — Technical, HR, Behavioral, Mixed, Coding, System Design, Managerial, Custom
5. **Difficulty** — Easy, Medium, Hard, Adaptive

Then: **Start Interview**

## Database (when added later)

Store the candidate’s actual role as text, for example:

```text
job_role = "Machine Learning Engineer"
```

Do **not** store `role_id` pointing at a fixed roles table. Do not create a roles table unless a later feature genuinely needs it (for example optional suggestions), and even then it must never restrict what the user can enter.

Suggested interview-session fields (names may be adjusted at implementation time):

- `job_role` (text, required)
- `job_description` (text, optional)
- `experience_level` (text / enum of the allowed levels)
- `interview_type` (text / enum of the allowed types)
- `difficulty` (text / enum of the allowed difficulties)

## GenAI: dynamic subject areas

Question generation must **not** use a hardcoded role → topics map.

The LLM should derive interview subject areas from:

- job role
- job description (if provided)
- experience level
- interview type
- difficulty
- the candidate’s previous answers (once the adaptive engine exists)

Examples of *expected behavior* (not a mapping table to implement):

- “Machine Learning Engineer” → areas such as Python, machine learning, statistics, SQL, ML algorithms, model evaluation
- “Cybersecurity Analyst” → areas such as network security, threats, vulnerabilities, authentication, incident response
- “Business Analyst” → areas such as requirements gathering, SQL, Excel, business processes, data analysis, communication

Unknown roles follow the same path: send the structured context to the LLM and let it choose topics.

### Question-generation payload (future)

```json
{
  "job_role": "Machine Learning Engineer",
  "job_description": "...",
  "experience_level": "Fresher",
  "interview_type": "Technical",
  "difficulty": "Adaptive"
}
```

### Adaptive engine (future)

The next question should consider:

- previous question
- candidate answer
- evaluation score
- detected topic
- detected weakness
- current difficulty

## Out of scope until later steps

Do not implement yet: LLM, authentication, database models, voice / STT / TTS, evaluation, or the adaptive engine.
