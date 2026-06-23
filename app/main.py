import os
import logging
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from prometheus_fastapi_instrumentator import Instrumentator

# --- THÊM THƯ VIỆN KẾT NỐI MONGODB ---
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# =====================================================================
# 1. CẤU HÌNH OPENTELEMETRY TRACES & LOGGING
# =====================================================================
provider = TracerProvider()
otlp_exporter = OTLPSpanExporter(endpoint="http://tempo:4317", insecure=True)
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="CRUD API with LGTM Stack & MongoDB")

frontend_origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://192.168.56.1:5173,https://chaters.shop,https://fe.chaters.shop"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# 2. KÍCH HOẠT METRICS & TRACES CHO FASTAPI
# =====================================================================
Instrumentator().instrument(app).expose(app)
FastAPIInstrumentor.instrument_app(app)

def get_trace_id():
    current_span = trace.get_current_span()
    context = current_span.get_span_context()
    return format(context.trace_id, "032x") if context.is_valid else "00000000000000000000000000000000"

# =====================================================================
# 3. KẾT NỐI DATABASE MONGODB
# =====================================================================
# Đọc biến môi trường từ Compose, nếu không có sẽ dùng mặc định
MONGO_URL = os.getenv("MONGO_URL", "mongodb://admin:admin123@mongodb:27017/chaters_db?authSource=admin")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "chaters_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client[MONGO_DB_NAME]
items_collection = db.get_collection("items")
counters_collection = db.get_collection("counters")

class Item(BaseModel):
    name: str
    price: float
    description: Optional[str] = None

# Hàm tự tăng ID số nguyên trong MongoDB (thay thế logic max keys cũ)
async def get_next_sequence_value(sequence_name: str) -> int:
    sequence_document = await counters_collection.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True
    )
    return sequence_document["sequence_value"]

# Khởi tạo dữ liệu mẫu nếu Database trống khi chạy ứng dụng lần đầu
@app.on_event("startup")
async def startup_db_client():
    for _ in range(10):
        try:
            await client.admin.command("ping")
            break
        except Exception:
            await asyncio.sleep(2)
    else:
        raise RuntimeError("Không thể kết nối tới MongoDB")

    if await items_collection.count_documents({}) == 0:
        # Tạo counter ban đầu
        await counters_collection.update_one(
            {"_id": "item_id"}, {"$set": {"sequence_value": 2}}, upsert=True
        )
        # Chèn 2 bản ghi mặc định
        await items_collection.insert_many([
            {"_id": 1, "name": "Laptop Dell", "price": 1500.0, "description": "Core i7, 16GB RAM"},
            {"_id": 2, "name": "Chuột Không Dây", "price": 25.0, "description": "Chuột Silent công thái học"}
        ])
        logger.info("🍃 Đã khởi tạo dữ liệu mẫu thành công vào MongoDB!")

# =====================================================================
# 4. CÁC ROUTE CRUD ĐÃ CHUYỂN SANG MONGODB (ASYNC / AWAIT)
# =====================================================================

@app.get("/items")
async def read_all_items():
    tid = get_trace_id()
    logger.info(f"[{tid}] [READ_ALL] Người dùng yêu cầu lấy toàn bộ danh sách sản phẩm.")
    
    items = {}
    async for item in items_collection.find():
        item_id = item["_id"]
        items[str(item_id)] = {
            "name": item["name"],
            "price": item["price"],
            "description": item.get("description")
        }
    return {"total": len(items), "data": items}

@app.get("/items/{item_id}")
async def read_item(item_id: int):
    tid = get_trace_id()
    item = await items_collection.find_one({"_id": item_id})
    
    if not item:
        logger.warning(f"[{tid}] [READ_ONE] Thất bại - Không tìm thấy sản phẩm ID: {item_id}")
        raise HTTPException(status_code=404, detail="Sản phẩm không tồn tại")

    logger.info(f"[{tid}] [READ_ONE] Thành công - Lấy thông tin sản phẩm ID: {item_id}")
    return {"name": item["name"], "price": item["price"], "description": item.get("description")}

@app.post("/items")
async def create_item(item: Item):
    tid = get_trace_id()
    
    # Lấy ID số nguyên tự tăng tiếp theo
    new_id = await get_next_sequence_value("item_id")
    
    item_data = item.dict()
    item_data["_id"] = new_id
    
    await items_collection.insert_one(item_data)

    logger.info(f"[{tid}] [CREATE] Thành công - Tạo sản phẩm mới ID: {new_id}, Name: {item.name}")
    del item_data["_id"] # Xóa id thô trước khi trả về client để khớp format cũ
    return {"message": "Tạo thành công", "id": new_id, "data": item_data}

@app.put("/items/{item_id}")
async def update_item(item_id: int, item: Item):
    tid = get_trace_id()
    
    item_data = item.dict()
    result = await items_collection.update_one({"_id": item_id}, {"$set": item_data})
    
    if result.matched_count == 0:
        logger.error(f"[{tid}] [UPDATE] Thất bại - Không tìm thấy ID {item_id} để cập nhật")
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm để sửa")

    logger.info(f"[{tid}] [UPDATE] Thành công - Đã cập nhật sản phẩm ID: {item_id}")
    return {"message": "Cập nhật thành công", "id": item_id, "data": item_data}

@app.delete("/items/{item_id}")
async def delete_item(item_id: int):
    tid = get_trace_id()
    
    item = await items_collection.find_one({"_id": item_id})
    if not item:
        logger.warning(f"[{tid}] [DELETE] Thất bại - Không thể xóa ID {item_id} vì không tồn tại")
        raise HTTPException(status_code=404, detail="Không thể xóa sản phẩm không tồn tại")

    await items_collection.delete_one({"_id": item_id})
    logger.info(f"[{tid}] [DELETE] Thành công - Đã xóa sản phẩm ID: {item_id} ({item['name']})")
    return {"message": "Xóa thành công", "id": item_id}
