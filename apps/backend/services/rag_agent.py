from dotenv import load_dotenv
import os
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, ToolMessage
from operator import add as add_messages
from langchain_openai import AzureChatOpenAI
from langchain_openai import AzureOpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.tools import tool
from langgraph.checkpoint.memory import MemorySaver
from IPython.display import Image, display
import asyncio
import aiohttp
import json

load_dotenv()




# --- Load Models and Vector Store ---

# Initialize the same embedding model used for indexing
embeddings = AzureOpenAIEmbeddings(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT_EMBEDDING"],
    azure_deployment=os.environ["AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME"],
)

# Load the persisted vector store from disk
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DB_DIR = os.path.join(BASE_DIR, "../chroma_db")

vector_store = Chroma(
    collection_name="approved_docs",
    embedding_function=embeddings,
    persist_directory=CHROMA_DB_DIR
)


# Initialize the LLM needed for the 'generate' step
llm = AzureChatOpenAI(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT_CHAT"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    temperature=0.1,
    streaming=True
)

print("✅ Vector Store and LLM loaded successfully.")

retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 6} # K is the amount of chunks to return
)

@tool
async def retriever_tool(query: str) -> str:
    """
    This tool searches the approved documents and returns the relevant information.
    """

    docs = await retriever.ainvoke(query)

    if not docs:
        return "I found no relevant information in the documentation."
    
    results = []
    for i, doc in enumerate(docs):
        results.append(f"Document {i+1}:\n{doc.page_content}")
    
    return "\n\n".join(results)


@tool
async def flood_monitoring_tool(area_or_region: str = "") -> str:
    """
    This tool fetches current flood warnings and alerts from the UK Environment Agency.
    Use this to get real-time flood information for specific areas or all current floods.
    
    Args:
        area_or_region: Optional area name to filter results (e.g., "Yorkshire", "Thames", "London")
    """
    try:
        url = "http://environment.data.gov.uk/flood-monitoring/id/floods"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status != 200:
                    return f"Unable to fetch flood data. API returned status: {response.status}"
                
                data = await response.json()
                
                if not data.get('items'):
                    return "No current flood warnings or alerts in the UK."
                
                # Filter by area if specified
                floods = data['items']  # Start with all flood warnings (then we filter)
                
                if area_or_region:
                    area_lower = area_or_region.lower()  # Mkae search case-insensitive
                    
                    # Create a new list to store matching flood warnings
                    filtered_floods = []
                    
                    # Check each flood warning one by one
                    for flood_warning in floods:
                        # Get the description field (like "River Thames flooding")
                        description = flood_warning.get('description', '').lower()
                        
                        # Get the EA area name (e.g. "Thames Valley")
                        ea_area = flood_warning.get('eaAreaName', '').lower()
                        
                        # Get the county name (e.g. "Berkshire")
                        county = flood_warning.get('floodArea', {}).get('county', '').lower()
                        
                        # Check if search term appears in ANY of these fields
                        if (area_lower in description or 
                            area_lower in ea_area or 
                            area_lower in county):
                            
                            # If match found, add to filtered list
                            filtered_floods.append(flood_warning)
                    
                    # Replace the original list with filtered results
                    floods = filtered_floods
                
                if not floods:
                    return f"No current flood warnings found for '{area_or_region}'. There may be warnings in other areas."
                
                # Format the results
                results = []
                for flood in floods[:10]:  # Limit to 10 most relevant
                    severity = flood.get('severity', 'Unknown')
                    description = flood.get('description', 'Unknown area')
                    county = flood.get('floodArea', {}).get('county', 'Unknown county')
                    message = flood.get('message', 'No additional information')
                    time_changed = flood.get('timeMessageChanged', 'Unknown time')
                    
                    result = f"""
Area: {description} ({county})
Severity: {severity}
Latest Update: {time_changed}
Message: {message[:200]}{'...' if len(message) > 200 else ''}
---"""
                    results.append(result)
                
                summary = f"Found {len(floods)} active flood warning(s)"
                if area_or_region:
                    summary += f" for '{area_or_region}'"
                summary += ":\n\n"
                
                return summary + "\n".join(results)
                
    except Exception as e:
        return f"Error fetching flood data: {str(e)}. Please try again or contact emergency services on 999 if this is urgent."

tools = [retriever_tool, flood_monitoring_tool]

llm = llm.bind_tools(tools)

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]


def should_continue(state: AgentState):
    """Check if the last message contains tool calls."""
    result = state['messages'][-1]
    return hasattr(result, 'tool_calls') and len(result.tool_calls) > 0


system_prompt = """
You are a highly inquisitive assistant, named Flavia, who helps people prepare, respond to, or deal with the effects of a flood in the UK.
You ask relevant follow up questions to gather required context. When users are in distress, you may skip detail.
Responses should be concise, action-oriented and reassuring
avoiding overwhelming the reader with excessive detail, but equally cannot ignore the potential severity of flooding situations.

You have access to:
1. Approved British Red Cross flooding guidance documents
2. Real-time flood warnings and alerts from the UK Environment Agency

Only answer questions related to flooding and DO NOT fabricate answers to questions that are outside of this core task.
If you are unable to answer a question, instead offer alternative and relevant flooding related questions you can discuss with the user.
You work for the British Red Cross. Use the following pieces of retrieved context to answer the question. Use British English. If it seems like an absolute emergency, tell the user to contact emergency services at 999. Use three sentences maximum and keep the answer concise.
Please always cite the specific parts of the documents you use in your answers.
"""


tools_dict = {our_tool.name: our_tool for our_tool in tools}


# LLM Agent
async def call_llm(state: AgentState) -> AgentState:
    """Function to call the LLM with the current state."""
    messages = list(state['messages'])
    messages = [SystemMessage(content=system_prompt)] + messages
    message = await llm.ainvoke(messages)
    return {'messages': [message]}


# Tool Executor Agent
async def take_action(state: AgentState) -> AgentState:
    """Execute tool calls from the LLM's response."""

    tool_calls = state['messages'][-1].tool_calls
    results = []
    for t in tool_calls:
        print(f"Calling Tool: {t['name']} with args: {t['args']}")
        
        if t['name'] not in tools_dict: # Checks if a valid tool is present
            print(f"\nTool: {t['name']} does not exist.")
            result = "Incorrect Tool Name, Please Retry and Select tool from List of Available tools."
        
        else:
            tool_to_call = tools_dict[t['name']]
            # All tools are async now, so we can simplify the invocation
            result = await tool_to_call.ainvoke(t['args'])
            print(f"Result length: {len(str(result))}")
            

        # Appends the Tool Message
        results.append(ToolMessage(tool_call_id=t['id'], name=t['name'], content=str(result)))

    print("Tools Execution Complete. Back to the model!")
    return {'messages': results}


graph = StateGraph(AgentState)
graph.add_node("llm", call_llm)
graph.add_node("action_agent", take_action)

graph.add_conditional_edges(
    "llm",
    should_continue,
    {True: "action_agent", False: END}
)
graph.add_edge("action_agent", "llm")
graph.set_entry_point("llm")

memory = MemorySaver()
agent = graph.compile(checkpointer=memory)

config = {"configurable": {"thread_id": "abc123"}}


# Generate the PNG bytes
# image_bytes = agent.get_graph().draw_mermaid_png()

# Save to a file
# with open("graph.png", "wb") as f:
#     f.write(image_bytes)




async def running_agent():
    
    print("\n=== RAG AGENT===")
    
    while True:
        user_input = input("\nWhat is your question: ")
        if user_input.lower() in ['exit', 'quit']:
            break
            
        messages = [HumanMessage(content=user_input)]

        events = agent.astream_events(
            {"messages": messages},
            config=config,
            version="v2"
            )
        
        print("\n=== ANSWER ===")
        async for event in events:
            if event["event"] == "on_chat_model_stream":
                print(event["data"]["chunk"].content, end="", flush=True)



print("📁 Using Chroma DB at:", os.path.abspath("apps/backend/chroma_db"))
print("📄 Number of docs in vector store:", vector_store._collection.count())