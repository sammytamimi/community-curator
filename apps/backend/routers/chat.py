import asyncio
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from services.rag_agent import agent, config

async def get_token_header():
    return

router = APIRouter(
    prefix="/flavia/chat",
    tags=["items"],
    # dependencies=[Depends(get_token_header)],
    responses={404: {"description": "Not found"}},
)

load_dotenv()
    
    

class HumanQuery(BaseModel):
    query: str

class ChatRequest(BaseModel):
    query: str
    user_information: list
    chatHistory: list




class QueryRequest(BaseModel):
    question: str

@router.post("/")
async def stream_agent(request: QueryRequest):
    user_input = request.question
    messages = [HumanMessage(content=user_input)]

    async def event_generator():
        try:
            async for event in agent.astream_events(
                {"messages": messages},
                config=config,
                version="v2"
            ):
                if event["event"] == "on_chat_model_stream":
                    chunk_content = event["data"]["chunk"].content
                    if chunk_content:
                        yield f"{chunk_content}"
                        await asyncio.sleep(0)
        except Exception as e:
            yield f"data: [ERROR] {str(e)}"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
