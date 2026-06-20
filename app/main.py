from fastapi import FastAPI
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

PORT = int(os.getenv("PORT", 8000))


@app.get("/")
def root(item:str=None):
     if item is not None:
          return {"message": item}
     else:
          return {"Message_from_Minh_Tam": "Yeu Yen Nhi <3<3<3"}
     

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
     return {"item_id": item_id, "q": q}
     
