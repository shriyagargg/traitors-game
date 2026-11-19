
import random
import logging
from typing import Optional, List
import httpx
from app.core.config import settings
from app.ai_engine.prompts.architect_prompts import (
    ARCHITECT_SYSTEM_PROMPT,
    MORNING_ANNOUNCEMENT_TEMPLATE,
    BANISHMENT_PROCLAMATION_TEMPLATE,
    DISCUSSION_HINT_TEMPLATE,
)

logger = logging.getLogger(__name__)


class ArchitectServiceError(Exception):
    """A safe, user-facing error from the configured AI provider."""


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

    async def answer_discussion_question(self, question: str, game_context: str) -> str:
        """Ask the configured provider using only public, phase-appropriate context."""
        provider = settings.LLM_PROVIDER.strip().lower()
        system_prompt = (
            ARCHITECT_SYSTEM_PROMPT
            + "\nYou are speaking privately to one living player during a social deduction game. "
            + "Answer the player's question in character. Only use the public game context supplied. "
            + "Never infer or reveal secret roles, private night actions, hidden information, or facts "
            + "not present in that context. If asked for hidden information, refuse in character. "
            + "Keep the answer concise and useful."
        )
        prompt = f"PUBLIC GAME CONTEXT\n{game_context}\n\nPLAYER QUESTION\n{question}"

        if provider == "gemini":
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                raise ArchitectServiceError("The Architect AI is not configured. Set GEMINI_API_KEY in the backend environment.")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
            headers = {"x-goog-api-key": api_key}
            body = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": settings.AI_TEMPERATURE, "maxOutputTokens": 512},
            }
        elif provider == "openai":
            api_key = settings.OPENAI_API_KEY
            if not api_key:
                raise ArchitectServiceError("The Architect AI is not configured. Set OPENAI_API_KEY in the backend environment.")
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}"}
            body = {
                "model": settings.OPENAI_MODEL,
                "temperature": settings.AI_TEMPERATURE,
                "max_tokens": 512,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
            }
        else:
            raise ArchitectServiceError(f"Unsupported AI provider '{provider}'. Configure LLM_PROVIDER as gemini or openai.")

        headers["Content-Type"] = "application/json"
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(25.0, connect=5.0)) as client:
                response = await client.post(url, headers=headers, json=body)
        except httpx.TimeoutException as exc:
            logger.warning("Architect provider request timed out (provider=%s)", provider)
            raise ArchitectServiceError("The Architect AI request timed out. Please try again.") from exc
        except httpx.RequestError as exc:
            logger.warning("Architect provider connection failed (provider=%s, error=%s)", provider, type(exc).__name__)
            raise ArchitectServiceError("The Architect AI service could not be reached. Check backend network access and try again.") from exc

        if not response.is_success:
            logger.error("Architect provider returned HTTP %s (provider=%s)", response.status_code, provider)
            if response.status_code in (401, 403):
                raise ArchitectServiceError("The AI provider rejected its credentials. Check the backend API key.")
            if response.status_code == 429:
                raise ArchitectServiceError("The AI provider is rate limited. Please try again shortly.")
            raise ArchitectServiceError("The AI provider could not complete the request. Please try again.")

        try:
            payload = response.json()
            if provider == "gemini":
                parts = payload["candidates"][0]["content"]["parts"]
                answer = "".join(part.get("text", "") for part in parts).strip()
            else:
                answer = payload["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            logger.error("Architect provider returned an unreadable response (provider=%s)", provider)
            raise ArchitectServiceError("The AI provider returned an unreadable response. Please try again.") from exc
        if not answer:
            raise ArchitectServiceError("The AI provider returned an empty response. Please try again.")
        return answer


architect_agent = ArchitectAgent()

