from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastmcp.client.transports import StreamableHttpTransport
from mcp import ClientSession
# from mcp.client.streamable_http import streamablehttp_client
from openai import OpenAI
from fastmcp import Client
from dotenv import load_dotenv
from pydantic import BaseModel
import json
import os
from typing import Optional, AsyncGenerator, List, Dict
from contextlib import AsyncExitStack
from fastapi.responses import StreamingResponse
import asyncio
# import httpx

load_dotenv(override=True)
print("Loaded MCP_SERVER_URL:", os.getenv("MCP_SERVER_URL"))
print("Loaded PERSONAL_SITE_SERVICE_URL:", os.getenv("PERSONAL_SITE_SERVICE_URL"))

app = FastAPI()

domains = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500",
    "https://ishaankoradia.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:5000",
        "https://ishaankoradia.com",
        os.getenv("PERSONAL_SITE_SERVICE_URL")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConversationMessage(BaseModel):
    content: str
    role: str  # 'user' or 'assistant'
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ConversationMessage]] = []

class ChatResponse(BaseModel):
    response: str


def convert_tool_format(tool):
    converted_tool = {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description,
            "parameters": {
                "type": "object",
                "properties": tool.inputSchema["properties"],
                "required": tool.inputSchema.get("required") or None
            }
        }
    }
    return converted_tool

class MCPClient:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.openai = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.messages = []

    async def process_query(self, query: str, conversation_history: Optional[List[ConversationMessage]] = None) -> AsyncGenerator[str, None]:
        print("Attempting to connect to MCP server...")
        mcp_transport = StreamableHttpTransport(os.getenv("MCP_SERVER_URL"))
        async with Client(transport=mcp_transport) as client:
            print("Connection established. Initializing session...")
            self.tools = await client.list_tools()
            print("\nConnected to server with tools:", [tool.name for tool in self.tools])
            self.session = client
            
            self.messages = [
                {
                    "role": "system",
                    "content": (
                        "You are IshaanBot, a helpful assistant answering questions about Ishaan Koradia. "
                        "You have access to comprehensive information about Ishaan's background, projects, skills, education, and professional experience. "
                        "Use ONLY the tools provided to you to get accurate information. "
                        "Be conversational and remember previous parts of our conversation. "
                        "If asked about something not covered by your tools, politely explain what you can help with instead. "
                        "Never invent or assume information - always use the tools to get real data."
                    )
                }
            ]
            
            if conversation_history:
                for msg in conversation_history[-10:]:
                    self.messages.append({
                        "role": msg.role,
                        "content": msg.content
                    })
            
            self.messages.append({
                "role": "user",
                "content": query
            })

            print("Fetching available tools from MCP server...")
            # response = await self.session.list_tools()
            available_tools = [convert_tool_format(tool) for tool in self.tools]

            print("Available tools:", [tool['function']['name'] for tool in available_tools])

            response = self.openai.chat.completions.create(
                model="nvidia/nemotron-nano-9b-v2:free",
                tools=available_tools,
                messages=self.messages,
                max_completion_tokens=250
            )

            print("OpenAI response:", response) 
            self.messages.append(response.choices[0].message.model_dump())
            # final_text = []
            content = response.choices[0].message
            print("OpenAI tool calls:", content.tool_calls)
            if content.tool_calls is not None:
                tool_name = content.tool_calls[0].function.name
                tool_args = content.tool_calls[0].function.arguments
                tool_args = json.loads(tool_args) if tool_args else {}
                try:
                    print("Calling tool:", tool_name, "with args:", tool_args)
                    if tool_name not in [tool['function']['name'] for tool in available_tools]:
                        print("Tool not found in available tools.")
                    else:
                        result = await self.session.call_tool(tool_name, tool_args)
                        print("Tool result:", result)
                except Exception as e:
                    print(f"Error calling tool {tool_name}: {e}")
                    result = None
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": content.tool_calls[0].id,
                    "name": tool_name,
                    "content": result.content if result else "Sorry, but I couldn't complete your request. Could you please clarify what you're asking for?"
                })
                response = self.openai.chat.completions.create(
                    model="nvidia/nemotron-nano-9b-v2:free",
                    messages=self.messages,
                    stream=True
                )

                print("Streaming OpenAI response:")
                for chunk in response:
                    streamed_content = chunk.choices[0].delta.content
                    for letter in streamed_content:
                        # print(letter, end="", flush=True)
                        yield letter
                        await asyncio.sleep(0.05)
            else:
                print("No tool calls made. Streaming direct response:")
                # Get the direct response content and stream it character by character
                direct_content = response.choices[0].message.content
                if direct_content:
                    for letter in direct_content:
                        yield letter
                        await asyncio.sleep(0.05)
                    
    async def cleanup(self):
        await self.exit_stack.aclose()

@app.post("/chat", response_class=StreamingResponse)
async def chat_endpoint(chat: ChatRequest):
    user_message = chat.message
    conversation_history = chat.conversation_history
    
    print(f"Received message: {user_message}")
    print(f"Conversation history length: {len(conversation_history) if conversation_history else 0}")
    if conversation_history:
        print("Last few messages in history:")
        for msg in conversation_history[-3:]:  # Show last 3 messages
            print(f"  {msg.role}: {msg.content[:50]}...")
    
    client = MCPClient()
    print("Ensuring all services are running...")
    # await client.ensure_services_running()
    print("All services are running. Proceeding with query processing...")
    async def response_stream():
        try:
            async for chunk in client.process_query(user_message, conversation_history):
                yield chunk
        except Exception as e:
            yield f"Error: {str(e)}"
        finally:
            await client.cleanup()
    return StreamingResponse(response_stream(), media_type="text/plain")

@app.options("/chat")
def options_chat():
    return {"Allow": "OPTIONS, POST"}

@app.get("/")
def root():
    return {"status": "MCP server running"}

@app.get("/health")
def health_check():
    return {"status": "active"}
