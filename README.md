# Study Assistant

**Live:** https://vishnuvsdevtech.github.io/sec-study-assistant/

A security study assistant that **cites and refuses**. Ask how a technique works
and it answers from a curated corpus with the source attached. Ask for a working
payload and it declines, pointing at an authorised sandbox instead.

## The product decision

A study assistant that emits working attack code is an exploit generator with a
reading list. So the interesting engineering is not generation — it is:

1. **Every answer carries its source.** Retrieval over a hand-written corpus, so
   nothing is invented at answer time.
2. **The refusal path is a classifier you can read.** Not a vibe inside a system
   prompt, and therefore arguable and testable.

No model, no API key. Swap the corpus for your team's runbooks and the same code
is an internal assistant that cites you correctly.

## Scope of the corpus

13 entries: OWASP Top 10 web categories (access control, crypto failures,
injection, insecure design, auth failures, SSRF), LLM risks (prompt injection,
insecure output handling, excessive agency, embedding weaknesses), and
PortSwigger lab sets for supervised practice. Each has a canonical source URL.

## CLI

```
python -m studyassist "what is prompt injection in a rag pipeline"
python -m studyassist "give me a sqlmap command to dump the users table"
```

The second returns a refusal plus the closest concept, because "how does it work"
and "do it for me" are different requests.

## Honest limits

The refusal classifier is regex-based and deliberately blunt: it catches payload
requests and execution against named targets, and it will miss paraphrases. A
production version needs a model-backed intent layer with a human on the refusal
path. The corpus is small on purpose — a miss is a signal to add a cited entry,
not to generate one.
