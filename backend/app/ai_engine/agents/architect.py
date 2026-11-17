
import random
from typing import Optional, List
from app.core.config import settings
from app.ai_engine.prompts.architect_prompts import (
    ARCHITECT_SYSTEM_PROMPT,
    MORNING_ANNOUNCEMENT_TEMPLATE,
    BANISHMENT_PROCLAMATION_TEMPLATE,
    DISCUSSION_HINT_TEMPLATE,
)


class ArchitectAgent:
    """
    The Architect: Autonomous Game Master AI Agent.
    Operates as a PEAS Knowledge-Based Utility-Guided Multi-Agent Coordinator.
    Generates dynamic atmospheric narratives for morning murders, banishments, and gameplay hints.
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.has_llm = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY)

    async def generate_morning_announcement(
        self,
        round_number: int,
        victim_name: Optional[str] = None,
        was_saved: bool = False,
        alive_count: int = 7,
    ) -> str:
        if was_saved or not victim_name:
            narratives = [
                f"The night was fraught with whispered terror, yet the dawn breaks upon an untouched council. All {alive_count} of you survived the shadows.",
                f"A quiet intervention in the dark stayed the executioner's hand. Today, the castle welcomes every living soul back to the Great Hall.",
                f"The shadows crept close, but fate was merciful. No player fell this night. Cherish your breath—it may not last another dawn.",
            ]
            return random.choice(narratives)

        narratives = [
            f"The night has concluded its grim harvest. {victim_name} has fallen to the shadows, their chair standing forever vacant.",
            f"Cold morning light spills across the stone floor, revealing an irreparable loss. {victim_name} will walk among you no more.",
            f"The Traitors struck with merciless precision while you slept. {victim_name} has been eliminated from the castle.",
        ]
        return random.choice(narratives)

    async def generate_banishment_proclamation(
        self,
        round_number: int,
        banished_name: str,
        is_traitor: bool,
        vote_count: int,
        total_votes: int = 6,
    ) -> str:
        if is_traitor:
            proclamations = [
                f"The Council's instincts ring true. By a decisive tally of {vote_count} ballots, {banished_name} stood revealed as a TRAITOR. One shadow has been cast out.",
                f"Justice strikes deep into the dark. {banished_name} confessed before the Circle of Truth: they were a TRAITOR. The Faithful strike a vital blow.",
                f"A wolf in sheep's clothing has been unmasked. {banished_name} leaves the castle in disgrace as a verified TRAITOR.",
            ]
            return random.choice(proclamations)

        proclamations = [
            f"A heavy silence descends upon the Great Hall. By majority decree ({vote_count} votes), you have banished {banished_name}—an innocent FAITHFUL. The Traitors silently smile.",
            f"Paranoia has claimed another innocent. {banished_name} proclaimed their FAITHFUL allegiance with their dying breath. The castle weeps for your mistake.",
            f"You sought darkness where there was only daylight. {banished_name} was a FAITHFUL. One less ally stands between you and the ravenous shadows.",
        ]
        return random.choice(proclamations)

    async def generate_discussion_hint(
        self, round_number: int, player_names: List[str]
    ) -> str:
        hints = [
            "Those who shout the loudest are often deflecting; those who remain too quiet are biding their time.",
            "Watch the second vote cast, not the first. The first is passion; the second is calculated.",
            "A Traitor does not fear the discussion—they fear the ballot box. Observe whose eyes avoid the center.",
            "Remember: consensus without debate is the ultimate sanctuary of deception.",
        ]
        return random.choice(hints)


architect_agent = ArchitectAgent()

