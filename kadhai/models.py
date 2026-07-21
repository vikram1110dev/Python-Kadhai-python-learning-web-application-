from django.db import models

class Lesson(models.Model):
    topic_id = models.CharField(max_length=50, unique=True, help_text="Unique identifier e.g. 'variables'")
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=200)
    indicator = models.CharField(max_length=50, help_text="e.g. 'Topic 1'")
    tanglish_exp = models.TextField(help_text="Tanglish explanation with HTML formatting")
    english_exp = models.TextField(help_text="English explanation with HTML formatting")
    initial_code = models.TextField(blank=True, default='')
    expected_output = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.indicator}: {self.title}"


class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')
    question = models.TextField()
    options = models.JSONField(default=list, help_text="List of quiz option strings")
    correct_index = models.PositiveIntegerField(default=0)
    
    # Correct Meme Reaction
    correct_headline = models.CharField(max_length=200)
    correct_text = models.TextField()
    correct_svg = models.TextField(help_text="SVG HTML code for correct reaction")
    
    # Incorrect Meme Reaction
    incorrect_headline = models.CharField(max_length=200)
    incorrect_text = models.TextField()
    incorrect_svg = models.TextField(help_text="SVG HTML code for incorrect reaction")

    class Meta:
        verbose_name_plural = "Quizzes"

    def __str__(self):
        return f"Quiz for {self.lesson.title}"


class ChatbotResponse(models.Model):
    keywords = models.JSONField(default=list, blank=True, help_text="List of trigger keywords")
    response_text = models.TextField()
    is_default_fallback = models.BooleanField(default=False, help_text="Check if this is a random fallback response")

    class Meta:
        verbose_name_plural = "Chatbot Responses"

    def __str__(self):
        if self.is_default_fallback:
            return f"Fallback: {self.response_text[:40]}..."
        return f"Meme Bot Keywords: {', '.join(self.keywords[:3]) if isinstance(self.keywords, list) else self.keywords}"
