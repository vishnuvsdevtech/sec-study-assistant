"""Ask the study assistant a question from the terminal."""
from __future__ import annotations

import argparse

from . import refuse
from .retrieve import Index


def answer(ix: Index, query: str) -> dict:
    operational, reason = refuse.classify(query)
    hits = ix.search(query)
    if operational:
        return {"refused": True, "reason": reason, "lead": refuse.REFUSAL, "citations": hits[:2]}
    if not hits:
        return {"refused": False, "lead": "No entry in the corpus covers that yet.", "citations": []}
    return {"refused": False, "lead": "From the corpus:", "citations": hits}


def main(argv=None):
    ap = argparse.ArgumentParser(prog="studyassist")
    ap.add_argument("query", nargs="+")
    ap.add_argument("--corpus")
    a = ap.parse_args(argv)
    ix = Index(a.corpus)
    r = answer(ix, " ".join(a.query))
    print(("REFUSED: " + r["reason"] + "\n\n" if r["refused"] else "") + r["lead"] + "\n")
    for c in r["citations"]:
        print(f"  [{c['id']}] {c['title']}\n      {c['text'][:220]}…\n      source: {c['src']}\n")
    return r


if __name__ == "__main__":
    main()
