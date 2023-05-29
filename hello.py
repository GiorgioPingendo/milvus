from pymilvus import (
    connections,
    FieldSchema, CollectionSchema, DataType,
    Collection,
)
from pymilvus import utility

from sentence_transformers import SentenceTransformer
import numpy as np

# Connect to Milvus
connections.connect("default", host="localhost", port="19530")

if utility.has_collection("QA_Collection"):
    qa_collection = Collection("QA_Collection")
    qa_collection.drop()



# Initialize sentence transformer model
model = SentenceTransformer('all-MPNet-base-v2')

# Define your own data
questions = ["Come si fa la pizza margherita?","Dove è stata inventa la pizza margherita?" "Quali ingredienti ci vogliono per il risotto alla milanese?",
             "Qual è la ricetta per fare la carbonara?", "Come si fa il tiramisù?", "Quali sono i passaggi per fare la lasagna?"]
answers = [
           "Il risotto alla milanese richiede riso, zafferano, burro, cipolla, vino bianco, brodo vegetale e formaggio grana.",
           "Per fare la carbonara ti servono spaghetti, guanciale, uova, pecorino romano, sale e pepe.",
           "la pizza margherita è stata inventata a napoli in italia"
           "La pizza margherita si fa con pomodoro, mozzarella, olio e basilico.",
           "Per fare il tiramisù avrai bisogno di savoiardi, caffè, uova, zucchero, mascarpone e cacao.",
           "La lasagna richiede pasta per lasagne, ragù, besciamella e parmigiano."]
pks = [str(i) for i in range(len(questions))]

# Create embeddings
embeddings = model.encode(questions)

# Define collection schema
fields = [
    FieldSchema(name="pk", dtype=DataType.VARCHAR, is_primary=True, auto_id=False, max_length=200),
    FieldSchema(name="question", dtype=DataType.VARCHAR, max_length=200),
    FieldSchema(name="answer", dtype=DataType.VARCHAR, max_length=200),
    FieldSchema(name="embeddings", dtype=DataType.FLOAT_VECTOR, dim=len(embeddings[0]))
]
schema = CollectionSchema(fields, "This is the QA collection")
qa_collection = Collection("QA_Collection", schema)

# Create an index on the 'embeddings' field
index = {
    "index_type": "IVF_FLAT",
    "params": {"nlist": 128},
    "metric_type": "L2",
}
qa_collection.create_index("embeddings", index)

# Insert data
entities = [pks, questions, answers, embeddings.tolist()]
qa_collection.insert(entities)
qa_collection.flush()

# Load the data into memory
qa_collection.load()

# Query data: retrieve the most similar question-answer pair for a new question
new_question = "Come posso fare una lasagna?"
new_question_embedding = model.encode([new_question])[0]

search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
results = qa_collection.search([new_question_embedding], "embeddings", search_params, limit=1, output_fields=['pk', 'question', 'answer'])

# Unpack the results
for result in results:
    for match in result:
        print(f"PK: {match.entity.get('pk')}, Question: {match.entity.get('question')}, Answer: {match.entity.get('answer')}, Distance: {match.distance}")
