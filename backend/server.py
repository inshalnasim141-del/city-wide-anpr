from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import random
import string
import uuid
import math
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ------------------------- DB -------------------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="City-Wide ANPR Trajectory Engine")
api = APIRouter(prefix="/api")

JWT_ALGO = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("anpr")

# ------------------------- Helpers -------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()

def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": now_utc() + timedelta(hours=12), "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": payload["sub"]}, {"password_hash": 0, "_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*roles):
    async def _dep(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles and "admin" not in [user.get("role")]:
            if user.get("role") not in roles:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _dep

# ------------------------- Models -------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str

class BlacklistCreate(BaseModel):
    plate: str
    reason: str
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    notes: Optional[str] = ""

class BlacklistOut(BaseModel):
    id: str
    plate: str
    reason: str
    priority: str
    notes: str
    created_at: str
    created_by: str

class AlertActionRequest(BaseModel):
    action: Literal["acknowledge", "escalate", "close"]
    note: Optional[str] = ""

# ------------------------- Auth Routes -------------------------
@api.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"], user["role"])
    response.set_cookie(
        key="access_token", value=token, httponly=True, secure=True,
        samesite="none", max_age=43200, path="/"
    )
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"], "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}

# ------------------------- Cameras -------------------------
@api.get("/cameras")
async def list_cameras(user: dict = Depends(get_current_user)):
    cams = await db.cameras.find({}, {"_id": 0}).to_list(2000)
    return cams

# ------------------------- Detections -------------------------
@api.get("/detections")
async def list_detections(
    plate: Optional[str] = None,
    camera_id: Optional[str] = None,
    limit: int = 100,
    user: dict = Depends(get_current_user),
):
    q = {}
    if plate:
        q["plate"] = {"$regex": plate.upper(), "$options": "i"}
    if camera_id:
        q["camera_id"] = camera_id
    detections = await db.detections.find(q, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return detections

@api.post("/detections/simulate")
async def simulate_detections(count: int = 5, user: dict = Depends(get_current_user)):
    """Generates fresh detections to keep the live feed alive."""
    cameras = await db.cameras.find({"status": "online"}, {"_id": 0}).to_list(500)
    plates = await db.plates_pool.find({}, {"_id": 0}).to_list(1000)
    blacklist = await db.blacklist.find({}, {"_id": 0}).to_list(500)
    blacklist_plates = [b["plate"] for b in blacklist]

    if not cameras or not plates:
        return {"created": 0}

    new_docs = []
    for _ in range(count):
        cam = random.choice(cameras)
        # 10% chance of blacklist hit if any
        if blacklist_plates and random.random() < 0.10:
            plate = random.choice(blacklist_plates)
        else:
            plate = random.choice(plates)["plate"]
        det = {
            "id": str(uuid.uuid4()),
            "plate": plate,
            "camera_id": cam["id"],
            "camera_name": cam["name"],
            "lat": cam["lat"],
            "lng": cam["lng"],
            "timestamp": iso(now_utc()),
            "confidence": round(random.uniform(0.82, 0.99), 3),
            "speed_kph": round(random.uniform(20, 95), 1),
            "direction": random.choice(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]),
            "vehicle_type": random.choice(["car", "truck", "motorcycle", "van", "bus"]),
        }
        new_docs.append(det)

        # Fire alert if blacklisted
        if plate in blacklist_plates:
            bl = next(b for b in blacklist if b["plate"] == plate)
            alert = {
                "id": str(uuid.uuid4()),
                "type": "blacklist_hit",
                "plate": plate,
                "reason": bl.get("reason", ""),
                "priority": bl.get("priority", "medium"),
                "camera_id": cam["id"],
                "camera_name": cam["name"],
                "lat": cam["lat"],
                "lng": cam["lng"],
                "detection_id": det["id"],
                "status": "open",
                "created_at": iso(now_utc()),
                "history": [],
            }
            await db.alerts.insert_one(alert)

    if new_docs:
        await db.detections.insert_many(new_docs)
    return {"created": len(new_docs)}

# ------------------------- Trajectory -------------------------
def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))

@api.get("/trajectory")
async def trajectory(
    plate: str,
    hours: int = 24,
    user: dict = Depends(get_current_user),
):
    plate = plate.upper().strip()
    since = iso(now_utc() - timedelta(hours=hours))
    dets = await db.detections.find(
        {"plate": plate, "timestamp": {"$gte": since}},
        {"_id": 0},
    ).sort("timestamp", 1).to_list(1000)

    hops = []
    total_km = 0.0
    for i, d in enumerate(dets):
        seg = None
        if i > 0:
            prev = dets[i - 1]
            km = haversine_km(prev["lat"], prev["lng"], d["lat"], d["lng"])
            t_prev = datetime.fromisoformat(prev["timestamp"])
            t_now = datetime.fromisoformat(d["timestamp"])
            minutes = max((t_now - t_prev).total_seconds() / 60.0, 0.01)
            avg_kph = (km / (minutes / 60.0)) if minutes > 0 else 0
            total_km += km
            seg = {"distance_km": round(km, 2), "minutes": round(minutes, 1), "avg_kph": round(avg_kph, 1)}
        hops.append({**d, "segment_from_prev": seg})

    return {
        "plate": plate,
        "hops": hops,
        "hop_count": len(hops),
        "total_distance_km": round(total_km, 2),
        "first_seen": hops[0]["timestamp"] if hops else None,
        "last_seen": hops[-1]["timestamp"] if hops else None,
    }

# ------------------------- Blacklist -------------------------
@api.get("/blacklist")
async def list_blacklist(user: dict = Depends(get_current_user)):
    return await db.blacklist.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.post("/blacklist")
async def add_blacklist(payload: BlacklistCreate, user: dict = Depends(get_current_user)):
    if user["role"] not in ("admin", "investigator"):
        raise HTTPException(status_code=403, detail="Only investigators/admins may modify blacklist")
    plate = payload.plate.upper().strip()
    existing = await db.blacklist.find_one({"plate": plate})
    if existing:
        raise HTTPException(status_code=409, detail="Plate already blacklisted")
    doc = {
        "id": str(uuid.uuid4()),
        "plate": plate,
        "reason": payload.reason,
        "priority": payload.priority,
        "notes": payload.notes or "",
        "created_at": iso(now_utc()),
        "created_by": user["email"],
    }
    await db.blacklist.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.delete("/blacklist/{plate}")
async def delete_blacklist(plate: str, user: dict = Depends(get_current_user)):
    if user["role"] not in ("admin", "investigator"):
        raise HTTPException(status_code=403, detail="Only investigators/admins may modify blacklist")
    result = await db.blacklist.delete_one({"plate": plate.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

# ------------------------- Alerts -------------------------
@api.get("/alerts")
async def list_alerts(
    status: Optional[str] = None,
    limit: int = 200,
    user: dict = Depends(get_current_user),
):
    q = {}
    if status:
        q["status"] = status
    alerts = await db.alerts.find(q, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return alerts

@api.post("/alerts/{alert_id}/action")
async def action_alert(alert_id: str, payload: AlertActionRequest, user: dict = Depends(get_current_user)):
    alert = await db.alerts.find_one({"id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    status_map = {"acknowledge": "acknowledged", "escalate": "escalated", "close": "closed"}
    new_status = status_map[payload.action]
    entry = {
        "action": payload.action,
        "by": user["email"],
        "at": iso(now_utc()),
        "note": payload.note or "",
    }
    await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {"status": new_status}, "$push": {"history": entry}},
    )
    updated = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    return updated

# ------------------------- Analytics -------------------------
@api.get("/analytics/kpis")
async def kpis(user: dict = Depends(get_current_user)):
    since_1h = iso(now_utc() - timedelta(hours=1))
    since_24h = iso(now_utc() - timedelta(hours=24))

    total_detections = await db.detections.count_documents({})
    det_last_hour = await db.detections.count_documents({"timestamp": {"$gte": since_1h}})
    det_last_24h = await db.detections.count_documents({"timestamp": {"$gte": since_24h}})
    open_alerts = await db.alerts.count_documents({"status": "open"})
    cameras_online = await db.cameras.count_documents({"status": "online"})
    cameras_total = await db.cameras.count_documents({})
    blacklist_size = await db.blacklist.count_documents({})

    return {
        "total_detections": total_detections,
        "detections_last_hour": det_last_hour,
        "detections_last_24h": det_last_24h,
        "open_alerts": open_alerts,
        "cameras_online": cameras_online,
        "cameras_total": cameras_total,
        "blacklist_size": blacklist_size,
    }

@api.get("/analytics/hourly")
async def hourly_flow(user: dict = Depends(get_current_user)):
    since = now_utc() - timedelta(hours=24)
    dets = await db.detections.find(
        {"timestamp": {"$gte": iso(since)}},
        {"_id": 0, "timestamp": 1},
    ).to_list(20000)
    buckets = {i: 0 for i in range(24)}
    for d in dets:
        try:
            t = datetime.fromisoformat(d["timestamp"])
            hours_ago = int((now_utc() - t).total_seconds() // 3600)
            if 0 <= hours_ago < 24:
                buckets[23 - hours_ago] += 1
        except Exception:
            continue
    return [{"hour": f"-{23-i}h" if i < 23 else "now", "count": buckets[i]} for i in range(24)]

@api.get("/analytics/top-cameras")
async def top_cameras(user: dict = Depends(get_current_user)):
    since = iso(now_utc() - timedelta(hours=24))
    pipeline = [
        {"$match": {"timestamp": {"$gte": since}}},
        {"$group": {"_id": "$camera_id", "name": {"$first": "$camera_name"}, "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8},
    ]
    result = await db.detections.aggregate(pipeline).to_list(20)
    return [{"camera_id": r["_id"], "name": r["name"], "count": r["count"]} for r in result]

@api.get("/health")
async def health():
    return {"status": "ok", "time": iso(now_utc())}

# ------------------------- Startup / Seed -------------------------
CITY_CENTER = (12.9716, 77.5946)  # Bengaluru

async def seed_users():
    seeds = [
        (os.environ.get("ADMIN_EMAIL"), os.environ.get("ADMIN_PASSWORD"), "System Admin", "admin"),
        (os.environ.get("OPERATOR_EMAIL"), os.environ.get("OPERATOR_PASSWORD"), "Traffic Operator", "operator"),
        (os.environ.get("INVESTIGATOR_EMAIL"), os.environ.get("INVESTIGATOR_PASSWORD"), "Lead Investigator", "investigator"),
    ]
    for email, password, name, role in seeds:
        if not email or not password:
            continue
        existing = await db.users.find_one({"email": email})
        if existing is None:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": email.lower(),
                "password_hash": hash_password(password),
                "name": name,
                "role": role,
                "created_at": iso(now_utc()),
            })
        elif not verify_password(password, existing["password_hash"]):
            await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(password)}})

async def seed_cameras():
    count = await db.cameras.count_documents({})
    if count > 0:
        return
    zones = ["MG Road", "Whitefield", "Silk Board", "Electronic City", "Indiranagar",
             "Koramangala", "Hebbal", "Marathahalli", "Yeshwantpur", "Jayanagar",
             "Bannerghatta", "KR Puram", "Airport Road", "ORR Sarjapur", "Domlur",
             "Richmond Circle", "Trinity Circle", "Cubbon Park", "Majestic", "Rajajinagar"]
    cams = []
    for i, z in enumerate(zones):
        lat = CITY_CENTER[0] + random.uniform(-0.09, 0.09)
        lng = CITY_CENTER[1] + random.uniform(-0.09, 0.09)
        cams.append({
            "id": f"CAM-{1000+i}",
            "name": f"{z} Junction",
            "zone": z,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "status": "online" if random.random() > 0.1 else "offline",
            "direction": random.choice(["N", "S", "E", "W"]),
            "fov_deg": random.choice([45, 60, 75, 90]),
            "installed_at": iso(now_utc() - timedelta(days=random.randint(30, 800))),
        })
    await db.cameras.insert_many(cams)

async def seed_plate_pool():
    if await db.plates_pool.count_documents({}) > 0:
        return
    plates = []
    used = set()
    prefixes = ["KA01", "KA03", "KA05", "KA20", "KA51", "MH12", "TN07", "DL8C", "AP31", "GJ01"]
    while len(plates) < 40:
        p = f"{random.choice(prefixes)}-{random.choice(string.ascii_uppercase)}{random.choice(string.ascii_uppercase)}-{random.randint(1000, 9999)}"
        if p not in used:
            used.add(p)
            plates.append({"plate": p})
    await db.plates_pool.insert_many(plates)

async def seed_blacklist():
    if await db.blacklist.count_documents({}) > 0:
        return
    pool = await db.plates_pool.find({}).to_list(40)
    reasons = [
        ("Reported stolen", "high"),
        ("Outstanding warrant", "critical"),
        ("Unpaid traffic fines", "low"),
        ("Suspicious activity - watchlist", "medium"),
        ("Uninsured vehicle", "low"),
    ]
    docs = []
    for p in random.sample(pool, 5):
        r, pri = random.choice(reasons)
        docs.append({
            "id": str(uuid.uuid4()),
            "plate": p["plate"],
            "reason": r,
            "priority": pri,
            "notes": "",
            "created_at": iso(now_utc() - timedelta(days=random.randint(1, 30))),
            "created_by": "system",
        })
    await db.blacklist.insert_many(docs)

async def seed_detections():
    if await db.detections.count_documents({}) > 500:
        return
    cams = await db.cameras.find({"status": "online"}, {"_id": 0}).to_list(500)
    plates = await db.plates_pool.find({}, {"_id": 0}).to_list(1000)
    if not cams or not plates:
        return
    docs = []
    # Create 800 detections in the last 24h
    for _ in range(800):
        cam = random.choice(cams)
        plate = random.choice(plates)["plate"]
        t = now_utc() - timedelta(minutes=random.randint(0, 24 * 60))
        docs.append({
            "id": str(uuid.uuid4()),
            "plate": plate,
            "camera_id": cam["id"],
            "camera_name": cam["name"],
            "lat": cam["lat"],
            "lng": cam["lng"],
            "timestamp": iso(t),
            "confidence": round(random.uniform(0.82, 0.99), 3),
            "speed_kph": round(random.uniform(15, 95), 1),
            "direction": random.choice(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]),
            "vehicle_type": random.choice(["car", "truck", "motorcycle", "van", "bus"]),
        })
    await db.detections.insert_many(docs)

    # For a couple of specific plates, seed a nice trajectory sequence
    demo_plate = plates[0]["plate"]
    ordered_cams = random.sample(cams, min(8, len(cams)))
    for i, cam in enumerate(ordered_cams):
        t = now_utc() - timedelta(hours=3) + timedelta(minutes=i * 8)
        await db.detections.insert_one({
            "id": str(uuid.uuid4()),
            "plate": demo_plate,
            "camera_id": cam["id"],
            "camera_name": cam["name"],
            "lat": cam["lat"],
            "lng": cam["lng"],
            "timestamp": iso(t),
            "confidence": round(random.uniform(0.9, 0.99), 3),
            "speed_kph": round(random.uniform(30, 70), 1),
            "direction": "E",
            "vehicle_type": "car",
        })

async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.cameras.create_index("id", unique=True)
    await db.detections.create_index([("plate", 1), ("timestamp", -1)])
    await db.detections.create_index("timestamp")
    await db.alerts.create_index([("status", 1), ("created_at", -1)])
    await db.blacklist.create_index("plate", unique=True)

@app.on_event("startup")
async def on_startup():
    await ensure_indexes()
    await seed_users()
    await seed_cameras()
    await seed_plate_pool()
    await seed_blacklist()
    await seed_detections()
    logger.info("ANPR backend seed complete.")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()

# Register router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
