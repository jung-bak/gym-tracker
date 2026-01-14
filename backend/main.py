from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class HealthCheck(BaseModel):
    status: str
    version: str

@app.get("/", response_model=HealthCheck)
def read_root():
    return HealthCheck(status="ok", version="0.1.0")
