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
from typing import Optional
from contextlib import AsyncExitStack
from fastapi.responses import StreamingResponse

load_dotenv()
app = FastAPI()

domains = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500"
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


def convert_tool_format(tool):
    converted_tool = {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description,
            "parameters": {
                "type": "object",
                "properties": tool.inputSchema["properties"],
                # "required": tool.inputSchema["required"]
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

    async def process_query(self, query: str) -> str:
        print("Attempting to connect to MCP server...")
        mcp_transport = StreamableHttpTransport(os.getenv("MCP_SERVER_URL"))
        async with Client(transport=mcp_transport) as client:
            print("Connection established. Initializing session...")
            response = await client.list_tools()
            print("\nConnected to server with tools:", [tool.name for tool in response])
            self.session = client
            self.messages = []
            self.messages.append({
                "role": "user",
                "content": f"You are a chatbot that is only answering any query related to learning about Ishaan Koradia, answer this with the appropriate tools/resources: {query}."
            })
            
            print("Fetching available tools from MCP server...")
            response = await self.session.list_tools()
            available_tools = [convert_tool_format(tool) for tool in response]

            print("Available tools:", [tool['function']['name'] for tool in available_tools])

            response = self.openai.chat.completions.create(
                model="deepseek/deepseek-chat-v3.1:free",
                tools=available_tools,
                messages=self.messages,
                max_completion_tokens=250
            )

            print("OpenAI response:", response) 
            self.messages.append(response.choices[0].message.model_dump())
            # final_text = []
            content = response.choices[0].message
            if content.tool_calls is not None:
                tool_name = content.tool_calls[0].function.name
                tool_args = content.tool_calls[0].function.arguments
                tool_args = json.loads(tool_args) if tool_args else {}
                try:
                    result = await self.session.call_tool(tool_name, tool_args)
                    # final_text.append(f"[Calling tool {tool_name} with args {tool_args}]")
                except Exception as e:
                    print(f"Error calling tool {tool_name}: {e}")
                    result = None
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": content.tool_calls[0].id,
                    "name": tool_name,
                    "content": result.content
                })
                response = self.openai.chat.completions.create(
                    model="deepseek/deepseek-chat-v3.1:free",
                    messages=self.messages,
                    stream=True  # Enable streaming
                )

                print("Streaming OpenAI response:")
                for chunk in response:  # Directly iterate over the response
                    streamed_content = chunk["choices"][0]["delta"]["content"]
                    # print(streamed_content, end="", flush=True)
                    yield streamed_content
            # else:
            #     final_text.append(content.content)
            # return "\n".join(final_text)

    async def cleanup(self):
        await self.exit_stack.aclose()

@app.post("/chat", response_class=StreamingResponse)
async def chat_endpoint(chat: ChatRequest):
    user_message = chat.message
    client = MCPClient()

    async def response_stream():
        try:
            async for chunk in client.process_query(user_message):
                yield chunk
        except Exception as e:
            yield f"Error: {str(e)}"
        finally:
            await client.cleanup()

    return StreamingResponse(response_stream(), media_type="text/plain")

@app.get("/")
def root():
    return {"status": "MCP server running"}
