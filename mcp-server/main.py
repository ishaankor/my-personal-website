from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from fastmcp import FastMCP

fastmcp = FastMCP("My Personal Chatbot")

@fastmcp.resource(uri="data://about_me", name="Information for Ishaan Koradia", description="Helps the user learn about Ishaan Koradia!")
def about_me_resource():
    path = os.path.join(os.path.dirname(__file__), "about_me.txt")
    print(f"Resolved path to about_me.txt: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
    
mcp_app = fastmcp.http_app(path="/mcp")
app = FastAPI(title="MCP Server with Chatbot", lifespan=mcp_app.lifespan)
app.mount("/mcp", mcp_app)

domains = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://ishaankoradia.com",
    "https://ishaankor-chatbot.onrender.com"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=domains,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "openchat/openchat-3.5-0106"

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat: ChatRequest):
    user_message = chat.message
    # Fetch about_me resource from MCP HTTP API
    try:
        resource_url = "https://ishaankor-chatbot.onrender.com/mcp/resource/data://about_me"
        resp = requests.get(resource_url, timeout=10)
        resp.raise_for_status()
        context = resp.text
    except Exception:
        context = ""

    messages = [
        {"role": "system", "content": context},
        {"role": "user", "content": user_message}
    ]
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": OPENROUTER_MODEL,
        "messages": messages
    }
    try:
        resp = requests.post(OPENROUTER_API_URL, headers=headers, json=data, timeout=20)
        resp.raise_for_status()
        result = resp.json()
        answer = result["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Error communicating with OpenRouter: {e}")
        answer = "Sorry, I couldn't get an answer right now."
    return ChatResponse(response=answer)

@app.get("/")
def root():
    return {"status": "MCP server running"}
