from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastmcp.client.transports import StreamableHttpTransport
from fastmcp import Client
from pydantic import BaseModel
import requests
import os

app = FastAPI()

domains = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://ishaankoradia.com"
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
    user_message = chat.message
    bot_response = f"You said: {user_message}"
    transport = StreamableHttpTransport(url="https://remotemcpserver-latest-8a0l.onrender.com/mcp")
    client = Client(transport)
    async with client:
            # List available resources
            resources = await client.list_resources()
            print("Resources:", resources)

            # Call a tool
            result = await client.call_tool("my_tool", {"param": "value"})
            print("Tool result:", result)
    return ChatResponse(response=bot_response)
    # user_message = chat.message
    # Fetch about_me resource from MCP server
    # try:
    #     mcp_response = requests.post(
    #         "https://personal-mcp-server-eqcp.onrender.com/mcp",
#             json={"uri": "resource://about_me"},
#             timeout=10
#         )
#         if mcp_response.status_code == 200:
#             about_me = mcp_response.json().get("content", "")
#         else:
#             about_me = ""
#     except Exception:
#         about_me = ""
#     # Inject resource into prompt
#     system_prompt = f"You are a helpful assistant. Here is information about Ishaan Koradia you can use to answer questions:\n\n{about_me}\n\nUser: {user_message}"
#     api_key = os.environ.get("OPENROUTER_API_KEY")
#     if not api_key:
#         return ChatResponse(response="OpenRouter API key not set.")
#     headers = {
#         "Authorization": f"Bearer {api_key}",
#         "Content-Type": "application/json"
#     }
#     data = {
#         "model": "openrouter/llama-2-7b-chat",
#         "messages": [
#             {"role": "system", "content": system_prompt}
#         ]
#     }
#     response = requests.post(
#         "https://openrouter.ai/api/v1/chat/completions",
#         headers=headers,
#         json=data
#     )
#     if response.status_code == 200:
#         result = response.json()
#         bot_response = result["choices"][0]["message"]["content"]
#     else:
#         bot_response = f"OpenRouter error: {response.text}"
#     return ChatResponse(response=bot_response)

@app.get("/")
def root():
    return {"status": "MCP server running"}
