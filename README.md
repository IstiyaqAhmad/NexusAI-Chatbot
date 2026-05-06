# 🌟 NexusAI — Domain-Specific AI Chatbot

<div align="center">

**A Premium AI-Powered Technology Assistant**

*Powered by Local Machine Learning — No API Keys Required*

![Python](https://img.shields.io/badge/Python-3.9+-FFD700?style=for-the-badge&logo=python&logoColor=black)
![React](https://img.shields.io/badge/React-18-FFD700?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-FFD700?style=for-the-badge&logo=fastapi&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-FFD700?style=for-the-badge&logo=tailwindcss&logoColor=black)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [ML Model Deep Dive](#-ml-model-deep-dive)
- [Model Parameters](#-model-parameters-important)
- [Data Flow](#-data-flow)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [API Endpoints](#-api-endpoints)
- [Sample Inputs/Outputs](#-sample-inputsoutputs)
- [Tech Stack](#-tech-stack)

---

## 🔭 Overview

**NexusAI** is a domain-specific AI chatbot web application specializing in **Artificial Intelligence & Technology**. It uses a **hybrid ML approach** combining TF-IDF similarity search with template-based response generation — all running **locally** without any paid APIs.

### Key Features

| Feature | Description |
|---------|-------------|
| 🧠 **Hybrid ML Engine** | TF-IDF + Cosine Similarity with generative fallback |
| 📊 **90 FAQ Entries** | Curated AI & Technology knowledge base |
| 🎛️ **Model Parameters** | Adjustable Temperature, Top-p, and Confidence Threshold |
| 💬 **Session Memory** | Stores last 10 interactions per session |
| 🎨 **Premium UI** | Black & Gold glassmorphism design |
| 🔒 **100% Local** | No API keys, no internet required for ML |
| ⚡ **Real-time** | FastAPI backend with instant responses |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Welcome  │  │  Chat    │  │ Settings │  │ Sidebar  │   │
│  │ Screen   │  │ Window   │  │  Panel   │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                         │                                    │
│                    REST API Calls                            │
├─────────────────────────┼───────────────────────────────────┤
│                    BACKEND (FastAPI)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ /chat    │  │ /train   │  │ /settings│  │ /stats   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                         │                                    │
├─────────────────────────┼───────────────────────────────────┤
│                    ML ENGINE (NLP)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Text     │  │ TF-IDF   │  │ Cosine   │  │ Response │   │
│  │ Preproc  │  │ Vectorize│  │ Similarity│  │ Generator│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                         │                                    │
├─────────────────────────┼───────────────────────────────────┤
│                    DATA LAYER                                │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │ FAQ Dataset (JSON)   │  │ Session Memory (RAM)     │    │
│  │ 90 Q&A pairs         │  │ Per-session history      │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧠 ML Model Deep Dive

### Approach: Hybrid (Option C)

NexusAI implements a **Hybrid ML approach**:

1. **Primary: TF-IDF + Cosine Similarity** — Matches user queries against the FAQ knowledge base
2. **Fallback: Template-based Generation** — Synthesizes responses when confidence is low

### Text Preprocessing Pipeline

```
Input Text → Lowercase → Remove Special Characters → Tokenize (NLTK)
     → Remove Stopwords → Lemmatize (WordNet) → Processed Text
```

| Step | Tool | Purpose |
|------|------|---------|
| Tokenization | `nltk.word_tokenize` | Break text into words |
| Stopword Removal | `nltk.corpus.stopwords` | Remove common words (the, is, at...) |
| Lemmatization | `nltk.WordNetLemmatizer` | Reduce words to base form (running→run) |

### TF-IDF Vectorization

**TF-IDF (Term Frequency — Inverse Document Frequency)** converts text into numerical vectors:

- **TF (Term Frequency)**: How often a word appears in a document
  - `TF(t,d) = count(t in d) / total_words(d)`

- **IDF (Inverse Document Frequency)**: How rare a word is across all documents
  - `IDF(t) = log(N / df(t))`

- **TF-IDF**: Product of both
  - `TF-IDF(t,d) = TF(t,d) × IDF(t)`

**Configuration:**
```python
TfidfVectorizer(
    max_features=5000,      # Top 5000 features
    ngram_range=(1, 2),     # Unigrams and bigrams
    sublinear_tf=True       # Apply log normalization
)
```

### Cosine Similarity

Measures the angle between two TF-IDF vectors:

```
similarity(A, B) = (A · B) / (||A|| × ||B||)
```

- **1.0** = Perfect match
- **0.0** = No similarity
- Threshold of **0.25** determines whether to use direct match or generate

### Response Pipeline

```
Query → Preprocess → TF-IDF Transform → Cosine Similarity
  │
  ├── Confidence ≥ 0.25 → Return best FAQ match (with temperature sampling)
  │
  └── Confidence < 0.25 → Generate from partial matches + templates
```

---

## 🎛️ Model Parameters (IMPORTANT)

### Temperature (0.0 — 2.0)

Controls the **randomness** of response selection.

| Value | Effect | Use Case |
|-------|--------|----------|
| 0.0 | **Deterministic** — always returns the highest-scoring match | Factual, consistent answers |
| 0.3 | **Low randomness** — slight variation in responses | Default for information retrieval |
| 0.7 | **Balanced** (default) — good mix of accuracy and variety | General conversation |
| 1.5 | **High randomness** — more diverse and creative selections | Exploratory responses |
| 2.0 | **Maximum randomness** — highly varied, possibly less accurate | Creative brainstorming |

**How it works internally:**
```python
scores = base_scores / temperature  # Scale logits
probabilities = softmax(scores)      # Convert to probabilities
selected = sample(probabilities)     # Sample from distribution
```

Low temperature → Sharpens probability distribution → Top candidate overwhelmingly favored
High temperature → Flattens distribution → More candidates have viable probability

### Top-P / Nucleus Sampling (0.0 — 1.0)

Dynamically selects the **candidate pool size**.

| Value | Effect |
|-------|--------|
| 0.1 | Only top ~10% probability mass considered — very focused |
| 0.5 | Top ~50% — moderate diversity |
| 0.9 | Top ~90% (default) — broad but filtered |
| 1.0 | All candidates considered |

**How it works:**
1. Sort candidates by probability (descending)
2. Compute cumulative probability
3. Keep only candidates within the top-p threshold
4. Renormalize and sample

### Confidence Threshold (0.05 — 0.80)

Minimum cosine similarity score for a **direct FAQ match**.

| Value | Effect |
|-------|--------|
| 0.05 | Very loose — almost always returns a FAQ match |
| 0.25 | Balanced (default) — uses FAQ for relevant queries |
| 0.50 | Strict — only very close matches use FAQ |
| 0.80 | Very strict — requires near-exact match |

---

## 🔄 Data Flow

### Complete Request/Response Cycle

```
1. USER types message in React UI
         │
2. React sends POST /chat { message, session_id }
         │
3. FastAPI receives request, calls NLPEngine.get_response()
         │
4. TextPreprocessor:
   - Lowercase → "what is deep learning?"
   - Remove special chars
   - Tokenize → ["what", "is", "deep", "learning"]
   - Remove stopwords → ["deep", "learning"]
   - Lemmatize → ["deep", "learning"]
         │
5. TF-IDF Vectorizer transforms query to vector
         │
6. Cosine similarity computed against all 90 FAQ vectors
         │
7. Top 5 matches ranked by similarity score
         │
8. IF best_score ≥ 0.25:
   └── Apply temperature/top-p sampling to select from top matches
   └── Return selected FAQ answer
   ELSE:
   └── ResponseGenerator creates answer from partial matches
   └── Uses templates + temperature sampling
         │
9. Store interaction in SessionMemory
         │
10. Return JSON { response, confidence, method, category, ... }
         │
11. React displays bot message with confidence meter and metadata
```

---

## 📁 Project Structure

```
nexusai/
├── 📁 backend/
│   ├── main.py              # FastAPI server with all endpoints
│   └── requirements.txt     # Python dependencies
│
├── 📁 frontend/
│   ├── index.html            # HTML entry point
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.js        # Vite configuration
│   ├── tailwind.config.js    # Tailwind CSS theme
│   ├── postcss.config.js     # PostCSS configuration
│   ├── 📁 public/
│   │   └── nexus-icon.svg    # App favicon
│   └── 📁 src/
│       ├── main.jsx          # React entry point
│       ├── App.jsx           # Main application component
│       ├── index.css         # Global styles + animations
│       └── 📁 components/
│           ├── ChatWindow.jsx     # Chat messages + input
│           ├── MessageBubble.jsx  # Individual message display
│           ├── TypingIndicator.jsx # Animated typing dots
│           ├── Sidebar.jsx        # Model info + actions
│           ├── SettingsPanel.jsx  # Parameter controls
│           └── WelcomeScreen.jsx  # Landing page
│
├── 📁 model/
│   ├── __init__.py           # Package exports
│   └── nlp_engine.py         # Core ML engine
│
├── 📁 data/
│   └── faq_dataset.json      # 90 Q&A pairs (AI & Technology)
│
└── README.md                 # This file
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Python** 3.9 or higher
- **Node.js** 18 or higher
- **npm** 9 or higher
- **Google Chrome** (recommended browser)

### Step 1: Clone / Navigate to Project

```bash
cd "project Ai& etitional"
```

### Step 2: Setup Backend

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start the backend server
python backend/main.py
```

The backend will start on **http://localhost:8000**

### Step 3: Setup Frontend

Open a **new terminal**:

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on **http://localhost:3000**

### Step 4: Open in Browser

Navigate to **http://localhost:3000** in **Google Chrome**.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/chat` | Send message, get AI response |
| `POST` | `/train` | Retrain the ML model |
| `GET` | `/stats` | Model statistics |
| `GET` | `/categories` | Available FAQ categories |
| `GET` | `/history/{session_id}` | Session chat history |
| `POST` | `/settings` | Update model parameters |
| `DELETE` | `/session/{session_id}` | Clear session |
| `GET` | `/search/{category}` | Search FAQs by category |

### Example: POST /chat

**Request:**
```json
{
  "message": "What is deep learning?",
  "session_id": "abc-123"
}
```

**Response:**
```json
{
  "response": "Deep Learning is a subset of machine learning that uses artificial neural networks with multiple layers...",
  "confidence": 0.8734,
  "method": "tfidf_match",
  "matched_question": "What is deep learning?",
  "category": "AI Fundamentals",
  "session_id": "abc-123",
  "model_params": {
    "temperature": 0.7,
    "top_p": 0.9,
    "confidence_threshold": 0.25
  },
  "top_matches": [
    {"question": "What is deep learning?", "score": 0.8734},
    {"question": "What is machine learning?", "score": 0.3521},
    {"question": "What is a neural network?", "score": 0.2918}
  ]
}
```

---

## 💬 Sample Inputs/Outputs

| # | User Input | Confidence | Method | Category |
|---|-----------|------------|--------|----------|
| 1 | "What is artificial intelligence?" | 95.2% | TF-IDF Match | AI Fundamentals |
| 2 | "How does backpropagation work?" | 82.1% | TF-IDF Match | Deep Learning |
| 3 | "Explain TF-IDF vectorization" | 76.8% | TF-IDF Match | NLP |
| 4 | "What is temperature in LLMs?" | 88.3% | TF-IDF Match | LLM |
| 5 | "Tell me about GANs" | 61.5% | TF-IDF Match | Deep Learning |
| 6 | "What's the weather today?" | 3.2% | Generated | General |
| 7 | "How to cook pasta?" | 1.8% | Generated | General |
| 8 | "What is computer vision used for?" | 71.4% | TF-IDF Match | Computer Vision |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite 5 | UI framework + build tool |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS framework |
| **Backend** | FastAPI | Python REST API framework |
| **ML / NLP** | scikit-learn | TF-IDF + Cosine Similarity |
| **Text Processing** | NLTK | Tokenization, stopwords, lemmatization |
| **Server** | Uvicorn | ASGI server for FastAPI |
| **Fonts** | Google Fonts | Inter, Outfit, JetBrains Mono |

---

## 📊 Dataset

The FAQ dataset contains **90 expertly curated Q&A pairs** across **13 categories**:

| Category | Count | Topics |
|----------|-------|--------|
| AI Fundamentals | 7 | AI definition, neural networks, NLP, activation functions |
| Machine Learning | 10 | Supervised/unsupervised, overfitting, gradient descent |
| Deep Learning | 8 | CNNs, RNNs, Transformers, GANs, autoencoders |
| NLP | 7 | Tokenization, embeddings, sentiment, TF-IDF |
| Computer Vision | 5 | Object detection, segmentation, face recognition |
| LLM | 8 | GPT, BERT, fine-tuning, prompting, RAG |
| AI Applications | 6 | Chatbots, healthcare, autonomous driving |
| AI Ethics | 3 | Bias, explainability, ethical concerns |
| Data Science | 5 | Preprocessing, EDA, augmentation |
| Model Evaluation | 4 | Confusion matrix, ROC, A/B testing |
| MLOps | 3 | Deployment, monitoring |
| Tools & Frameworks | 5 | TensorFlow, PyTorch, scikit-learn |
| Advanced Topics | 5 | Few-shot, quantization, distillation |
| Trends | 4 | Generative AI, agents, multimodal |
| AI Concepts | 5 | Turing test, AGI, edge AI |
| Programming | 3 | Python, CUDA, APIs |

---

## 📜 License

This project is for educational and demonstration purposes.

---

<div align="center">

**Built with ❤️ and 🧠 — NexusAI**

*A premium SaaS-grade AI product, running entirely on your local machine.*

</div>
