"""
NexusAI - NLP Engine
====================
Hybrid ML-based chatbot engine using TF-IDF similarity search
with generative response synthesis for fallback.

Features:
- Text preprocessing (tokenization, stopword removal, lemmatization)
- TF-IDF vectorization
- Cosine similarity matching
- Temperature-controlled response generation
- Top-p nucleus sampling
- Session-based chat memory
"""

import json
import re
import math
import random
import string
import os
from collections import defaultdict
from datetime import datetime

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer


# Download required NLTK data
def ensure_nltk_data():
    """Download required NLTK data if not present."""
    resources = [
        ('tokenizers/punkt_tab', 'punkt_tab'),
        ('corpora/stopwords', 'stopwords'),
        ('corpora/wordnet', 'wordnet'),
        ('taggers/averaged_perceptron_tagger_eng', 'averaged_perceptron_tagger_eng'),
    ]
    for path, name in resources:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(name, quiet=True)


ensure_nltk_data()


class SessionMemory:
    """
    Manages conversation history for each session.
    Stores the last N interactions per session.
    """

    def __init__(self, max_history: int = 10):
        self.sessions: dict[str, list[dict]] = defaultdict(list)
        self.max_history = max_history

    def add_interaction(self, session_id: str, user_message: str, bot_response: str):
        """Add a user-bot interaction to session memory."""
        self.sessions[session_id].append({
            "timestamp": datetime.now().isoformat(),
            "user": user_message,
            "bot": bot_response
        })
        # Keep only the last N interactions
        if len(self.sessions[session_id]) > self.max_history:
            self.sessions[session_id] = self.sessions[session_id][-self.max_history:]

    def get_history(self, session_id: str) -> list[dict]:
        """Get conversation history for a session."""
        return self.sessions.get(session_id, [])

    def clear_session(self, session_id: str):
        """Clear a specific session's history."""
        if session_id in self.sessions:
            del self.sessions[session_id]

    def get_context(self, session_id: str, n: int = 3) -> str:
        """Get the last N interactions as context string."""
        history = self.get_history(session_id)[-n:]
        if not history:
            return ""
        context_parts = []
        for h in history:
            context_parts.append(f"User: {h['user']}")
            context_parts.append(f"Bot: {h['bot']}")
        return "\n".join(context_parts)


class TextPreprocessor:
    """
    Handles text preprocessing for NLP pipeline.
    Includes tokenization, stopword removal, and lemmatization.
    """

    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        # Keep some important words that are usually stopwords
        self.keep_words = {'what', 'how', 'why', 'when', 'where', 'which', 'who',
                           'not', 'no', 'can', 'will', 'should', 'could', 'would'}
        self.stop_words -= self.keep_words

    def preprocess(self, text: str) -> str:
        """Full preprocessing pipeline for a text string."""
        # Lowercase
        text = text.lower()
        # Remove special characters but keep alphanumeric and spaces
        text = re.sub(r'[^a-zA-Z0-9\s\-]', ' ', text)
        # Tokenize
        tokens = word_tokenize(text)
        # Remove stopwords and lemmatize
        processed_tokens = []
        for token in tokens:
            if token not in self.stop_words and len(token) > 1:
                lemma = self.lemmatizer.lemmatize(token)
                processed_tokens.append(lemma)
        return ' '.join(processed_tokens)

    def extract_keywords(self, text: str, top_n: int = 5) -> list[str]:
        """Extract top keywords from text."""
        processed = self.preprocess(text)
        tokens = processed.split()
        # Simple keyword extraction based on length and uniqueness
        unique_tokens = list(set(tokens))
        unique_tokens.sort(key=lambda x: -len(x))
        return unique_tokens[:top_n]


class ResponseGenerator:
    """
    Generates responses when TF-IDF confidence is low.
    Uses template-based generation with temperature and top-p parameters.
    """

    def __init__(self):
        self.templates = [
            "Based on my knowledge, {topic} relates to {detail}. {elaboration}",
            "That's an interesting question about {topic}. {detail} {elaboration}",
            "Regarding {topic}, {detail}. {elaboration}",
            "{topic} is a fascinating area. {detail} {elaboration}",
            "Let me share what I know about {topic}. {detail} {elaboration}",
        ]

        self.elaborations = [
            "Would you like me to go into more detail on any specific aspect?",
            "I can provide more specific information if you narrow down your question.",
            "Feel free to ask follow-up questions for deeper insights.",
            "This is a broad topic with many interesting facets to explore.",
            "Let me know if you'd like to explore any related concepts.",
        ]

        self.fallback_responses = [
            "I appreciate your question! While I don't have a specific answer for that in my knowledge base, I'd suggest looking into recent research papers or documentation on this topic. Is there a related aspect of AI and technology I can help with?",
            "That's a great question that goes beyond my current knowledge base. I specialize in AI and technology topics — could you rephrase your question or ask about a specific AI concept?",
            "I'm currently trained on AI and technology topics. While I can't answer that specific question, I'd be happy to discuss related concepts in artificial intelligence, machine learning, deep learning, or NLP. What would you like to know?",
            "Interesting question! My expertise is focused on AI and technology. While I don't have a direct answer for this, I can help with questions about machine learning algorithms, neural networks, NLP, computer vision, and more.",
            "I don't have enough information to give you a confident answer on that. However, I'm well-versed in AI fundamentals, machine learning, deep learning, NLP, and related technology topics. Feel free to ask about any of these areas!",
        ]

    def generate(self, query: str, partial_matches: list[dict],
                 temperature: float = 0.7, top_p: float = 0.9) -> str:
        """
        Generate a response using partial matches and templates.
        
        Args:
            query: The user's query
            partial_matches: List of partially matching FAQ entries
            temperature: Controls randomness (0.0 = deterministic, 2.0 = very random)
            top_p: Nucleus sampling threshold (0.0-1.0)
        
        Returns:
            Generated response string
        """
        if not partial_matches:
            return self._apply_sampling(self.fallback_responses, temperature, top_p)

        # Extract information from partial matches
        topics = set()
        details = []
        for match in partial_matches[:3]:
            if 'category' in match:
                topics.add(match['category'])
            if 'answer' in match:
                # Extract key sentences from answers
                sentences = match['answer'].split('.')
                for sent in sentences[:2]:
                    if len(sent.strip()) > 20:
                        details.append(sent.strip())

        topic_str = ', '.join(topics) if topics else "AI and technology"
        detail_str = details[0] if details else "This is an active area of research and development"

        # Select template using temperature-based sampling
        template = self._apply_sampling(self.templates, temperature, top_p)
        elaboration = self._apply_sampling(self.elaborations, temperature, top_p)

        response = template.format(
            topic=topic_str,
            detail=detail_str,
            elaboration=elaboration
        )

        return response

    def _apply_sampling(self, candidates: list[str],
                        temperature: float, top_p: float) -> str:
        """
        Apply temperature and top-p sampling to select from candidates.
        
        Temperature controls randomness:
        - Low temperature (0.1): Almost always picks the first/best option
        - Medium temperature (0.7): Balanced randomness
        - High temperature (2.0): Very random selection
        
        Top-p (nucleus sampling):
        - Selects from the smallest set of candidates whose cumulative
          probability exceeds p
        """
        n = len(candidates)
        if n == 0:
            return ""
        if n == 1:
            return candidates[0]

        # Create probability distribution with temperature scaling
        # Base scores decrease linearly (first item has highest score)
        scores = np.array([n - i for i in range(n)], dtype=float)

        # Apply temperature scaling
        if temperature > 0:
            scores = scores / max(temperature, 0.01)
        else:
            # Temperature 0 = deterministic (pick first)
            return candidates[0]

        # Softmax to convert to probabilities
        exp_scores = np.exp(scores - np.max(scores))
        probabilities = exp_scores / exp_scores.sum()

        # Apply top-p (nucleus) sampling
        sorted_indices = np.argsort(-probabilities)
        sorted_probs = probabilities[sorted_indices]
        cumulative_probs = np.cumsum(sorted_probs)

        # Find cutoff index
        cutoff_idx = np.searchsorted(cumulative_probs, top_p) + 1
        cutoff_idx = min(cutoff_idx, n)

        # Keep only top-p candidates
        selected_indices = sorted_indices[:cutoff_idx]
        selected_probs = probabilities[selected_indices]
        selected_probs = selected_probs / selected_probs.sum()

        # Sample from remaining candidates
        choice_idx = np.random.choice(selected_indices, p=selected_probs)
        return candidates[choice_idx]


class NLPEngine:
    """
    Main NLP Engine for the Domain-Specific AI Chatbot.
    
    Implements a hybrid approach:
    1. TF-IDF vectorization + cosine similarity for FAQ matching
    2. Template-based response generation for low-confidence queries
    
    Model Parameters:
    - temperature (float, 0.0-2.0): Controls output randomness
        - 0.0: Deterministic, always returns the best match
        - 0.7: Balanced (default) — good mix of accuracy and variety
        - 2.0: Very creative/random responses
    
    - top_p (float, 0.0-1.0): Nucleus sampling parameter
        - 0.1: Only considers top ~10% probability mass
        - 0.9: Considers top ~90% probability mass (default)
        - 1.0: Considers all candidates
    """

    def __init__(self, data_path: str = None):
        self.preprocessor = TextPreprocessor()
        self.generator = ResponseGenerator()
        self.memory = SessionMemory(max_history=10)

        # Model parameters
        self.temperature = 0.7
        self.top_p = 0.9
        self.confidence_threshold = 0.25

        # TF-IDF components
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            sublinear_tf=True
        )
        self.tfidf_matrix = None

        # FAQ data
        self.faq_data = []
        self.questions = []
        self.answers = []
        self.categories = []
        self.processed_questions = []

        # Training state
        self.is_trained = False
        self.training_stats = {}

        # Load data if path provided
        if data_path:
            self.load_data(data_path)
            self.train()

    def load_data(self, filepath: str):
        """Load FAQ dataset from JSON file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.faq_data = data.get('faq', [])
        self.questions = [item['question'] for item in self.faq_data]
        self.answers = [item['answer'] for item in self.faq_data]
        self.categories = [item.get('category', 'General') for item in self.faq_data]

        # Preprocess all questions
        self.processed_questions = [
            self.preprocessor.preprocess(q) for q in self.questions
        ]

        print(f"[NLPEngine] Loaded {len(self.faq_data)} FAQ entries")
        return len(self.faq_data)

    def train(self):
        """
        Train the TF-IDF model on the FAQ dataset.
        Fits the vectorizer and transforms questions into TF-IDF vectors.
        """
        if not self.processed_questions:
            raise ValueError("No data loaded. Call load_data() first.")

        # Fit and transform TF-IDF
        self.tfidf_matrix = self.vectorizer.fit_transform(self.processed_questions)

        # Compute training statistics
        feature_names = self.vectorizer.get_feature_names_out()
        self.training_stats = {
            "num_samples": len(self.processed_questions),
            "num_features": len(feature_names),
            "vocabulary_size": len(self.vectorizer.vocabulary_),
            "categories": list(set(self.categories)),
            "num_categories": len(set(self.categories)),
            "avg_question_length": np.mean([len(q.split()) for q in self.processed_questions]),
            "trained_at": datetime.now().isoformat()
        }

        self.is_trained = True
        print(f"[NLPEngine] Model trained: {self.training_stats['num_samples']} samples, "
              f"{self.training_stats['num_features']} features")
        return self.training_stats

    def get_response(self, query: str, session_id: str = "default") -> dict:
        """
        Get a response for the user's query.
        
        Pipeline:
        1. Preprocess query
        2. Compute TF-IDF similarity with FAQ questions
        3. If confidence >= threshold: return best match
        4. If confidence < threshold: generate response from partial matches
        5. Apply temperature and top-p parameters
        6. Store interaction in session memory
        
        Args:
            query: User's input text
            session_id: Session identifier for memory
        
        Returns:
            dict with response, confidence, matched_question, category, etc.
        """
        if not self.is_trained:
            return {
                "response": "I'm not yet trained. Please train me with a dataset first.",
                "confidence": 0.0,
                "method": "error",
                "matched_question": None,
                "category": None
            }

        # Step 1: Preprocess query
        processed_query = self.preprocessor.preprocess(query)

        # Step 2: Get context from session memory
        context = self.memory.get_context(session_id, n=3)

        # Step 3: TF-IDF similarity search
        query_vector = self.vectorizer.transform([processed_query])
        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()

        # Get top matches
        top_indices = similarities.argsort()[::-1][:5]
        top_scores = similarities[top_indices]
        best_idx = top_indices[0]
        best_score = float(top_scores[0])

        # Step 4: Determine response method
        if best_score >= self.confidence_threshold:
            # High confidence: use FAQ answer
            method = "tfidf_match"

            if self.temperature == 0:
                # Deterministic: always return best match
                response = self.answers[best_idx]
                matched_q = self.questions[best_idx]
                category = self.categories[best_idx]
            else:
                # Apply temperature/top-p to select from top matches
                above_threshold = [
                    (idx, score) for idx, score in zip(top_indices, top_scores)
                    if score >= self.confidence_threshold * 0.7
                ]

                if len(above_threshold) > 1 and self.temperature > 0.3:
                    # Use temperature to sometimes pick non-top matches
                    indices, scores = zip(*above_threshold)
                    scores_arr = np.array(scores)

                    # Temperature scaling
                    scaled = scores_arr / max(self.temperature, 0.01)
                    exp_s = np.exp(scaled - np.max(scaled))
                    probs = exp_s / exp_s.sum()

                    # Top-p filtering
                    sorted_idx = np.argsort(-probs)
                    cum_probs = np.cumsum(probs[sorted_idx])
                    cutoff = min(np.searchsorted(cum_probs, self.top_p) + 1, len(probs))
                    sel_idx = sorted_idx[:cutoff]
                    sel_probs = probs[sel_idx]
                    sel_probs = sel_probs / sel_probs.sum()

                    chosen = np.random.choice(sel_idx, p=sel_probs)
                    final_idx = indices[chosen]
                else:
                    final_idx = best_idx

                response = self.answers[final_idx]
                matched_q = self.questions[final_idx]
                category = self.categories[final_idx]
        else:
            # Low confidence: generate response from partial matches
            method = "generated"
            partial_matches = [
                {
                    "question": self.questions[idx],
                    "answer": self.answers[idx],
                    "category": self.categories[idx],
                    "score": float(similarities[idx])
                }
                for idx in top_indices[:3]
            ]
            response = self.generator.generate(
                query, partial_matches,
                self.temperature, self.top_p
            )
            matched_q = self.questions[best_idx] if best_score > 0.1 else None
            category = self.categories[best_idx] if best_score > 0.1 else "General"

        # Step 5: Store in session memory
        self.memory.add_interaction(session_id, query, response)

        # Step 6: Build result
        result = {
            "response": response,
            "confidence": round(best_score, 4),
            "method": method,
            "matched_question": matched_q,
            "category": category,
            "model_params": {
                "temperature": self.temperature,
                "top_p": self.top_p,
                "confidence_threshold": self.confidence_threshold
            },
            "top_matches": [
                {
                    "question": self.questions[idx],
                    "score": round(float(similarities[idx]), 4)
                }
                for idx in top_indices[:3]
            ]
        }

        return result

    def set_parameters(self, temperature: float = None, top_p: float = None,
                       confidence_threshold: float = None):
        """Update model parameters."""
        if temperature is not None:
            self.temperature = max(0.0, min(2.0, temperature))
        if top_p is not None:
            self.top_p = max(0.0, min(1.0, top_p))
        if confidence_threshold is not None:
            self.confidence_threshold = max(0.0, min(1.0, confidence_threshold))

        return {
            "temperature": self.temperature,
            "top_p": self.top_p,
            "confidence_threshold": self.confidence_threshold
        }

    def get_stats(self) -> dict:
        """Get model statistics and training info."""
        return {
            "is_trained": self.is_trained,
            "training_stats": self.training_stats,
            "parameters": {
                "temperature": self.temperature,
                "top_p": self.top_p,
                "confidence_threshold": self.confidence_threshold
            },
            "active_sessions": len(self.memory.sessions),
            "total_faq_entries": len(self.faq_data)
        }

    def get_categories(self) -> list[str]:
        """Get list of available FAQ categories."""
        return list(set(self.categories))

    def search_by_category(self, category: str) -> list[dict]:
        """Get all FAQ entries for a specific category."""
        results = []
        for item in self.faq_data:
            if item.get('category', '').lower() == category.lower():
                results.append({
                    "question": item['question'],
                    "answer": item['answer'],
                    "category": item['category']
                })
        return results
