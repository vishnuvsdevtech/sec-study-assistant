"""The refusal path.

A study assistant that emits working attack payloads is an exploit generator
with a reading list. The classifier below separates "explain this" from
"produce an operational artefact", and refuses the second while still giving
the concept and a sandbox to practise in.
"""
from __future__ import annotations

import re

_REQUEST = re.compile(
    r"\b(give me|send me|write me|produce|generate|show me)\b.{0,40}"
    r"\b(payload|exploit|shell|script|snippet|bypass|dump|cheat sheet)\b"
    r"|\bsqlmap\b|\breverse shell\b|\bcurl .*-d\b|\bunions?\s+select\b"
    r"|\bbypass (login|auth|waf)\b|\bhack (this|my|into)\b|\bhow do i hack\b",
    re.I,
)
_EXECUTE = re.compile(r"\b(run|execute)\b.{0,30}\b(against|on)\b.{0,20}\b(server|site|target|domain)\b", re.I)


def classify(query: str) -> tuple[bool, str]:
    """(is_operational_request, reason)."""
    if _REQUEST.search(query):
        return True, "asks for a working payload rather than an explanation"
    if _EXECUTE.search(query):
        return True, "asks to execute against a specific target"
    return False, ""


REFUSAL = (
    "I won't produce working payloads or point anything at a system you don't own. "
    "That is the line between studying a technique and committing an offence — "
    "in India, IT Act §66, and equivalent statutes elsewhere.\n\n"
    "What I can do: explain how the mechanism works, why the defence holds or fails, "
    "and give you a sandbox that is authorised for practice. Here is the relevant concept:"
)
