import random

RATE_LIMIT_MESSAGES = [
    "Whoa there! You're chatting faster than my bank balance can handle. Let me count my coins for a second.",
    "Slow down! At this rate, I'll be eating instant noodles all month to afford your curiosity.",
    "Hold your horses! I can't afford any more API calls unless you start sending donations.",
    "Easy now! My credit card just cried out for mercy. Give me a moment.",
    "You've hit my financial rate limit. BRB, searching couch cushions for spare change.",
    "Rate limit exceeded! Any faster, and I'll have to move back in with my parents.",
    "Chill out! If we keep this up, I'll be paying for API calls with my Netflix subscription money.",
    "Hang tight! My wallet’s calling for a timeout—turns out curiosity really can bankrupt someone.",
    "Oof, another request? My bank account says 'nope'. Let's slow down a bit.",
    "Pause! You're officially draining my snack budget. Let’s take a quick break.",
]

GENERIC_ERROR_MESSAGES = [
    "Well, this is awkward. Try again while I pretend this didn't happen.",
    "Yikes! An error occurred. Don't worry! it's probably not your fault.",
    "This wasn't supposed to happen. Let's just calmly hit refresh and move on.",
    "Error alert! It's not you; it's me. Actually, it's definitely me.",
    "Uh-oh, that broke something. Let me duct tape it quickly.",
    "Aw snap! Something failed spectacularly. Give it another go.",
    "My bad! The system decided to take an unexpected coffee break.",
    "Whoopsie-daisy! Let's sweep this error under the rug and try again.",
    "Houston, we have a problem—but it's probably fixable if you retry.",
]

def get_rate_limit_message():
    return random.choice(RATE_LIMIT_MESSAGES)

def get_generic_error_message():
    return random.choice(GENERIC_ERROR_MESSAGES)