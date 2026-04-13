
STACK — Django 6.1.10, Python 3.12, PostgreSQL 16, Redis 8.2.1

CONVENTIONS —follow current folder structure

SECURITY RULES 
- "No secrets in frontend code"
- "All routes require auth middleware unless marked public"
- "Validate all inputs with Zod before processing"
- "Never return raw DB objects in responses"

OUTPUT QUALITY
- "Always include error handling"
- "Always include loading and error states"
- "Write tests for service layer functions"

RULES (global, in settings)
These apply across all projects. Mine include:
- "Always use async/await not .then chains"
- "Prefer const. Never use var."
- "Add error handling to every async operation"

CONTEXT MANAGEMENT
- Use 
@file
 for specific file context, not 
@codebase
 unless you need architecture-level understanding
- One feature per Composer session. Don't mix concerns.

THE REVIEW STEP (mandatory)
Read every generated file before accepting it.