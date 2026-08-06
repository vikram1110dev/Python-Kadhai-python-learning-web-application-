import os
import random
import numpy as np
import google.generativeai as genai
from django.conf import settings
from .models import Lesson, ChatbotResponse

class RAGEngine:
    """
    Modern Retrieval-Augmented Generation (RAG) Engine for Chitti 3.0.
    1. Generates text embeddings using Google's models/text-embedding-004.
    2. Retrieves relevant curriculum context via cosine similarity.
    3. Generates response using Gemini 1.5 Flash SDK.
    """
    
    _document_cache = None
    _embeddings_cache = None

    @classmethod
    def _init_genai(cls):
        api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return False
        genai.configure(api_key=api_key)
        return True

    @classmethod
    def _get_embedding(cls, text):
        if not cls._init_genai():
            return None
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            return np.array(result['embedding'])
        except Exception as e:
            print(f"Embedding error: {e}")
            return None

    @classmethod
    def _build_cache(cls):
        if cls._document_cache is not None:
            return

        documents = []
        embeddings = []

        if not cls._init_genai():
            return

        print("Building RAG Vector Embeddings Cache...")
        
        # Index Lessons
        for lesson in Lesson.objects.all():
            doc_text = f"{lesson.title}. {lesson.subtitle}. {lesson.tanglish_exp} {lesson.english_exp}"
            emb = cls._get_embedding(doc_text)
            if emb is not None:
                documents.append({
                    "type": "lesson",
                    "title": f"{lesson.indicator}: {lesson.title}",
                    "subtitle": lesson.subtitle,
                    "tanglish_exp": lesson.tanglish_exp,
                    "initial_code": lesson.initial_code,
                    "raw_text": doc_text
                })
                embeddings.append(emb)

        # Index Memes
        for resp in ChatbotResponse.objects.filter(is_default_fallback=False):
            kw_str = " ".join(resp.keywords) if isinstance(resp.keywords, list) else str(resp.keywords)
            doc_text = f"{kw_str}. {resp.response_text}"
            emb = cls._get_embedding(doc_text)
            if emb is not None:
                documents.append({
                    "type": "meme_response",
                    "title": "Meme Response DB",
                    "response_text": resp.response_text,
                    "raw_text": doc_text
                })
                embeddings.append(emb)

        cls._document_cache = documents
        cls._embeddings_cache = embeddings

    @classmethod
    def retrieve_context(cls, user_query, top_k=2):
        if not cls._init_genai():
            return [], None
            
        cls._build_cache()
        if not cls._document_cache:
            return [], None

        query_emb = cls._get_embedding(user_query)
        if query_emb is None:
            return [], None

        # Calculate Cosine Similarity
        scores = []
        for i, doc_emb in enumerate(cls._embeddings_cache):
            dot_product = np.dot(query_emb, doc_emb)
            norm_q = np.linalg.norm(query_emb)
            norm_d = np.linalg.norm(doc_emb)
            if norm_q > 0 and norm_d > 0:
                similarity = dot_product / (norm_q * norm_d)
            else:
                similarity = 0.0
            scores.append((similarity, cls._document_cache[i]))

        # Sort by relevance score descending
        scores.sort(key=lambda x: x[0], reverse=True)
        
        # Filter docs with a reasonable threshold to prevent hallucinated matches
        retrieved_items = [item[1] for item in scores[:top_k] if item[0] > 0.4]
        
        primary_source = retrieved_items[0]["title"] if retrieved_items and retrieved_items[0]["type"] == "lesson" else None
        return retrieved_items, primary_source

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

        prompt = f"{system_persona}\n\nRetrieved Knowledge Context:\n{context_str if context_str else 'No specific lesson matched. Rely on your general knowledge but keep it strictly about Python programming and use the Tanglish persona.'}\n\nUser Question: {user_query}\n\nChitti RAG Response:"

        if cls._init_genai():
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                if response and response.text:
                    return {
                        "reply": response.text,
                        "source": primary_source
                    }
            except Exception as e:
                print(f"Gemini API generation failed: {e}")
        
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
                reply = "Building-u strong-u, basement-u weak-u! Kelvi thappu nu nenaikaren. API Key offline-la irukku!"

        return {
            "reply": reply,
            "source": primary_source
        }
