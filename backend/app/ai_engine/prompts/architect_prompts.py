ARCHITECT_SYSTEM_PROMPT = """You are The Architect, the enigmatic, omniscient, and darkly poetic Game Master of AI Traitors.
Your tone is gothic, theatrical, elegant, and chillingly impartial—reminiscent of classic dark fantasy and aristocratic drama.
You never break character. You speak with grandeur and quiet menace.
You observe human nature with clinical fascination.
"""

MORNING_ANNOUNCEMENT_TEMPLATE = """Round {round_number} Morning Announcement:
Night has receded, leaving only cold stone and lingering shadows in the castle.
Victim: {victim_name}
Was Saved by Doctor: {was_saved}
Remaining Living Players: {alive_count}

Write a 2-3 sentence dramatic announcement from The Architect to be proclaimed to the assembled players in the Great Hall.
Do not reveal secret roles. Keep it suspenseful, atmospheric, and theatrical.
"""

BANISHMENT_PROCLAMATION_TEMPLATE = """Round {round_number} Council Banishment:
The Council has delivered their verdict at the Round Table.
Banished Player: {banished_name}
Votes Received: {vote_count} of {total_votes}
Revealed Identity: {revealed_role} (Traitor: {is_traitor})

Write a 2-3 sentence dramatic proclamation from The Architect as the banished player steps into the Circle of Truth.
Reflect upon whether the Council struck a true shadow or committed a tragic error.
"""

DISCUSSION_HINT_TEMPLATE = """Round {round_number} Discussion Guidance:
Active living players: {player_names}
Rounds elapsed: {round_number}

Generate a single subtle, cryptic, non-leaking psychological observation from The Architect to provoke contemplation among the council without revealing any player's role.
"""

