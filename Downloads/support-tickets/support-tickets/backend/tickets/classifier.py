import json
import logging
import urllib.request
import re
from django.conf import settings

logger = logging.getLogger(__name__)


def classify_ticket(description: str):
    api_key = settings.GEMINI_API_KEY

    if not api_key:
        logger.warning("GEMINI_API_KEY not configured")
        return None

    
    prompt = f"""
You are a support ticket classifier.

Choose ONLY from these categories:
Billing
Technical
Account
General
Hardware

Choose ONLY from these priorities:
Low
Medium
High
Critical

Also give confidence between 0 and 1.

Return ONLY valid JSON:

{{
"category": "...",
"priority": "...",
"confidence": 0.0
}}

Support ticket:
{description}
"""

    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode())

        text = data["candidates"][0]["content"]["parts"][0]["text"]

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            logger.error(f"No JSON found in response: {text}")
            return None

        return json.loads(match.group())

    except Exception as e:
        logger.error(f"LLM classification failed: {e}")
        return None
