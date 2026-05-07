import chromadb

class ChromaVectorDB:
    """
    Definition for a vector database powered by ChromaDB
    """
    def __init__(self):
        self.client = chromadb.Client()
        self.collection = self.client.get_or_create_collection(name="employee_baseline")
        self.verbose_log = 0

    def store_baseline(self, employee_id, document_id, narrative_text):
        """Method to store historical context about an employee
        Keyword arguments:
        employee_id -- ID of an employee
        document_id -- ID of the historical context
        narrative_text -- additional guideline for LLM agent
        """
        self.collection.add(
            documents=[narrative_text],
            metadatas=[{"employee_id": employee_id}],
            ids=[f"{employee_id}_{document_id}"]
        )

        if self.verbose_log:
            print(f"[VECTORDB] Stored baseline for {employee_id}")
    
    def query_history(self, employee_id, current_telemetry, n_results=1):
        """Find the closest historical pattern for an employee's current behavior
        Keyword arguments:
        employee_id -- ID of the employee
        current_telemetry -- current pattern
        """
        results = self.collection.query(
            query_texts=[current_telemetry],
            n_results=n_results,
            where={"employee_id": employee_id}
        )

        if results['documents'] and results['documents'][0]:
            return results['documents'][0][0]
        
        return "No historical baseline found"