"""
NexusAI - Smart AI Platform Recommendation Engine
==================================================
ML-powered recommendation system using TF-IDF + Cosine Similarity + KNN
to intelligently suggest the best AI tools for any user task.

Features:
- TF-IDF Vectorization for text understanding
- Cosine Similarity for task matching
- KNN-based classification fallback
- Keyword intent detection
- Confidence scoring
- Dynamic prompt generation
- User preference learning (history tracking)

NO external AI APIs required - everything runs locally.
"""

import json
import os
import re
import random
import math
from collections import defaultdict, Counter
from datetime import datetime

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import KNeighborsClassifier
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer


def ensure_nltk_data():
    """Download required NLTK data if not present."""
    resources = [
        ('tokenizers/punkt_tab', 'punkt_tab'),
        ('corpora/stopwords', 'stopwords'),
        ('corpora/wordnet', 'wordnet'),
    ]
    for path, name in resources:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(name, quiet=True)


ensure_nltk_data()


class RecommendationEngine:
    """
    ML-powered AI Platform Recommendation Engine.
    
    Uses a hybrid approach combining:
    1. TF-IDF + Cosine Similarity for semantic task matching
    2. KNN classifier for category prediction
    3. Keyword-based intent detection for precision
    4. Weighted scoring combining all signals
    """

    def __init__(self, dataset_path: str = None):
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        self.stop_words -= {'what', 'how', 'why', 'when', 'where', 'which',
                            'who', 'not', 'no', 'can', 'will', 'should', 'create',
                            'make', 'build', 'generate', 'write', 'design', 'help'}

        # ML components
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=3000,
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1
        )
        self.knn_classifier = None
        self.tfidf_matrix = None

        # Dataset
        self.categories = []
        self.category_texts = []
        self.category_map = {}
        self.raw_data = {}

        # User history tracking
        self.search_history = []
        self.favorite_tools = Counter()
        self.category_usage = Counter()

        # Training state
        self.is_trained = False

        if dataset_path:
            self.load_dataset(dataset_path)
            self.train()

    def preprocess(self, text: str) -> str:
        """Preprocess text: lowercase, remove special chars, tokenize, lemmatize."""
        text = text.lower().strip()
        text = re.sub(r'[^a-zA-Z0-9\s\-]', ' ', text)
        tokens = word_tokenize(text)
        processed = []
        for token in tokens:
            if token not in self.stop_words and len(token) > 1:
                lemma = self.lemmatizer.lemmatize(token)
                processed.append(lemma)
        return ' '.join(processed)

    def load_dataset(self, filepath: str):
        """Load the AI tools dataset from JSON."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.raw_data = {cat['id']: cat for cat in data['categories']}
        self.categories = []
        self.category_texts = []

        for cat in data['categories']:
            cat_id = cat['id']
            # Build rich text representation for each category
            text_parts = [
                cat['task'],
                ' '.join(cat['keywords']),
                ' '.join([t['name'] + ' ' + t['description'] for t in cat['recommended_tools']]),
                ' '.join(cat.get('starter_prompts', []))
            ]
            full_text = ' '.join(text_parts)
            # Add multiple entries with keyword variations for better matching
            self.categories.append(cat_id)
            self.category_texts.append(full_text)
            # Also add individual keyword groups as separate training samples
            for keyword in cat['keywords']:
                self.categories.append(cat_id)
                self.category_texts.append(keyword + ' ' + cat['task'])

        self.category_map = {cat['id']: cat for cat in data['categories']}
        print(f"[RecommendationEngine] Loaded {len(self.category_map)} categories, "
              f"{sum(len(c['recommended_tools']) for c in data['categories'])} tools")

    def train(self):
        """Train the TF-IDF vectorizer and KNN classifier."""
        if not self.category_texts:
            raise ValueError("No dataset loaded. Call load_dataset() first.")

        # Preprocess all texts
        processed_texts = [self.preprocess(t) for t in self.category_texts]

        # Fit TF-IDF
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(processed_texts)

        # Train KNN classifier
        label_indices = []
        unique_labels = list(set(self.categories))
        label_to_idx = {label: idx for idx, label in enumerate(unique_labels)}
        self.idx_to_label = {idx: label for label, idx in label_to_idx.items()}

        for cat in self.categories:
            label_indices.append(label_to_idx[cat])

        self.knn_classifier = KNeighborsClassifier(
            n_neighbors=min(5, len(processed_texts)),
            weights='distance',
            metric='cosine'
        )
        self.knn_classifier.fit(self.tfidf_matrix, label_indices)

        self.is_trained = True
        print(f"[RecommendationEngine] Model trained: {self.tfidf_matrix.shape[0]} samples, "
              f"{self.tfidf_matrix.shape[1]} features")

    def _keyword_match_score(self, query: str, category: dict) -> float:
        """Compute keyword overlap score between query and category."""
        query_tokens = set(self.preprocess(query).split())
        keywords = set(self.preprocess(' '.join(category['keywords'])).split())
        if not query_tokens or not keywords:
            return 0.0
        overlap = query_tokens & keywords
        return len(overlap) / max(len(query_tokens), 1)

    def recommend(self, query: str) -> dict:
        """
        Get AI platform recommendations for a user query.
        
        Pipeline:
        1. Preprocess query text
        2. TF-IDF vectorize
        3. Cosine similarity against all category vectors
        4. KNN classification for category prediction
        5. Keyword intent matching for precision boost
        6. Combine scores with weighted average
        7. Return top recommendations with confidence
        """
        if not self.is_trained:
            return {"error": "Model not trained yet"}

        processed_query = self.preprocess(query)
        query_vector = self.tfidf_vectorizer.transform([processed_query])

        # --- Signal 1: Cosine Similarity ---
        similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()

        # Aggregate scores per category (take max similarity for each)
        cat_cosine_scores = defaultdict(float)
        for idx, sim in enumerate(similarities):
            cat_id = self.categories[idx]
            cat_cosine_scores[cat_id] = max(cat_cosine_scores[cat_id], float(sim))

        # --- Signal 2: KNN Prediction ---
        knn_probs = {}
        try:
            knn_pred = self.knn_classifier.predict(query_vector)[0]
            knn_label = self.idx_to_label[knn_pred]
            # Get distances to neighbors for confidence
            distances, indices = self.knn_classifier.kneighbors(query_vector)
            neighbor_labels = [self.idx_to_label[self.knn_classifier._y[i]] for i in indices[0]]
            label_counts = Counter(neighbor_labels)
            total = sum(label_counts.values())
            for label, count in label_counts.items():
                knn_probs[label] = count / total
        except Exception:
            knn_label = None
            knn_probs = {}

        # --- Signal 3: Keyword Match ---
        cat_keyword_scores = {}
        for cat_id, cat_data in self.category_map.items():
            cat_keyword_scores[cat_id] = self._keyword_match_score(query, cat_data)

        # --- Combine Scores ---
        # Weighted: 45% cosine, 30% KNN, 25% keyword
        combined_scores = {}
        for cat_id in self.category_map:
            cosine_s = cat_cosine_scores.get(cat_id, 0.0)
            knn_s = knn_probs.get(cat_id, 0.0)
            keyword_s = cat_keyword_scores.get(cat_id, 0.0)
            combined = (0.45 * cosine_s) + (0.30 * knn_s) + (0.25 * keyword_s)
            combined_scores[cat_id] = {
                'total': combined,
                'cosine': cosine_s,
                'knn': knn_s,
                'keyword': keyword_s
            }

        # Sort by combined score
        ranked = sorted(combined_scores.items(), key=lambda x: x[1]['total'], reverse=True)
        best_cat_id = ranked[0][0]
        best_score = ranked[0][1]['total']
        best_category = self.category_map[best_cat_id]

        # Confidence (0-100%)
        confidence = min(round(best_score * 100, 1), 99.9)
        if confidence < 5:
            confidence = max(confidence, 10.0)  # Floor for UX

        # Pick a starter prompt
        prompts = best_category.get('starter_prompts', [])
        starter_prompt = random.choice(prompts) if prompts else ""

        # Track history
        self.search_history.append({
            'query': query,
            'predicted_category': best_cat_id,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat()
        })
        self.category_usage[best_cat_id] += 1

        # Why recommended reasoning
        reasoning_parts = []
        if combined_scores[best_cat_id]['keyword'] > 0.2:
            reasoning_parts.append("Strong keyword match with your query")
        if combined_scores[best_cat_id]['cosine'] > 0.3:
            reasoning_parts.append("High semantic similarity to known tasks")
        if combined_scores[best_cat_id]['knn'] > 0.4:
            reasoning_parts.append("ML classifier predicts this category")
        if not reasoning_parts:
            reasoning_parts.append("Best available match based on combined analysis")

        # Build response
        result = {
            "predicted_category": best_category['task'],
            "category_id": best_cat_id,
            "confidence": confidence,
            "recommended_tools": best_category['recommended_tools'],
            "difficulty": best_category['difficulty'],
            "best_free": best_category['best_free'],
            "tags": best_category.get('tags', []),
            "trending": best_category.get('trending', False),
            "starter_prompt": starter_prompt,
            "all_prompts": prompts,
            "reasoning": ' • '.join(reasoning_parts),
            "scores": {
                "cosine_similarity": round(combined_scores[best_cat_id]['cosine'], 4),
                "knn_probability": round(combined_scores[best_cat_id]['knn'], 4),
                "keyword_match": round(combined_scores[best_cat_id]['keyword'], 4),
                "combined": round(combined_scores[best_cat_id]['total'], 4)
            },
            "alternative_categories": [
                {
                    "category": self.category_map[cat_id]['task'],
                    "category_id": cat_id,
                    "confidence": min(round(scores['total'] * 100, 1), 99.9),
                    "top_tool": self.category_map[cat_id]['recommended_tools'][0]['name']
                }
                for cat_id, scores in ranked[1:4]
                if scores['total'] > 0.05
            ]
        }

        return result

    def get_trending_tools(self) -> list:
        """Get all trending tools across categories."""
        trending = []
        for cat in self.category_map.values():
            if cat.get('trending', False):
                trending.append({
                    "category": cat['task'],
                    "category_id": cat['id'],
                    "top_tool": cat['recommended_tools'][0],
                    "tags": cat.get('tags', [])
                })
        return trending

    def get_free_tools(self) -> list:
        """Get best free tools across categories."""
        free = []
        for cat in self.category_map.values():
            free.append({
                "category": cat['task'],
                "category_id": cat['id'],
                "best_free": cat['best_free'],
                "tools": [t for t in cat['recommended_tools'] if 'Free' in t.get('pricing', '')]
            })
        return free

    def get_all_categories(self) -> list:
        """Get all available categories."""
        return [
            {
                "id": cat['id'],
                "name": cat['task'],
                "tool_count": len(cat['recommended_tools']),
                "trending": cat.get('trending', False),
                "difficulty": cat['difficulty'],
                "tags": cat.get('tags', [])
            }
            for cat in self.category_map.values()
        ]

    def get_tools_by_category(self, category_id: str) -> dict:
        """Get all tools for a specific category."""
        cat = self.category_map.get(category_id)
        if not cat:
            return {"error": "Category not found"}
        return {
            "category": cat['task'],
            "tools": cat['recommended_tools'],
            "difficulty": cat['difficulty'],
            "best_free": cat['best_free'],
            "starter_prompts": cat.get('starter_prompts', [])
        }

    def add_favorite(self, tool_name: str):
        """Track a user's favorite tool."""
        self.favorite_tools[tool_name] += 1

    def get_user_stats(self) -> dict:
        """Get user interaction stats."""
        return {
            "total_searches": len(self.search_history),
            "recent_searches": self.search_history[-10:],
            "top_categories": self.category_usage.most_common(5),
            "favorite_tools": self.favorite_tools.most_common(10)
        }

    def get_engine_stats(self) -> dict:
        """Get engine statistics."""
        return {
            "is_trained": self.is_trained,
            "total_categories": len(self.category_map),
            "total_tools": sum(len(c['recommended_tools']) for c in self.category_map.values()),
            "total_training_samples": len(self.categories) if self.categories else 0,
            "vocabulary_size": len(self.tfidf_vectorizer.vocabulary_) if self.is_trained else 0,
            "total_searches": len(self.search_history),
            "algorithms": ["TF-IDF", "Cosine Similarity", "KNN Classifier", "Keyword Intent"]
        }
