import re
import os
import math
import json
import random
import urllib.request
import urllib.parse
from django.conf import settings
from .models import Lesson, ChatbotResponse

class RAGEngine:
    """
    Retrieval-Augmented Generation (RAG) Engine for Chitti 3.0.
    1. Retrieves relevant curriculum context (Lessons & Meme DB) via semantic vector term scoring.
    2. Augments prompt with retrieved context & Chitti Tanglish persona.
    3. Generates response via Gemini LLM API (if key available) or Offline RAG Synthesizer.
    """

    @staticmethod
    def _tokenize(text):
        if not text:
            return []
        # Clean HTML tags and strip non-alphanumeric chars
        clean_text = re.sub(r'<[^>]+>', ' ', text)
        words = re.findall(r'\w+', clean_text.lower())
        # Filter tiny stopwords
        stopwords = {'the', 'a', 'an', 'in', 'on', 'of', 'for', 'to', 'and', 'or', 'is', 'it', 'naan', 'thaan'}
        return [w for w in words if w not in stopwords and len(w) > 1]

    @classmethod
    def retrieve_context(cls, user_query, top_k=2):
        query_tokens = cls._tokenize(user_query)
        if not query_tokens:
            return [], None

        documents = []

        # Index Lesson database records
        lessons = Lesson.objects.all()
        for lesson in lessons:
            doc_text = f"{lesson.title} {lesson.subtitle} {lesson.tanglish_exp} {lesson.english_exp} {lesson.initial_code}"
            doc_tokens = cls._tokenize(doc_text)
            documents.append({
                "type": "lesson",
                "id": lesson.topic_id,
                "title": f"{lesson.indicator}: {lesson.title}",
                "subtitle": lesson.subtitle,
                "tanglish_exp": lesson.tanglish_exp,
                "english_exp": lesson.english_exp,
                "initial_code": lesson.initial_code,
                "tokens": doc_tokens,
                "raw_text": doc_text
            })

        # Index Chatbot Meme database records
        responses = ChatbotResponse.objects.filter(is_default_fallback=False)
        for resp in responses:
            kw_str = " ".join(resp.keywords) if isinstance(resp.keywords, list) else str(resp.keywords)
            doc_text = f"{kw_str} {resp.response_text}"
            doc_tokens = cls._tokenize(doc_text)
            documents.append({
                "type": "meme_response",
                "id": f"resp_{resp.id}",
                "title": "Meme Response DB",
                "response_text": resp.response_text,
                "tokens": doc_tokens,
                "raw_text": doc_text
            })

        # Score documents based on TF-IDF term overlap & match boost
        scored_docs = []
        for doc in documents:
            score = 0.0
            doc_tokens_set = set(doc["tokens"])
            for q_tok in query_tokens:
                if q_tok in doc_tokens_set:
                    # Term frequency score
                    tf = doc["tokens"].count(q_tok)
                    score += (1.0 + math.log(tf)) * 2.0
                # Direct substring match boost
                if q_tok in doc["raw_text"].lower():
                    score += 1.5

            if score > 0:
                scored_docs.append((score, doc))

        # Sort by relevance score descending
        scored_docs.sort(key=lambda x: x[0], reverse=True)

        retrieved_items = [item[1] for item in scored_docs[:top_k]]
        primary_source = retrieved_items[0]["title"] if retrieved_items and retrieved_items[0]["type"] == "lesson" else None

        return retrieved_items, primary_source

    @classmethod
    def _call_gemini_api(cls, prompt):
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return None

        models = ["gemini-2.0-flash", "gemini-1.5-flash"]
        for model_name in models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                payload = {
                    "contents": [
                        {
                            "parts": [{"text": prompt}]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 450
                    }
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=6) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    candidates = res_data.get('candidates', [])
                    if candidates:
                        parts = candidates[0].get('content', {}).get('parts', [])
                        if parts:
                            text_out = parts[0].get('text', '').strip()
                            if text_out:
                                return text_out
            except Exception as e:
                print(f"Gemini API model {model_name} call failed: {e}")
                continue

        return None

    @classmethod
    def generate_rag_response(cls, user_query):
        if not user_query.strip():
            return {
                "reply": "Kelvi thappu boss! Message empty-a iruku.",
                "source": None
            }

        retrieved_context, primary_source = cls.retrieve_context(user_query, top_k=2)

        # Build Context Summary for Prompt
        context_str = ""
        for idx, doc in enumerate(retrieved_context, 1):
            if doc["type"] == "lesson":
                context_str += f"\n[Context {idx} - Lesson: {doc['title']}]\nSubtitle: {doc['subtitle']}\nTanglish Explanation: {doc['tanglish_exp']}\nCode Example:\n{doc['initial_code']}\n"
            else:
                context_str += f"\n[Context {idx} - Meme Response]\nResponse: {doc['response_text']}\n"

        # Persona System Prompt
        system_persona = (
            "You are Chitti 3.0 (Speed 1 Terahertz, Memory 1 Zettabyte), a friendly, energetic Python coding chatbot tutor for 'Python Kadhai'. "
            "You explain Python programming concepts in funny Tanglish (Tamil + English) using famous Tamil movie meme dialogues (Vadivelu, Goundamani, Senthil, Vivekh, Rajini). "
            "Keep your responses concise, clear, and humorous with HTML formatting like <b>, <i>, <code>."
        )

        prompt = f"{system_persona}\n\nRetrieved Knowledge Context:\n{context_str if context_str else 'No specific lesson matched.'}\n\nUser Question: {user_query}\n\nChitti RAG Response:"

        # Attempt Gemini API Generation
        ai_reply = cls._call_gemini_api(prompt)
        if ai_reply:
            return {
                "reply": ai_reply,
                "source": primary_source
            }

        # Offline RAG Synthesizer (Zero External Dependencies Fallback)
        if retrieved_context:
            doc = retrieved_context[0]
            if doc["type"] == "lesson":
                reply = (
                    f"Vanakkam! 🤖 <b>{doc['title']}</b> ({doc['subtitle']}) pathi ketrukeenga!\n\n"
                    f"{doc['tanglish_exp']}\n\n"
                    f"<b>Example Code Snippet:</b>\n<code style='background:rgba(255,255,255,0.1); padding:0.3rem 0.6rem; display:block; margin-top:0.3rem; border-radius:6px;'>{doc['initial_code']}</code>"
                )
            else:
                reply = doc["response_text"]
        else:
            fallbacks = list(ChatbotResponse.objects.filter(is_default_fallback=True))
            if fallbacks:
                chosen = random.choice(fallbacks)
                reply = chosen.response_text
            else:
                reply = "Building-u strong-u, basement-u weak-u! Kelvi thappu nu nenaikaren. Python variables, loops, conditionals or functions pathi kelunga boss! 😅"

        return {
            "reply": reply,
            "source": primary_source
        }
