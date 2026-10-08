"""Configuration settings for NexusFin."""
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DATA_DIR = BASE_DIR / "data"

# Application Metadata
APP_NAME = "NexusFin"
APP_DESCRIPTION = "Responsible Credit Decision Support & Affordability Intelligence Platform"
APP_VERSION = "1.0.0"
APP_TAGLINE = "Understand credit before it becomes a burden."

# Supported Currencies & Symbols
CURRENCY_CONFIG = {
    "PHP": {"symbol": "₱", "name": "Philippine Peso", "locale": "en-PH"},
    "KES": {"symbol": "KSh", "name": "Kenyan Shilling", "locale": "en-KE"},
    "SGD": {"symbol": "S$", "name": "Singapore Dollar", "locale": "en-SG"},
    "IDR": {"symbol": "Rp", "name": "Indonesian Rupiah", "locale": "id-ID"},
    "MYR": {"symbol": "RM", "name": "Malaysian Ringgit", "locale": "ms-MY"},
    "THB": {"symbol": "฿", "name": "Thai Baht", "locale": "th-TH"},
    "VND": {"symbol": "₫", "name": "Vietnamese Dong", "locale": "vi-VN"},
    "USD": {"symbol": "$", "name": "US Dollar", "locale": "en-US"},
}
