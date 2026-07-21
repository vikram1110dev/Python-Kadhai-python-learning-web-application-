from django.core.management.base import BaseCommand
from kadhai.models import Lesson, Quiz, ChatbotResponse

LESSONS_DATA = [
    {
        "id": "variables",
        "title": "Variables & Data Types",
        "subtitle": "The Banana Counter (Senthil & Goundamani)",
        "indicator": "Topic 1",
        "tanglishExp": "Goundamani lines up a question: <b>\"Rendu banana enga?\"</b>. In Python, variables are like Senthil's pockets holding values. Senthil pocket-la value store panraaru: <code>bananas = 2</code>. Senthil oru banana saptutaaru, so: <code>bananas = bananas - 1</code>. Variable-na enna theriyuma? Oru data-va store panni vechikra box!",
        "englishExp": "Goundamani asks: <b>\"Where are the two bananas?\"</b>. In Python, variables are named locations used to store data in memory. For example, <code>bananas = 2</code> stores the number 2. When Senthil eats one, <code>bananas = bananas - 1</code> updates the value stored to 1.",
        "initialCode": "# Senthil's Banana variable\nbananas = 2\nbananas_eaten = 1\n\nremaining = bananas - bananas_eaten\nprint(\"Remaining bananas:\")\nprint(remaining)",
        "expectedOutput": "Remaining bananas:\n1",
        "quiz": {
            "question": "If we run this code, what will be stored in the variable 'x'?<br><code style='background:rgba(255,255,255,0.1); padding:0.25rem 0.5rem; display:inline-block; margin-top:0.5rem; border-radius:4px;'>x = 100<br>x = x - 25</code>",
            "options": ["100", "75", "25", "SyntaxError"],
            "correctIndex": 1,
            "correctMeme": {
                "headline": "Correct! Romba fast-ah kandu pudichitiye pa!",
                "text": "Vadivelu: \"Ahaaa, oru ruba kooda kuraiyama 75 ruba! Naan nenaicha maadhiriye panra pa!\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor vadivelu"><div class="actor-face">😎</div></div><div class="meme-dialog dialog-right">Oru ruba kooda kuraiyama correct!</div></div>"""
            },
            "incorrectMeme": {
                "headline": "Aiyo! Calculation thappaache!",
                "text": "Goundamani: \"Rendu banana-la onna saptutu, mathadhu enga da nu ketta, 25-nu solra? Enna da calculation idhu!\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor goundamani"><div class="actor-face">😠</div></div><div class="meme-actor senthil" style="margin-left: 20px;"><div class="actor-face">😅</div></div><div class="meme-dialog dialog-left">Rendu banana enga da?</div><div class="meme-dialog dialog-bottom">Athu... mathadhu logic illa anna!</div></div>"""
            }
        }
    },
    {
        "id": "conditionals",
        "title": "Conditionals (If-Else)",
        "subtitle": "Naanum Rowdy Thaan (Vadivelu)",
        "indicator": "Topic 2",
        "tanglishExp": "Decision points are handled using <code>if</code> and <code>else</code>. Vadivelu rowdy status-a check panraaru. Rowdy template condition: If weapon is True, write: \"Naanum Rowdy Thaan!\", else: \"Sir, naan simple citizen sir!\". Python code structure is very clean, it uses spaces (indentation) instead of curly brackets!",
        "englishExp": "Conditional statements perform different actions based on whether a boolean condition evaluates to True or False. Python uses <code>if</code>, <code>elif</code>, and <code>else</code>. Code blocks are grouped using indentation (4 spaces).",
        "initialCode": "is_rowdy = True\n\nif is_rowdy:\n    print(\"Naanum Rowdy Thaan!\")\nelse:\n    print(\"Sir, naan normal citizen sir!\")",
        "expectedOutput": "Naanum Rowdy Thaan!",
        "quiz": {
            "question": "What will print if <code>is_rowdy = False</code> in the code template above?",
            "options": [
                "Naanum Rowdy Thaan!",
                "Sir, naan normal citizen sir!",
                "Nothing will print",
                "It will throw an error"
            ],
            "correctIndex": 1,
            "correctMeme": {
                "headline": "Correct! Police case-la irundhu escape!",
                "text": "Vadivelu: \"Escape aayitaanda! Naan normal citizen nu solli safe-a poitaan.\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor vadivelu"><div class="actor-face">😏</div></div><div class="meme-dialog dialog-right">Safe-a escape aayitaan!</div></div>"""
            },
            "incorrectMeme": {
                "headline": "Wrong! Police arrest panna poraanga!",
                "text": "Vadivelu: \"Aiyo, rowdy illenu sonnalum build-up koduthu lock aayitiye da!\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor vadivelu"><div class="actor-face">😭</div></div><div class="meme-dialog dialog-bottom">Vandiyile yethungada ivana!</div></div>"""
            }
        }
    },
    {
        "id": "loops",
        "title": "Loops (For & While)",
        "subtitle": "The Endless Tea Shop Tasks (Vivekh & Vadivelu)",
        "indicator": "Topic 3",
        "tanglishExp": "Repeated operations are called Loops. Goundamani Senthil-ku tea loop check panraaru. If a task needs to run 3 times, we use <code>for i in range(3):</code>. Infinite loop potteenga-na system crash aagum, Vadivelu-ku adi thidirnu vizhunde kittu irukum!",
        "englishExp": "Loops are used to iterate over a sequence (list, tuple, string) or repeat actions. A <code>for</code> loop iterates over a range or collection, while a <code>while</code> loop runs as long as a condition is True.",
        "initialCode": "# Repeat the beat 3 times!\nfor i in range(3):\n    print(\"Adi vizhugiathu!\")",
        "expectedOutput": "Adi vizhugiathu!\nAdi vizhugiathu!\nAdi vizhugiathu!",
        "quiz": {
            "question": "How many times will this loop print 'Aiyo'?<br><code style='background:rgba(255,255,255,0.1); padding:0.25rem 0.5rem; display:inline-block; margin-top:0.5rem; border-radius:4px;'>for i in range(5):<br>    print('Aiyo')</code>",
            "options": ["0", "4", "5", "Infinite times"],
            "correctIndex": 2,
            "correctMeme": {
                "headline": "Correct! Exactly 5 times!",
                "text": "Vivekh: \"Innuma indha ooru 5 thadava adi vangumbothu loops-a nambitu iruku? Ha ha!\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor vivek"><div class="actor-face">😂</div></div><div class="meme-dialog dialog-right">Aanandam... vilaiyaadum veedu!</div></div>"""
            },
            "incorrectMeme": {
                "headline": "Wrong loop count!",
                "text": "Vadivelu: \"Valikudhu! Range calculation thappa pochu. Innum extra adi vilugudhe!\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor vadivelu"><div class="actor-face">😵</div></div><div class="meme-dialog dialog-bottom">Ennada 0/4-nu calculation solrae!</div></div>"""
            }
        }
    },
    {
        "id": "functions",
        "title": "Functions",
        "subtitle": "Commanding the Sidekicks (Vadivelu)",
        "indicator": "Topic 4",
        "tanglishExp": "Functions are block of codes that run only when called. Vadivelu instructions-a compile panni oru plan template create panraaru: <code>def attack_plan():</code>. function definition kuduthutu appram call panninaa thaan execution nadakkum. <code>attack_plan()</code> call panra varai zero performance!",
        "englishExp": "Functions are reusable blocks of code. They are defined using the <code>def</code> keyword, followed by the function name, parentheses, and a colon. You invoke them by writing the function name followed by parentheses.",
        "initialCode": "def attack_plan():\n    print(\"Build up jaasthi, performance zero!\")\n\n# Call the function!\nattack_plan()",
        "expectedOutput": "Build up jaasthi, performance zero!",
        "quiz": {
            "question": "Which keyword is used to declare a function in Python?",
            "options": ["function", "def", "define", "create"],
            "correctIndex": 1,
            "correctMeme": {
                "headline": "Correct! 'def' is the king!",
                "text": "Vadivelu: \"Def keyword-a correct-a select pannitiye! Unakku attack plan ready-a iruku!\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor vadivelu"><div class="actor-face">😏</div></div><div class="meme-dialog dialog-right">Nalla plan! Appidiye follow pannu!</div></div>"""
            },
            "incorrectMeme": {
                "headline": "Wrong keyword! Syntax Error!",
                "text": "Santhanam: \"Function-nu Javascript style-la Python-la type panra paaru! Enna oru puthisaalithanam!\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor vivek"><div class="actor-face">🤦‍♂️</div></div><div class="meme-dialog dialog-bottom">Aiyo! JS-laam Python-la ezhuthaadha pa!</div></div>"""
            }
        }
    },
    {
        "id": "lists",
        "title": "Lists & Dictionaries",
        "subtitle": "Tea Shop Menu Card (Goundamani & Senthil)",
        "indicator": "Topic 5",
        "tanglishExp": "Lists allow storing multiple items in a single variable. Menu card logic: <code>menu = [\"tea\", \"vadai\", \"bun\"]</code>. Items-a access panna Index range 0-la irundhu start aagum. So <code>menu[0]</code>-na tea, <code>menu[1]</code>-na vadai!",
        "englishExp": "Lists are used to store multiple items in a single variable. Lists are ordered, changeable, and allow duplicate values. Items are indexed, with the first item having index [0].",
        "initialCode": "menu = [\"tea\", \"vadai\", \"bun\"]\nprint(\"First item:\")\nprint(menu[0])\nprint(\"Second item:\")\nprint(menu[1])",
        "expectedOutput": "First item:\ntea\nSecond item:\nvadai",
        "quiz": {
            "question": "What will <code>menu[2]</code> print in the menu list above?",
            "options": ["tea", "vadai", "bun", "IndexError"],
            "correctIndex": 2,
            "correctMeme": {
                "headline": "Correct! Bun thaan!",
                "text": "Goundamani: \"Correct-a bun-nu sonna unaku oru special tea track ready!\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor goundamani"><div class="actor-face">😛</div></div><div class="meme-dialog dialog-right">Bun-nu correct-a solidhaanda!</div></div>"""
            },
            "incorrectMeme": {
                "headline": "Wrong index selection!",
                "text": "Senthil: \"Tea-nu solreenga, illana vadai-nu solreenga. Index correct-a parkalaye anna!\"",
                "svg": """<div class="meme-graphic"><div class="meme-actor senthil"><div class="actor-face">🥺</div></div><div class="meme-dialog dialog-bottom">Bun thaanga index 2!</div></div>"""
            }
        }
    }
]

CHITTI_MEME_RESPONSES = [
    {
        "keywords": ["hi", "hello", "vanakkam", "hey", "chitti", "robot", "yaru", "who", "name"],
        "response": "Vanakkam! Naan thaan <b>Chitti, Speed 1 Terahertz, Memory 1 Zettabyte!</b> 🤖 Python code ezhuthuradhula ungalukku enna doubt-nalum kelunga, memes mood-la instant-a clear panna naan ready! Enna topic pathi padikalaam?"
    },
    {
        "keywords": ["variable", "var", "store", "datatype", "data type", "integer", "string", "float", "bool", "boolean", "pocket", "senthil", "goundamani", "banana"],
        "response": "<b>Variables</b> matrum <b>Data Types</b> pathi ketrukeenga! Namma Goundamani & Senthil Banana comedy-ya vechiye dynamic-a solidaren paaru. Variable-nguradhu namma pocket maadhiri values store panni vechira box. E.g., <code>banana_count = 2</code>. Inga <code>banana_count</code> dhaan Variable Name, adhkulla store aagira <code>2</code> dhaan Value. Integer (int), Float, String (str), matrum Boolean category check panna easy! 🍌"
    },
    {
        "keywords": ["if", "else", "elif", "conditional", "decision", "rowdy", "weapon", "branch"],
        "response": "<b>Conditionals (If-Else)</b> pathi puriya veikuren! Vadivelu <b>'Naanum Rowdy Thaan'</b> templates control flow match panni easy-a purinjiklaam. Condition elements check panni branch logic selection panna conditionals use aagum. Python-la indentation space (4 spaces) miss panna error varum! 👮‍♂️"
    },
    {
        "keywords": ["loop", "for", "while", "repeat", "range", "iteration", "vivek", "thirumba"],
        "response": "<b>Loops</b> (<code>for</code> / <code>while</code>) matrum <code>range()</code> control parameters pathi solidaren! Thirumba thirumba actions perform panni repeat execution panna loops use aagum. Vivekh tea shop beats maadhiri repeat execution! 🌀"
    },
    {
        "keywords": ["function", "def", "call", "plan", "sidekick", "parameter", "argument"],
        "response": "<b>Functions</b> matrum <code>def</code> logic templates parse pannalaam! Functions-nguradhu single definitions code block custom templates. Vadivelu attack plan create panna <code>def attack_plan():</code> define panni call pannanum! 📢"
    },
    {
        "keywords": ["list", "dict", "dictionary", "array", "menu", "index", "key"],
        "response": "<b>Lists</b> matrum <b>Dictionaries</b> collections pathi easy-a details parse pannalam! List elements index numbers start from 0: <code>menu[0]</code> = tea! ☕"
    },
    {
        "keywords": ["bug", "error", "debug", "issue", "help", "problem", "wrong", "syntax"],
        "response": "<b>Bugs matrum syntax errors</b> pathi ketrukeenga! Vadivelu code lines logic debugging guidelines: <i>'Sanda nu vandha valikka thaan seiyum, code nu ezhudhuna error vara thaan seiyum!'</i>. Check your colons (:) and indentation! 🍌"
    },
    {
        "keywords": ["sana", "love", "girlfriend", "marriage", "wife"],
        "response": "Sana... Sana... En Sana! 🤖 <i>ERROR 404: Emotion core logic memory crash!</i> Red chip activated! Naan solradhaiyum seiven, solladhadhaiyum seiven! Let's code Python instead! 🔴"
    },
    {
        "keywords": ["python", "java", "c++", "javascript", "html", "why python"],
        "response": "<b>Python</b> syntax checks dynamic simple codes! English maadhiri clean-a write pannalaam. Life set-u! 🐍"
    }
]

CHITTI_DEFAULT_RESPONSES = [
    "Building-u strong-u, basement-u weak-u! Kelvi thappu nu nenaikaren. Python variables, datatype, conditionals, loops, functions or list pathi kelunga boss! 😅",
    "Ennama ipdi panringalema! Konjam Python topics pathi structured keywords-la kelunga, Chitti speed-la response solli tharen! 🤖",
    "Vadivelu style-la: 'Naan eppo sonnen?'. En database query list-la matching logic illaye. Python variables or loop keywords try panni check pannunga!",
    "Ahaaa, oru ruba kooda kuraiyama nalla question! Aana en database memory-la matching details illa. Let's study basic datatypes or loops first! 🐍"
]

class Command(BaseCommand):
    help = "Seeds initial Python Kadhai curriculum and Chitti bot responses into database"

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Seeding Python Kadhai Database..."))

        for idx, item in enumerate(LESSONS_DATA, start=1):
            lesson, created = Lesson.objects.update_or_create(
                topic_id=item["id"],
                defaults={
                    "title": item["title"],
                    "subtitle": item["subtitle"],
                    "indicator": item["indicator"],
                    "tanglish_exp": item["tanglishExp"],
                    "english_exp": item["englishExp"],
                    "initial_code": item["initialCode"],
                    "expected_output": item["expectedOutput"],
                    "order": idx
                }
            )

            q_data = item["quiz"]
            Quiz.objects.update_or_create(
                lesson=lesson,
                defaults={
                    "question": q_data["question"],
                    "options": q_data["options"],
                    "correct_index": q_data["correctIndex"],
                    "correct_headline": q_data["correctMeme"]["headline"],
                    "correct_text": q_data["correctMeme"]["text"],
                    "correct_svg": q_data["correctMeme"]["svg"],
                    "incorrect_headline": q_data["incorrectMeme"]["headline"],
                    "incorrect_text": q_data["incorrectMeme"]["text"],
                    "incorrect_svg": q_data["incorrectMeme"]["svg"],
                }
            )
            self.stdout.write(self.style.SUCCESS(f"Saved Lesson & Quiz: {lesson.title}"))

        # Seed Chatbot Responses
        ChatbotResponse.objects.all().delete()
        for item in CHITTI_MEME_RESPONSES:
            ChatbotResponse.objects.create(
                keywords=item["keywords"],
                response_text=item["response"],
                is_default_fallback=False
            )

        for text in CHITTI_DEFAULT_RESPONSES:
            ChatbotResponse.objects.create(
                keywords=[],
                response_text=text,
                is_default_fallback=True
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded all database items!"))
