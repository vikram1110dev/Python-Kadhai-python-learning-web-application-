import re
import json
import random
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Lesson, Quiz, ChatbotResponse

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
        return JsonResponse({"reply": "Kelvi thappu boss! Message empty-a iruku."})

    clean_message = user_message.lower()

    # Query meme responses from DB
    meme_responses = ChatbotResponse.objects.filter(is_default_fallback=False)

    for item in meme_responses:
        keywords = item.keywords if isinstance(item.keywords, list) else []
        for keyword in keywords:
            kw = keyword.lower()
            if ' ' in kw:
                has_word = kw in clean_message
            else:
                has_word = bool(re.search(r'\b' + re.escape(kw) + r'\b', clean_message))

            if has_word:
                return JsonResponse({"reply": item.response_text})

    # Fallback to default DB responses
    fallbacks = list(ChatbotResponse.objects.filter(is_default_fallback=True))
    if fallbacks:
        chosen = random.choice(fallbacks)
        reply = chosen.response_text
    else:
        reply = "Building-u strong-u, basement-u weak-u! Kelvi thappu nu nenaikaren. Python topics pathi kelunga boss! 😅"

    return JsonResponse({"reply": reply})
