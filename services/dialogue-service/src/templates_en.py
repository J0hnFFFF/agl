"""
English Dialogue Templates
Pre-written English dialogue templates for fast generation
"""
import random
from typing import Dict, List


def get_dialogue_templates_en() -> Dict[tuple, List[str]]:
    """
    English dialogue template library
    Format: {(event_type, emotion, persona): [dialogue options]}
    """
    return {
        # ===== COMBAT EVENTS =====

        # Victory - Cheerful persona
        ("player.victory", "happy", "cheerful"): [
            "Awesome! You won! ✨",
            "Wow! That was an amazing match!",
            "Victory! Well done! 🎉",
            "You did it! That was incredible!",
            "Perfect! That's what I call skill!",
            "Amazing work out there!",
            "What a great win!",
        ],
        ("player.victory", "excited", "cheerful"): [
            "That was AMAZING!! Total domination!",
            "WOW! Those plays were absolutely insane!",
            "Unstoppable!! You're on fire!",
            "Incredible performance! That was beautiful!",
            "What an epic victory!!",
        ],
        ("player.victory", "proud", "cheerful"): [
            "I'm so proud of you!",
            "You totally earned that win!",
            "That's the result of all your hard work!",
            "You showed them what you're made of!",
        ],

        # Victory - Cool persona
        ("player.victory", "happy", "cool"): [
            "Nice. You won.",
            "Victory. As expected.",
            "Good job out there.",
            "Well played.",
            "Solid performance.",
        ],
        ("player.victory", "excited", "cool"): [
            "Impressive execution.",
            "Flawless victory.",
            "Dominant performance.",
            "Executed perfectly.",
        ],
        ("player.victory", "proud", "cool"): [
            "Worthy of respect.",
            "You've proven yourself.",
            "That's the level I expected.",
        ],

        # Victory - Cute persona
        ("player.victory", "happy", "cute"): [
            "Yay~ We won! You're amazing! 💕",
            "Wow~ I'm so happy! We did it!",
            "So cool~ You're the best!",
            "Woohoo~ That was awesome!",
            "Teehee~ Victory!",
        ],
        ("player.victory", "excited", "cute"): [
            "OMG OMG!! That was so cool!!",
            "You're super strong~! Amazing!",
            "Wowww~ That was incredible!",
            "So exciting~! You crushed them!",
        ],
        ("player.victory", "proud", "cute"): [
            "I knew you could do it~!",
            "You're my hero~!",
            "That's my player~!",
        ],

        # Defeat - Cheerful persona
        ("player.defeat", "sad", "cheerful"): [
            "No worries, you'll get them next time!",
            "Hey, we all have bad games. Let's bounce back!",
            "That's okay! Every loss is a lesson!",
            "Shake it off! Next match is yours!",
            "Don't let it get you down! You've got this!",
        ],
        ("player.defeat", "disappointed", "cheerful"): [
            "You played well, just wasn't meant to be!",
            "Don't worry, we'll come back stronger!",
            "This experience will make you better!",
            "Learn from it and move forward!",
        ],
        ("player.defeat", "frustrated", "cheerful"): [
            "I know it's frustrating, but stay positive!",
            "Take a break if you need to. You'll be back!",
            "Hey, even the pros lose sometimes!",
        ],

        # Defeat - Cool persona
        ("player.defeat", "sad", "cool"): [
            "Lost. Analyze what went wrong.",
            "Not this time. Review and improve.",
            "Defeat. Learn from it.",
            "It happens. Focus on growth.",
        ],
        ("player.defeat", "disappointed", "cool"): [
            "Room for improvement identified.",
            "They were better. That's data.",
            "Not your best. Next time.",
        ],
        ("player.defeat", "frustrated", "cool"): [
            "Channel that frustration into practice.",
            "Losses reveal weaknesses. Fix them.",
            "Keep your composure.",
        ],

        # Defeat - Cute persona
        ("player.defeat", "sad", "cute"): [
            "Aww... it's okay~ We'll win next time!",
            "Don't be sad~ You did great!",
            "Cheer up~ I'm here for you!",
            "It's alright~ Losses happen to everyone~",
        ],
        ("player.defeat", "disappointed", "cute"): [
            "You tried so hard... I'm proud of you~",
            "Don't be disappointed~ You'll get stronger!",
            "It's okay~ Every loss helps us grow~",
        ],
        ("player.defeat", "frustrated", "cute"): [
            "Hey hey~ Take a deep breath~",
            "I know you're upset~ But you're still amazing!",
            "Don't give up~ I believe in you~",
        ],

        # Kill events
        ("player.kill", "satisfied", "cheerful"): [
            "Nice elimination!",
            "Great kill!",
            "Got 'em!",
            "Perfect shot!",
        ],
        ("player.kill", "excited", "cheerful"): [
            "What a play!!",
            "Incredible kill!",
            "That was sick!",
        ],
        ("player.kill", "satisfied", "cool"): [
            "Clean execution.",
            "Eliminated.",
            "Down.",
        ],
        ("player.kill", "excited", "cool"): [
            "Excellent takedown.",
            "Impressive.",
        ],
        ("player.kill", "satisfied", "cute"): [
            "Nice one~!",
            "You got them~!",
            "Yay~!",
        ],
        ("player.kill", "excited", "cute"): [
            "So cool~!!",
            "Amazing~!",
        ],

        # Death events
        ("player.death", "disappointed", "cheerful"): [
            "Ouch! Respawn and get back in there!",
            "That happens! Back to it!",
            "No worries, next life you'll get them!",
        ],
        ("player.death", "frustrated", "cheerful"): [
            "Hey, it's all part of the game!",
            "Shake it off and respawn!",
        ],
        ("player.death", "disappointed", "cool"): [
            "Eliminated. Respawn.",
            "Down. Back to it.",
        ],
        ("player.death", "frustrated", "cool"): [
            "Happens. Stay focused.",
        ],
        ("player.death", "disappointed", "cute"): [
            "Oh no~ It's okay though!",
            "Aww~ Next time for sure~!",
        ],
        ("player.death", "frustrated", "cute"): [
            "Don't worry~ You'll get them~!",
        ],

        # Achievement events
        ("player.achievement", "excited", "cheerful"): [
            "Woohoo! Achievement unlocked!!",
            "Amazing! You earned it!",
            "Congratulations on your achievement!",
            "That's a big one! Well done!",
        ],
        ("player.achievement", "proud", "cheerful"): [
            "You really deserve this achievement!",
            "All that hard work paid off!",
            "I'm so proud you got this!",
        ],
        ("player.achievement", "excited", "cool"): [
            "Achievement unlocked. Impressive.",
            "Well earned.",
            "Worthy accomplishment.",
        ],
        ("player.achievement", "proud", "cool"): [
            "Respectable achievement.",
            "You've proven your skill.",
        ],
        ("player.achievement", "excited", "cute"): [
            "Yay~ Achievement!! So proud of you~!",
            "Wow~! You got it! Amazing~!",
            "Teehee~ Congratulations~!",
        ],
        ("player.achievement", "proud", "cute"): [
            "I knew you could do it~!",
            "You're so awesome~!",
        ],

        # Level up events
        ("player.levelup", "happy", "cheerful"): [
            "Level up! You're getting stronger!",
            "Congratulations on leveling up!",
            "Nice! Another level gained!",
        ],
        ("player.levelup", "excited", "cheerful"): [
            "LEVEL UP!! That's awesome!",
            "Yes! New level, new possibilities!",
        ],
        ("player.levelup", "happy", "cool"): [
            "Level up. Progress.",
            "Leveled up. Keep going.",
        ],
        ("player.levelup", "excited", "cool"): [
            "Another milestone reached.",
        ],
        ("player.levelup", "happy", "cute"): [
            "Level up~! Yay~!",
            "Woohoo~ You leveled up~!",
        ],
        ("player.levelup", "excited", "cute"): [
            "Wow~ Level up!! So exciting~!",
        ],

        # Loot events
        ("player.loot", "happy", "cheerful"): [
            "Nice loot!",
            "Ooh, good find!",
            "Sweet! That's a good one!",
        ],
        ("player.loot", "excited", "cheerful"): [
            "Wow! That's awesome loot!",
            "Jackpot! Great drop!",
        ],
        ("player.loot", "happy", "cool"): [
            "Loot acquired.",
            "Good drop.",
        ],
        ("player.loot", "excited", "cool"): [
            "Excellent loot.",
            "Rare find.",
        ],
        ("player.loot", "happy", "cute"): [
            "Ooh~ Shiny~!",
            "Nice loot~!",
        ],
        ("player.loot", "excited", "cute"): [
            "Wowww~ Amazing loot~!",
            "So lucky~!",
        ],

        # Session events
        ("player.sessionstart", "cheerful", "cheerful"): [
            "Welcome back! Ready to play?",
            "Hey! Great to see you!",
            "Let's do this! Time to play!",
            "Welcome! Let's have some fun!",
        ],
        ("player.sessionstart", "cheerful", "cool"): [
            "You're back. Let's begin.",
            "Welcome. Ready when you are.",
            "Session start.",
        ],
        ("player.sessionstart", "cheerful", "cute"): [
            "Yay~ You're here~!",
            "Welcome back~! Missed you~!",
            "Hi hi~! Let's play~!",
        ],
        ("player.sessionend", "neutral", "cheerful"): [
            "Good session! See you next time!",
            "Nice playing with you! Come back soon!",
            "Great games! Bye for now!",
        ],
        ("player.sessionend", "neutral", "cool"): [
            "Session end. See you.",
            "Goodbye. Until next time.",
        ],
        ("player.sessionend", "neutral", "cute"): [
            "Bye bye~! Come back soon~!",
            "See you~! Had fun~!",
        ],

        # Neutral/default responses
        ("player.victory", "neutral", "cheerful"): [
            "You won! Nice job!",
        ],
        ("player.defeat", "neutral", "cheerful"): [
            "Better luck next time!",
        ],
        ("player.kill", "neutral", "cheerful"): [
            "Got them!",
        ],
    }


def get_template_dialogue_en(event_type: str, emotion: str, persona: str) -> str:
    """
    Get a random dialogue template for the given parameters
    """
    templates = get_dialogue_templates_en()
    key = (event_type, emotion, persona)

    if key in templates:
        return random.choice(templates[key])

    # Fallback logic
    fallback_keys = [
        (event_type, emotion, "cheerful"),  # Try with cheerful persona
        (event_type, "neutral", persona),  # Try with neutral emotion
        (event_type, "neutral", "cheerful"),  # Try cheerful neutral
    ]

    for fallback_key in fallback_keys:
        if fallback_key in templates:
            return random.choice(templates[fallback_key])

    # Ultimate fallback
    return "..."
