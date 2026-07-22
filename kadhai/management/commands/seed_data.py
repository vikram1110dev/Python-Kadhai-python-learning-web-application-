import os
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from kadhai.models import Lesson, Quiz, ChatbotResponse

class Command(BaseCommand):
    help = "Seeds initial Python Kadhai curriculum and Chitti bot responses from JSON fixture into database"

    def handle(self, *args, **options):
        fixture_path = os.path.join(settings.BASE_DIR, 'kadhai', 'fixtures', 'initial_data.json')
        if not os.path.exists(fixture_path):
            self.stderr.write(self.style.ERROR(f"Fixture file not found at: {fixture_path}"))
            return

        self.stdout.write(self.style.WARNING(f"Loading data from JSON fixture: {fixture_path}"))
        with open(fixture_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        lessons_data = data.get("lessons", [])
        chatbot_responses = data.get("chatbot_meme_responses", [])
        default_responses = data.get("chatbot_default_responses", [])

        # Seed Lessons & Quizzes
        for idx, item in enumerate(lessons_data, start=1):
            lesson, created = Lesson.objects.update_or_create(
                topic_id=item["topic_id"],
                defaults={
                    "title": item["title"],
                    "subtitle": item["subtitle"],
                    "indicator": item["indicator"],
                    "tanglish_exp": item["tanglish_exp"],
                    "english_exp": item["english_exp"],
                    "initial_code": item["initial_code"],
                    "expected_output": item["expected_output"],
                    "order": item.get("order", idx)
                }
            )

            q_data = item.get("quiz", {})
            if q_data:
                Quiz.objects.update_or_create(
                    lesson=lesson,
                    defaults={
                        "question": q_data["question"],
                        "options": q_data["options"],
                        "correct_index": q_data["correct_index"],
                        "correct_headline": q_data["correct_headline"],
                        "correct_text": q_data["correct_text"],
                        "correct_svg": q_data["correct_svg"],
                        "incorrect_headline": q_data["incorrect_headline"],
                        "incorrect_text": q_data["incorrect_text"],
                        "incorrect_svg": q_data["incorrect_svg"],
                    }
                )
            self.stdout.write(self.style.SUCCESS(f"Saved Lesson & Quiz: {lesson.title}"))

        # Seed Chatbot Keyword Responses
        ChatbotResponse.objects.all().delete()
        for item in chatbot_responses:
            ChatbotResponse.objects.create(
                keywords=item["keywords"],
                response_text=item["response"],
                is_default_fallback=False
            )

        # Seed Chatbot Default Fallbacks
        for text in default_responses:
            ChatbotResponse.objects.create(
                keywords=[],
                response_text=text,
                is_default_fallback=True
            )

        # Create default superuser if not exists
        from django.contrib.auth.models import User
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write(self.style.SUCCESS("Created admin superuser: admin / admin123"))

        self.stdout.write(self.style.SUCCESS("Successfully seeded all database items from JSON fixture!"))
