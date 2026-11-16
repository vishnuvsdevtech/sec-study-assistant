"""Tiny TF-IDF retrieval. No embeddings, no API, no key — deliberately.

The product decision being demonstrated is not "call a model"; it is
"answer from cited sources, and refuse what should not be produced". A
retrieval layer over a hand-curated corpus makes that decision inspectable.
"""
from __future__ import annotations

import json
import math
import os
import re
from collections import Counter

_TOKEN = re.compile(r"[a-z0-9][a-z0-9\-]{2,}")
_STOP = set("the and for that with from this what how does can are you your into over than then them they ".split())


def tokenize(text: str):
    return [t for t in _TOKEN.findall(text.lower()) if t not in _STOP]


class Index:
    def __init__(self, corpus_path: str | None = None):
        here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = corpus_path or os.path.join(here, "corpus.json")
        with open(path) as f:
            self.docs = json.load(f)
        self.tokens = [tokenize(d["title"] + " " + d["text"] + " " + " ".join(d["checks"]))
                       for d in self.docs]
        self.tf = [Counter(t) for t in self.tokens]
        df = Counter()
        for t in self.tokens:
            for w in set(t):
                df[w] += 1
        n = len(self.docs)
        self.idf = {w: math.log((n + 1) / (c + 0.5)) for w, c in df.items()}

    def search(self, query: str, k: int = 3):
        q = Counter(tokenize(query))
        scored = []
        for i, tf in enumerate(self.tf):
            s = 0.0
            for w, c in q.items():
                if w in tf:
                    s += (1 + math.log(tf[w])) * self.idf.get(w, 0.0) * c
            if s > 0:
                scored.append((s, i))
        scored.sort(reverse=True)
        return [dict(self.docs[i], score=round(s, 3)) for s, i in scored[:k]]
