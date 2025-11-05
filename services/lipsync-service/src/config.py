"""
Configuration for Lip Sync Service
"""
import os
from typing import Dict, List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Service configuration"""

    # Service settings
    service_name: str = "lipsync-service"
    version: str = "1.0.0"
    port: int = 8006

    # Audio processing
    sample_rate: int = 16000
    frame_duration_ms: int = 20  # 20ms frames for phoneme extraction

    # Phoneme detection
    phoneme_min_duration_ms: int = 40  # Minimum phoneme duration
    silence_threshold: float = 0.01  # Energy threshold for silence

    # Viseme mapping
    default_viseme: str = "sil"  # Default viseme for silence
    viseme_blend_time_ms: int = 30  # Smooth transition between visemes

    # Redis cache
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_db: int = 3
    cache_enabled: bool = True
    cache_ttl_seconds: int = 86400  # 24 hours

    # Performance
    max_audio_duration_seconds: int = 300  # 5 minutes max

    class Config:
        env_file = ".env"


# International Phonetic Alphabet to Viseme mapping
# Based on standard viseme sets (Oculus, ARKit, etc.)
PHONEME_TO_VISEME_MAP: Dict[str, str] = {
    # Silence
    "sil": "sil",
    "": "sil",

    # Vowels
    "AA": "aa",  # father
    "AE": "aa",  # cat
    "AH": "aa",  # cut
    "AO": "O",   # caught
    "AW": "O",   # cow
    "AY": "aa",  # hide
    "EH": "E",   # bed
    "ER": "E",   # bird
    "EY": "E",   # bait
    "IH": "I",   # bit
    "IY": "I",   # beat
    "OW": "O",   # boat
    "OY": "O",   # boy
    "UH": "U",   # book
    "UW": "U",   # boot

    # Consonants - Labials (lips)
    "P": "PP",   # pat
    "B": "PP",   # bat
    "M": "PP",   # mat

    # Consonants - Labiodentals (lip-teeth)
    "F": "FF",   # fat
    "V": "FF",   # vat

    # Consonants - Dentals (tongue-teeth)
    "TH": "TH",  # thin
    "DH": "TH",  # then

    # Consonants - Alveolars (tongue-ridge)
    "T": "DD",   # tap
    "D": "DD",   # dap
    "N": "nn",   # nap
    "S": "SS",   # sip
    "Z": "SS",   # zip
    "L": "nn",   # lap

    # Consonants - Post-alveolars
    "SH": "CH",  # ship
    "ZH": "CH",  # measure
    "CH": "CH",  # chip
    "JH": "CH",  # jump

    # Consonants - Velars
    "K": "kk",   # cap
    "G": "kk",   # gap
    "NG": "nn",  # sing

    # Consonants - Glottals
    "HH": "sil", # hat

    # Liquids and Glides
    "R": "RR",   # rat
    "W": "U",    # way
    "Y": "I",    # yacht
}

# Viseme display names
VISEME_NAMES: Dict[str, str] = {
    "sil": "Silence",
    "PP": "Lip Closure (P/B/M)",
    "FF": "Lip-Teeth (F/V)",
    "TH": "Tongue-Teeth (TH)",
    "DD": "Tongue-Ridge (T/D/N)",
    "kk": "Tongue-Back (K/G)",
    "CH": "Lip Rounding (CH/SH)",
    "SS": "Narrow Tongue (S/Z)",
    "nn": "Nasal (N/NG/L)",
    "RR": "R Sound",
    "aa": "Open Jaw (A)",
    "E": "Slight Smile (E)",
    "I": "Wide Smile (I)",
    "O": "Round Lips (O)",
    "U": "Narrow Round (U)",
}

settings = Settings()
