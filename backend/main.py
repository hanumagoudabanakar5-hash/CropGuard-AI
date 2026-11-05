import io
import os
import time
import requests
import json

from pathlib import Path
import sqlite3
from datetime import datetime
from pydantic import BaseModel

import torch
import torch.nn as nn

from torchvision import models, transforms
from torchvision.models import MobileNet_V2_Weights

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
# ==========================================
# CONFIGURATION
# ==========================================

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

AGMARKNET_BASE_URL = "https://api.agmarknet.gov.in/v1"

AGMARKNET_FILTERS_URL = (
    f"{AGMARKNET_BASE_URL}/daily-price-arrival/filters"
)

AGMARKNET_MARKET_PRICE_URL = (
    f"{AGMARKNET_BASE_URL}/prices-and-arrivals/"
    "market-price/lastweek"
)

AGMARKNET_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://agmarknet.gov.in",
    "Referer": "https://agmarknet.gov.in/"
}

KARNATAKA_STATE_ID = 16
# ==========================================
# LEAF LOGIC AI MODEL
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent
AI_MODEL_DIR = BASE_DIR / "ai_model"

MODEL_PATH = AI_MODEL_DIR / "best_model.pth"
CLASS_NAMES_PATH = AI_MODEL_DIR / "class_names.json"

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

with open(CLASS_NAMES_PATH, "r") as f:
    class_names = json.load(f)

checkpoint = torch.load(
    MODEL_PATH,
    map_location=DEVICE,
    weights_only=True
)

model = models.mobilenet_v2(weights=None)

model.classifier[1] = nn.Linear(
    model.last_channel,
    len(class_names)
)

model.load_state_dict(checkpoint["model_state_dict"])
model = model.to(DEVICE)
model.eval()

weights = MobileNet_V2_Weights.DEFAULT

AI_TRANSFORM = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=weights.transforms().mean,
        std=weights.transforms().std
    )
])

print("LEAF LOGIC AI model loaded successfully!")
print("Device:", DEVICE)
print("Categories:", len(class_names))

app = FastAPI(
    title="LEAF LOGIC AI API",
    description="Agriculture AI, crop analysis, weather and live APMC market services",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# FARMER CONSULTATION DATABASE
# ==========================================

DB_PATH = Path(__file__).resolve().parent / "leaf_logic.db"



def init_consultation_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS consultations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                farmer_name TEXT,
                contact TEXT,
                question TEXT NOT NULL,
                status TEXT DEFAULT 'Pending',
                created_at TEXT
            )
        """)


def init_scan_history_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS scan_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                crop TEXT,
                disease TEXT,
                confidence REAL,
                created_at TEXT
            )
        """)


init_consultation_db()
init_scan_history_db()

class ConsultationRequest(BaseModel):
    farmer_name: str = "Farmer"
    contact: str = ""
    question: str


@app.post("/consultations")
def submit_consultation(request: ConsultationRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question is required.")

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute(
            """INSERT INTO consultations
            (farmer_name, contact, question, status, created_at)
            VALUES (?, ?, ?, ?, ?)""",
            (
                request.farmer_name,
                request.contact,
                question,
                "Pending",
                datetime.now().isoformat()
            )
        )
        consultation_id = cursor.lastrowid

    return {
        "success": True,
        "consultation_id": consultation_id,
        "status": "Pending",
        "message": "Your consultation request was submitted successfully."
    }


@app.get("/consultations")
def get_consultations():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM consultations ORDER BY id DESC"
        ).fetchall()

    return {
        "success": True,
        "consultations": [dict(row) for row in rows]
    }

# ==========================================
# SIMPLE CACHE
# ==========================================

filters_cache = {
    "data": None,
    "time": 0
}

market_cache = {}

CACHE_SECONDS = 300


# ==========================================
# HOME AND HEALTH
# ==========================================

@app.get("/")
def home():
    return {
        "message": "Welcome to LEAF LOGIC AI Backend",
        "status": "running",
        "version": "4.0.0",
        "features": [
            "Leaf image upload",
            "Current weather",
            "Five-day weather forecast",
            "Real Karnataka APMC market prices",
            "Crop and market filters"
        ]
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# ==========================================
# WEATHER SERVICE
# ==========================================

def get_weather_data(endpoint, params):

    if not OPENWEATHER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OpenWeather API key is missing. Check backend/.env"
        )

    request_params = params.copy()
    request_params["appid"] = OPENWEATHER_API_KEY
    request_params["units"] = "metric"

    try:
        response = requests.get(
            f"{WEATHER_BASE_URL}/{endpoint}",
            params=request_params,
            timeout=15
        )

        if response.status_code == 401:
            raise HTTPException(
                status_code=502,
                detail="OpenWeather key is invalid or not activated yet."
            )

        response.raise_for_status()
        return response.json()

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Weather service timed out. Try again."
        )

    except requests.exceptions.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Unable to connect to OpenWeather."
        )


@app.get("/weather")
def current_weather(city: str = Query(default="Bengaluru")):

    data = get_weather_data(
        "weather",
        {"q": city}
    )

    rain = data.get("rain", {}).get("1h", 0)

    return {
        "success": True,
        "city": data["name"],
        "country": data["sys"]["country"],
        "temperature": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "pressure": data["main"]["pressure"],
        "weather": data["weather"][0]["main"],
        "description": data["weather"][0]["description"],
        "wind_speed": data["wind"]["speed"],
        "rain_last_hour_mm": rain,
        "farming_advisory": (
            "Rain recorded in the last hour. Check field drainage."
            if rain > 0
            else "Check local soil moisture before irrigation."
        )
    }


@app.get("/forecast")
def weather_forecast(city: str = Query(default="Bengaluru")):

    data = get_weather_data(
        "forecast",
        {"q": city, "cnt": 40}
    )

    forecast_items = []

    for item in data["list"]:
        forecast_items.append({
            "date_time": item["dt_txt"],
            "temperature": item["main"]["temp"],
            "humidity": item["main"]["humidity"],
            "weather": item["weather"][0]["main"],
            "description": item["weather"][0]["description"],
            "rain_probability": round(
                item.get("pop", 0) * 100, 1
            ),
            "rainfall_mm": item.get("rain", {}).get("3h", 0),
            "wind_speed": item["wind"]["speed"]
        })

    return {
        "success": True,
        "city": data["city"]["name"],
        "forecast": forecast_items
    }


# ==========================================
# REAL AGMARKNET MARKET SERVICE
# ==========================================

def get_agmarknet_filters():

    now = time.time()

    if (
        filters_cache["data"] is not None
        and now - filters_cache["time"] < CACHE_SECONDS
    ):
        return filters_cache["data"]

    try:
        response = requests.get(
            AGMARKNET_FILTERS_URL,
            headers=AGMARKNET_HEADERS,
            timeout=30
        )

        response.raise_for_status()

        result = response.json()

        if not result.get("status"):
            raise HTTPException(
                status_code=502,
                detail="AGMARKNET could not provide market filters."
            )

        filters = result.get("data", {})

        filters_cache["data"] = filters
        filters_cache["time"] = now

        return filters

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="AGMARKNET filters request timed out."
        )

    except requests.exceptions.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Unable to connect to AGMARKNET."
        )

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="AGMARKNET returned an invalid response."
        )


@app.get("/market/filters")
def market_filters():

    filters = get_agmarknet_filters()

    commodities = filters.get("cmdt_data", [])
    markets = filters.get("market_data", [])

    karnataka_markets = [
        {
            "id": market.get("id"),
            "name": market.get("mkt_name"),
            "district_id": market.get("district_id")
        }
        for market in markets
        if str(market.get("state_id")) == str(KARNATAKA_STATE_ID)
    ]

    crop_list = [
        {
            "id": crop.get("cmdt_id"),
            "name": crop.get("cmdt_name")
        }
        for crop in commodities
    ]

    return {
        "success": True,
        "state": "Karnataka",
        "state_id": KARNATAKA_STATE_ID,
        "crops": crop_list,
        "markets": karnataka_markets,
        "source": "AGMARKNET"
    }


def find_commodity(crop_name, filters):

    commodities = filters.get("cmdt_data", [])

    for commodity in commodities:
        name = commodity.get("cmdt_name", "")

        if name.strip().lower() == crop_name.strip().lower():
            return commodity

    return None


def find_market(market_name, filters):

    markets = filters.get("market_data", [])

    for market in markets:

        if str(market.get("state_id")) != str(KARNATAKA_STATE_ID):
            continue

        name = market.get("mkt_name", "")

        if name.strip().lower() == market_name.strip().lower():
            return market

    return None


@app.get("/market")
def get_market_prices(
    crop: str = Query(default="Potato"),
    market: str = Query(default="Bengaluru APMC")
):

    filters = get_agmarknet_filters()

    commodity = find_commodity(crop, filters)

    if not commodity:
        raise HTTPException(
            status_code=404,
            detail=f"Crop '{crop}' was not found in AGMARKNET."
        )

    selected_market = find_market(market, filters)

    if not selected_market:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Market '{market}' was not found in Karnataka. "
                "Check /market/filters for available markets."
            )
        )

    commodity_id = commodity.get("cmdt_id")
    market_id = selected_market.get("id")

    cache_key = f"{commodity_id}_{market_id}"

    now = time.time()

    if (
        cache_key in market_cache
        and now - market_cache[cache_key]["time"] < CACHE_SECONDS
    ):
        return market_cache[cache_key]["data"]

    params = {
        "marketId": market_id,
        "stateId": KARNATAKA_STATE_ID,
        "commodityId": commodity_id,
        "includeExcel": "false"
    }

    try:
        response = requests.get(
            AGMARKNET_MARKET_PRICE_URL,
            params=params,
            headers=AGMARKNET_HEADERS,
            timeout=30
        )

        response.raise_for_status()

        result = response.json()

        if not result.get("success"):
            raise HTTPException(
                status_code=502,
                detail="AGMARKNET could not return market prices."
            )

        columns = result.get("columns", [])
        rows = result.get("data", [])

        date_columns = [
            column.get("key")
            for column in columns
            if column.get("key")
            and column.get("key")[:4].isdigit()
            and column.get("key")[4:5] == "-"
        ]

        date_columns.sort(reverse=True)

        prices = []

        for row in rows:

            daily_prices = []

            for date in date_columns:

                value = row.get(date)

                daily_prices.append({
                    "date": date,
                    "modal_price": (
                        value if isinstance(value, (int, float))
                        else None
                    ),
                    "status": (
                        "reported"
                        if isinstance(value, (int, float))
                        else "NR"
                    )
                })

            latest_price = None
            latest_date = None

            for item in daily_prices:
                if item["status"] == "reported":
                    latest_price = item["modal_price"]
                    latest_date = item["date"]
                    break

            prices.append({
                "crop": commodity.get("cmdt_name"),
                "market": selected_market.get("mkt_name"),
                "state": "Karnataka",
                "variety": row.get("variety"),
                "latest_date": latest_date,
                "modal_price": latest_price,
                "unit": row.get("unitOfPrice"),
                "daily_prices": daily_prices
            })

        output = {
            "success": True,
            "source": "AGMARKNET Government Market Data",
            "data_type": "REAL_REPORTED_MARKET_PRICES",
            "state": "Karnataka",
            "crop": commodity.get("cmdt_name"),
            "market": selected_market.get("mkt_name"),
            "report_title": result.get("title"),
            "total_records": len(prices),
            "prices": prices,
            "message": (
                "Prices are official reported modal prices. "
                "NR means no report was available for that date. "
                "The latest reported date may differ between varieties."
            )
        }

        market_cache[cache_key] = {
            "data": output,
            "time": now
        }

        return output

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="AGMARKNET price request timed out. Try again."
        )

    except requests.exceptions.RequestException:
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve prices from AGMARKNET."
        )

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="AGMARKNET returned an invalid price response."
        )


# ==========================================
# LEAF IMAGE UPLOAD
# ==========================================
def get_disease_guidance(crop, disease):
    disease_name = disease.lower()

    if disease_name == "healthy":
        return {
            "treatment": "No disease symptoms were identified. Continue regular crop care.",
            "prevention": [
                "Inspect leaves regularly.",
                "Maintain proper watering.",
                "Keep the field free from weeds.",
                "Use balanced fertilizers based on soil testing."
            ]
        }

    guidance = {
        "bacterial": {
            "treatment": "Remove severely affected leaves. Seek local agricultural advice for suitable disease management.",
            "prevention": [
                "Avoid working with wet plants.",
                "Use clean tools.",
                "Avoid overhead watering.",
                "Use disease-free seeds or seedlings."
            ]
        },
        "early blight": {
            "treatment": "Remove affected leaves and dispose of infected plant material safely.",
            "prevention": [
                "Avoid wetting leaves while watering.",
                "Maintain spacing between plants.",
                "Rotate crops where possible.",
                "Remove plant debris."
            ]
        },
        "late blight": {
            "treatment": "Remove severely infected plant parts and seek prompt agricultural expert advice.",
            "prevention": [
                "Avoid prolonged leaf wetness.",
                "Improve air circulation.",
                "Monitor plants regularly.",
                "Remove infected plant debris."
            ]
        },
        "powdery mildew": {
            "treatment": "Remove badly affected leaves and improve airflow around plants.",
            "prevention": [
                "Maintain proper plant spacing.",
                "Avoid excessive nitrogen fertilizer.",
                "Inspect leaves regularly.",
                "Keep the growing area well ventilated."
            ]
        },
        "rust": {
            "treatment": "Remove heavily affected leaves where practical and seek local agricultural advice.",
            "prevention": [
                "Monitor plants for orange or brown spots.",
                "Remove infected plant debris.",
                "Maintain suitable plant spacing.",
                "Use resistant varieties where available."
            ]
        },
        "mosaic virus": {
            "treatment": "Remove severely infected plants where advised by an agricultural expert.",
            "prevention": [
                "Use virus-free planting material.",
                "Control insect vectors through integrated pest management.",
                "Disinfect tools.",
                "Remove infected crop residues."
            ]
        }
    }

    for keyword, advice in guidance.items():
        if keyword in disease_name:
            return advice

    return {
        "treatment": "The disease needs further confirmation. Consult an agricultural expert before applying treatment.",
        "prevention": [
            "Remove severely affected plant material where appropriate.",
            "Avoid overwatering.",
            "Maintain proper plant spacing.",
            "Monitor the crop regularly."
        ]
    }
@app.post("/analyze")
async def analyze_leaf(file: UploadFile = File(...)):

    allowed_types = ["image/jpeg", "image/png", "image/webp"]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG or WEBP image."
        )

    image_data = await file.read()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    try:
        image = Image.open(io.BytesIO(image_data)).convert("RGB")

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid plant image."
        )

    try:
        input_tensor = AI_TRANSFORM(image).unsqueeze(0).to(DEVICE)

        with torch.inference_mode():
            outputs = model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)

            confidence, predicted_index = torch.max(
                probabilities, dim=1
            )

        predicted_class = class_names[predicted_index.item()]
        confidence_percent = round(
            confidence.item() * 100, 2
        )
        needs_review = confidence_percent < 90

        confidence_message = (
            "Low confidence. Please verify this result with an agricultural expert."
            if needs_review
            else "Confidence is above the review threshold."
        )
        parts = predicted_class.split("___", 1)

        crop = parts[0] if len(parts) > 1 else "Unknown"
        disease = parts[1].replace("_", " ") if len(parts) > 1 else predicted_class
        guidance = get_disease_guidance(crop, disease)
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                """
                INSERT INTO scan_history
                (filename, crop, disease, confidence, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    file.filename,
                    crop,
                    disease,
                    confidence_percent,
                    datetime.now().isoformat()
                )
            )
        return {
            "success": True,
            "filename": file.filename,
            "ai_status": "prediction_completed",
            "model": "MobileNetV2",
            "crop": crop,
            "disease": disease,
            "predicted_class": predicted_class,
"confidence": confidence_percent,
"needs_review": needs_review,
"confidence_message": confidence_message,
"guidance": guidance,
"message": "AI leaf prediction completed."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI prediction failed: {str(e)}"
        )
@app.get("/history")
def get_scan_history():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM scan_history ORDER BY id DESC"
        ).fetchall()

    return {
        "success": True,
        "total_scans": len(rows),
        "history": [dict(row) for row in rows]
    }