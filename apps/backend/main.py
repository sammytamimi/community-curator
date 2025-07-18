import os
from dotenv import load_dotenv
from fastapi import FastAPI
from routers.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Flavia Backend")

load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] in dev
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(chat_router)


    
    
