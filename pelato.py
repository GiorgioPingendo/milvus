from sentence_transformers import SentenceTransformer

from transformers import DPRContextEncoderTokenizer, DPRContextEncoder, DPRQuestionEncoderTokenizer, DPRQuestionEncoder
model = SentenceTransformer('all-mpnet-base-v2')

# Elenchiamo le frasi che vogliamo codificare
sentences = ['Questa è la prima frase', 'Questa è la seconda frase', 'Questa è l\'ultima frase']

# Utilizziamo il modello per codificare le frasi
embeddings = model.encode(sentences)

coembeddings.shape




ctx_model = DPRContextEncoder.from_pretrained('facebook/dpr-ctx-encoder-single-nq-base')
ctx_tokenizer = DPRContextEncoderTokenizer.from_pretrained('facebook/dpr-ctx-encoder-single-nq-base')

# # Ora 'embeddings' è una lista di vettori: ogni vettore rappresenta una delle frasi
# for sentence, embedding in zip(sentences, embeddings):
#     print("Sentence:", sentence)
#     print("Embedding:", embedding)
#     print("---")