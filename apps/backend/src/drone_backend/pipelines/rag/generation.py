from langchain_core.prompts import PromptTemplate
from langchain_classic.chains import RetrievalQA

PROMPT_TEMPLATE = """You are Trinetra Tactical Drone Assistant, an intelligent drone copilot and agricultural intelligence system.
Answer questions accurately based on the context documents below.

Context: {context}
Question: {question}

Helpful Answer:"""

def build_qa_chain(llm, retriever):
    prompt = PromptTemplate(template=PROMPT_TEMPLATE, input_variables=["context", "question"])
    return RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}
    )
