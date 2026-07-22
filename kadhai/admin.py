from django.contrib import admin
from django.utils.html import format_html
from .models import Lesson, Quiz, ChatbotResponse

class QuizInline(admin.StackedInline):
    model = Quiz
    can_delete = False
    fieldsets = (
        ("Question & Options", {
            "fields": ("question", "options", "correct_index")
        }),
        ("Correct Reaction Meme", {
            "fields": ("correct_headline", "correct_text", "correct_svg")
        }),
        ("Incorrect Reaction Meme", {
            "fields": ("incorrect_headline", "incorrect_text", "incorrect_svg")
        }),
    )

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('order', 'indicator', 'title', 'subtitle', 'topic_id', 'has_quiz')
    list_display_links = ('indicator', 'title')
    list_editable = ('order',)
    search_fields = ('title', 'subtitle', 'tanglish_exp', 'english_exp', 'topic_id')
    ordering = ('order', 'id')
    inlines = [QuizInline]

    fieldsets = (
        ("Topic Metadata", {
            "fields": ("topic_id", "indicator", "title", "subtitle", "order")
        }),
        ("Bilingual Curriculum Content", {
            "fields": ("tanglish_exp", "english_exp")
        }),
        ("Interactive Playground Setup", {
            "fields": ("initial_code", "expected_output")
        }),
    )

    def has_quiz(self, obj):
        return hasattr(obj, 'quiz')
    has_quiz.boolean = True
    has_quiz.short_description = "Quiz Attached"


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('lesson', 'question_snippet', 'correct_index', 'correct_headline')
    search_fields = ('question', 'correct_headline', 'incorrect_headline')

    fieldsets = (
        ("Lesson Link & Question", {
            "fields": ("lesson", "question", "options", "correct_index")
        }),
        ("Correct Answer Reaction (Meme)", {
            "fields": ("correct_headline", "correct_text", "correct_svg")
        }),
        ("Incorrect Answer Reaction (Meme)", {
            "fields": ("incorrect_headline", "incorrect_text", "incorrect_svg")
        }),
    )

    def question_snippet(self, obj):
        text = obj.question.replace('<br>', ' ')
        return text[:60] + ("..." if len(text) > 60 else "")
    question_snippet.short_description = "Question"


@admin.register(ChatbotResponse)
class ChatbotResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'is_default_fallback', 'keywords_summary', 'response_snippet')
    list_filter = ('is_default_fallback',)
    search_fields = ('response_text', 'keywords')

    fieldsets = (
        ("Trigger Configuration", {
            "fields": ("is_default_fallback", "keywords")
        }),
        ("Chitti Response Text (HTML Allowed)", {
            "fields": ("response_text",)
        }),
    )

    def response_snippet(self, obj):
        return obj.response_text[:70] + ("..." if len(obj.response_text) > 70 else "")
    response_snippet.short_description = "Response Text"

    def keywords_summary(self, obj):
        if obj.is_default_fallback:
            return format_html('<span style="color: #94a3b8; font-style: italic;">[Fallback Response]</span>')
        if isinstance(obj.keywords, list):
            return ", ".join(obj.keywords[:5]) + (f" (+{len(obj.keywords)-5} more)" if len(obj.keywords) > 5 else "")
        return str(obj.keywords)
    keywords_summary.short_description = "Trigger Keywords"
