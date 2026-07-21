from django.contrib import admin
from .models import Lesson, Quiz, ChatbotResponse

class QuizInline(admin.StackedInline):
    model = Quiz
    can_delete = False

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('indicator', 'title', 'subtitle', 'topic_id', 'order')
    search_fields = ('title', 'subtitle', 'tanglish_exp', 'english_exp')
    ordering = ('order',)
    inlines = [QuizInline]

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('lesson', 'question', 'correct_index')

@admin.register(ChatbotResponse)
class ChatbotResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'is_default_fallback', 'response_snippet', 'keywords_list')
    list_filter = ('is_default_fallback',)
    search_fields = ('response_text',)

    def response_snippet(self, obj):
        return obj.response_text[:60] + ("..." if len(obj.response_text) > 60 else "")
    response_snippet.short_description = "Response"

    def keywords_list(self, obj):
        if isinstance(obj.keywords, list):
            return ", ".join(obj.keywords)
        return str(obj.keywords)
    keywords_list.short_description = "Keywords"
