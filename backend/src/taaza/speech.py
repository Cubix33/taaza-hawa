"""Spoken answer via Amazon Polly (neural voice Kajal: Hindi and Indian English, available in Mumbai).

The text is composed here from the card, never taken from the caller, so the public endpoint
cannot be used to read arbitrary text on our bill. Audio is cached by text, so each wording is
synthesized once.
"""
from __future__ import annotations

import base64
import hashlib
import os

from .freshness import human_age_en, human_age_hi
from .store import Store

VOICE = "Kajal"
LANG_CODE = {"hi": "hi-IN", "en": "en-IN"}
MAX_CHARS = 700  # a spoken answer is a few sentences; Polly's own limit is 3000

SAY = {
    "hi": {"GO": "हाँ, जाइए।", "WAIT": "अभी नहीं। हवा सुधरने का इंतज़ार करें।", "STAY": "नहीं, आज अंदर रहिए।", "UNKNOWN": "अभी पक्का नहीं कह सकते।"},
    "en": {"GO": "Yes, go ahead.", "WAIT": "Not yet. Wait for air to improve.", "STAY": "No. Stay in today.", "UNKNOWN": "We can't say for sure right now."},
}
ADVICE = {
    "hi": {"GO": "हवा ठीक है। बाहर टहलना, दौड़ना या साइकिल चलाना ठीक है।",
           "WAIT": "अभी हवा खराब है। बाहरी मेहनत या दौड़-सैर से पहले हवा की स्थिति सुधरने का इंतज़ार करें।",
           "STAY": "हवा बहुत खराब है। आज बाहर कसरत या खेल न करें।",
           "UNKNOWN": "इस स्टेशन का भरोसेमंद नंबर अभी नहीं है। पास का कोई और स्टेशन चुनें।"},
    "en": {"GO": "The air is OK. A walk, run or ride outside is fine.",
           "WAIT": "The air is poor right now. Wait for conditions to improve or exercise caution before strenuous outdoor activity.",
           "STAY": "The air is very poor. Skip outdoor exercise and games today.",
           "UNKNOWN": "We don't have a reliable number for this station right now. Pick another nearby station."},
}
WAIT_NEXT = {
    "hi": {"fresh": "स्टेशन का अगला नंबर आने पर फिर देखें; स्टेशन आमतौर पर हर घंटे नंबर भेजते हैं।",
           "old": "स्टेशन का नया नंबर आने पर फिर देखें।"},
    "en": {"fresh": "Check again once the station sends its next number; stations usually send one every hour.",
           "old": "Check again once the station sends a new number."},
}
FOOT = {"hi": "यह स्टेशन की हवा है, आपकी गली की नहीं।", "en": "This is station air, not your street."}
HEALTHY = {"hi": "यह सलाह स्वस्थ वयस्कों के लिए है। डॉक्टरी सलाह नहीं।", "en": "Set for healthy adults. Not medical advice."}


def spoken_text(card: dict, lang: str) -> str:
    """Plain-words script for a card (same facts as the on-screen answer and its 'why' lines)."""
    lang = lang if lang in LANG_CODE else "hi"
    ans = card.get("answer", "UNKNOWN")
    fresh = card.get("state") == "fresh"
    parts = [card.get("name", ""), SAY[lang][ans], ADVICE[lang][ans]]
    if ans == "WAIT":
        parts.append(WAIT_NEXT[lang]["fresh" if fresh else "old"])
    age = card.get("age_min")
    iv = card.get("interval")
    if lang == "hi":
        band = card.get("band_hi")
        if iv and band:
            parts.append(f"हवा का नंबर, यानी ए क्यू आई, शायद {iv['lo']} से {iv['hi']} के बीच है, यानी हवा {band} है।")
        elif card.get("value") is not None and band:
            parts.append(f"हवा का नंबर, यानी ए क्यू आई, {card['value']} है, यानी हवा {band} है।")
        if age is not None:
            parts.append(f"यह नंबर {human_age_hi(age)} पहले नापा गया।" if fresh
                         else f"इस स्टेशन का आख़िरी नंबर {human_age_hi(age)} पहले आया था, इसलिए यह हमारा अंदाज़ा है।")
    else:
        band = card.get("band_en")
        if iv and band:
            parts.append(f"The air number, A Q I, is probably between {iv['lo']} and {iv['hi']}, which means the air is {band}.")
        elif card.get("value") is not None and band:
            parts.append(f"The air number, A Q I, is {card['value']}, which means the air is {band}.")
        if age is not None:
            parts.append(f"This number was measured {human_age_en(age)} ago." if fresh
                         else f"This station's last number came {human_age_en(age)} ago, so this is our estimate.")
    foot = FOOT[lang] if ans == "UNKNOWN" else f"{FOOT[lang]} {HEALTHY[lang]}"
    body = " ".join(p for p in parts if p)[: MAX_CHARS - len(foot) - 1].rstrip()
    return f"{body} {foot}"  # the footer is never truncated away


def _client():
    import boto3  # provided by the Lambda runtime
    return boto3.client("polly", region_name=os.environ.get("POLLY_REGION") or os.environ.get("AWS_REGION") or "ap-south-1")


def synthesize(store: Store, text: str, lang: str) -> dict:
    lang = lang if lang in LANG_CODE else "hi"
    key = hashlib.sha1(f"{VOICE}|{lang}|{text}".encode()).hexdigest()
    hit = store.get("KV", f"voice#{key}")
    if hit:
        return {"audio": hit["audio"], "mime": "audio/mpeg", "cached": True}
    r = _client().synthesize_speech(Text=text, TextType="text", OutputFormat="mp3", VoiceId=VOICE,
                                    Engine="neural", LanguageCode=LANG_CODE[lang], SampleRate="24000")
    b64 = base64.b64encode(r["AudioStream"].read()).decode()
    store.put("KV", f"voice#{key}", {"audio": b64})
    return {"audio": b64, "mime": "audio/mpeg", "cached": False}
