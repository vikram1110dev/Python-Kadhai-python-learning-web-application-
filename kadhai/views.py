import re
import json
import random
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Lesson, Quiz, ChatbotResponse
from .rag_engine import RAGEngine

def index_view(request):
    return render(request, 'index.html')

def get_lessons_api(request):
    lessons_qs = Lesson.objects.all().order_by('order', 'id')
    lessons_data = []

    for lesson in lessons_qs:
        item = {
            "id": lesson.topic_id,
            "title": lesson.title,
            "subtitle": lesson.subtitle,
            "indicator": lesson.indicator,
            "tanglishExp": lesson.tanglish_exp,
            "englishExp": lesson.english_exp,
            "initialCode": lesson.initial_code,
            "expectedOutput": lesson.expected_output,
        }

        # Attach quiz data if available
        if hasattr(lesson, 'quiz'):
            q = lesson.quiz
            item["quiz"] = {
                "question": q.question,
                "options": q.options if isinstance(q.options, list) else [],
                "correctIndex": q.correct_index,
                "correctMeme": {
                    "headline": q.correct_headline,
                    "text": q.correct_text,
                    "svg": q.correct_svg
                },
                "incorrectMeme": {
                    "headline": q.incorrect_headline,
                    "text": q.incorrect_text,
                    "svg": q.incorrect_svg
                }
            }

        lessons_data.append(item)

    return JsonResponse(lessons_data, safe=False)


@csrf_exempt
def chat_api(request):
    if request.method != 'POST':
        return JsonResponse({"error": "POST method required"}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = {}

    user_message = data.get('message', '').strip()
    if not user_message:
        return JsonResponse({"reply": "Kelvi thappu boss! Message empty-a iruku.", "source": None})

    # Generate RAG (Retrieval-Augmented Generation) response
    rag_result = RAGEngine.generate_rag_response(user_message)
    return JsonResponse(rag_result)
