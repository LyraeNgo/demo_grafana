from fastapi import FastAPI
import os
from dotenv import load_dotenv
import logging
from fastapi import FastAPI
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# 1. Cấu hình OpenTelemetry Tracer
provider = TracerProvider()
# Cấu hình exporter gửi về Tempo (mặc định Tempo lắng nghe OTLP gRPC ở cổng 4317)
otlp_exporter = OTLPSpanExporter(endpoint="http://localhost:4317", insecure=True)
provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

# 2. Cấu hình Logging của Python để in ra định dạng dễ nhìn
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
load_dotenv()

app = FastAPI()

PORT = int(os.getenv("PORT", 8000))

FastAPIInstrumentor.instrument_app(app)

@app.get("/")
def root(item:str=None):
     current_span = trace.get_current_span()
     context = current_span.get_span_context()
    
    # ĐÂY LÀ NƠI BẠN LẤY TRACE ID
     if context.is_valid:
        # Chuyển trace_id từ dạng số sang chuỗi Hex (32 ký tự) để dùng cho Tempo
        trace_id = format(context.trace_id, "032x")
     else:
        trace_id = "None"

    # In ra console/log kèm theo Trace ID
     logger.info(f"[{trace_id}] Đang xử lý request tại endpoint root")
    
     return {
        "message": "Hello",
        "your_trace_id": trace_id  # Trả về luôn cho client nếu muốn debug nhanh
     }


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
