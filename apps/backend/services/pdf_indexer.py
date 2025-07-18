import os
import getpass
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_openai import AzureOpenAIEmbeddings

load_dotenv()

if not os.environ.get("AZURE_OPENAI_API_KEY"):
    os.environ["AZURE_OPENAI_API_KEY"] = getpass.getpass("Enter API key for Azure: ")


embeddings = AzureOpenAIEmbeddings(
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT_EMBEDDING"],
    azure_deployment=os.environ["AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME"],
)

print("✅ AzureOpenAIEmbeddings model initialised successfully.")


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DB_DIR = os.path.join(BASE_DIR, "../chroma_db")

vector_store = Chroma(
    collection_name="approved_docs",
    embedding_function=embeddings,
    persist_directory=CHROMA_DB_DIR
)



directory_path = os.path.join(BASE_DIR, "../approved_documents")
directory_path = os.path.abspath(directory_path)

if not os.path.exists(directory_path):
    raise FileNotFoundError(f"Directory path not found: {directory_path}")

loader = PyPDFDirectoryLoader(directory_path)

# Load the documents
documents = loader.load()

# Each document corresponds to a page in the PDFs
for doc in documents:
    print(f"--- Page from {doc.metadata['source']} ---")
    print(doc.page_content[:500]) # Print the first 500 characters of the page
    print("\n")

print(f"Total pages loaded: {len(documents)}")


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,  # chunk size (characters)
    chunk_overlap=200,  # chunk overlap (characters)
    add_start_index=True,  # track index in original document
)

all_splits = text_splitter.split_documents(documents)

print(f"Split blog post into {len(all_splits)} sub-documents.")
    
document_ids = vector_store.add_documents(documents=all_splits)




