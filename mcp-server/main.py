from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow CORS for local development and your website
domains = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://ishaankoradia.com"  # Replace with your actual domain
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=domains,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat: ChatRequest):
    # Simple echo bot logic (replace with real chatbot logic)
    user_message = chat.message
    bot_response = f"You said: {user_message}"
    return ChatResponse(response=bot_response)

@app.get("/")
def root():
    return {"status": "MCP server running"}
