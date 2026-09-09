"""
Civic Grievance Intelligence Dashboard — Geospatial Clustering & Hotspot Detection
Uses scikit-learn DBSCAN with Haversine distance to cluster complaints geographically.
Computes text similarity (TF-IDF + Cosine Similarity) within clusters to detect duplicate/recurring incidents.
"""

import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any

EARTH_RADIUS_KM = 6371.0088

def haversine_distance_km(lat1, lon1, lat2, lon2):
    """Calculates haversine distance between two coordinates in km."""
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = (np.sin(dlat / 2) ** 2 +
         np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2) ** 2)
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return EARTH_RADIUS_KM * c

def compute_clusters(complaints: List[Dict[str, Any]], eps_km: float = 0.8, min_samples: int = 2) -> List[Dict[str, Any]]:
    """
    Groups complaints into geospatial hotspots per category using DBSCAN.
    eps_km: Neighborhood radius in kilometers (default 0.8 km = 800m).
    min_samples: Minimum complaints to form a cluster (default 2).
    """
    # Filter valid coordinates
    valid_complaints = []
    for c in complaints:
        try:
            lat = float(c.get("latitude"))
            lng = float(c.get("longitude"))
            if -90 <= lat <= 90 and -180 <= lng <= 180:
                valid_complaints.append({
                    **c,
                    "lat": lat,
                    "lng": lng,
                })
        except (TypeError, ValueError):
            continue

    if len(valid_complaints) < min_samples:
        return []

    # Group by category to find category-specific hotspots
    categories = sorted(list(set(c.get("category", "other") for c in valid_complaints)))
    detected_clusters = []

    for cat in categories:
        cat_complaints = [c for c in valid_complaints if c.get("category") == cat]
        if len(cat_complaints) < min_samples:
            continue

        coords = np.array([[c["lat"], c["lng"]] for c in cat_complaints])
        coords_rad = np.radians(coords)
        eps_rad = eps_km / EARTH_RADIUS_KM

        db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine')
        labels = db.fit_predict(coords_rad)

        unique_labels = set(labels)
        for label in unique_labels:
            if label == -1:
                # Noise points (not in a cluster)
                continue

            cluster_members = [cat_complaints[i] for i, l in enumerate(labels) if l == label]
            if len(cluster_members) < min_samples:
                continue

            member_lats = [c["lat"] for c in cluster_members]
            member_lngs = [c["lng"] for c in cluster_members]
            centroid_lat = round(float(np.mean(member_lats)), 6)
            centroid_lng = round(float(np.mean(member_lngs)), 6)

            # Compute radius in meters
            max_dist_km = 0.0
            for c in cluster_members:
                d = haversine_distance_km(centroid_lat, centroid_lng, c["lat"], c["lng"])
                if d > max_dist_km:
                    max_dist_km = d
            radius_meters = max(round(float(max_dist_km * 1000), 1), 150.0) # minimum 150m for visual map

            # Dominant ward
            ward_counts = {}
            for c in cluster_members:
                w_id = c.get("ward_id")
                if w_id is not None:
                    ward_counts[w_id] = ward_counts.get(w_id, 0) + 1
            dominant_ward_id = max(ward_counts, key=ward_counts.get) if ward_counts else None

            # Timestamps
            created_times = [c.get("created_at") for c in cluster_members if c.get("created_at")]
            first_seen = min(created_times) if created_times else None
            last_seen = max(created_times) if created_times else None

            # Text Cohesion & Near-duplicate analysis (TF-IDF + Cosine Similarity)
            descriptions = [c.get("description", "") for c in cluster_members if c.get("description")]
            cohesion_score = 0.0
            top_keywords = []

            if len(descriptions) >= 2:
                try:
                    tfidf = TfidfVectorizer(stop_words='english', max_features=100)
                    matrix = tfidf.fit_transform(descriptions)
                    sim_matrix = cosine_similarity(matrix)
                    # Get upper triangle average similarity
                    triu_indices = np.triu_indices_from(sim_matrix, k=1)
                    if len(triu_indices[0]) > 0:
                        cohesion_score = round(float(np.mean(sim_matrix[triu_indices])), 3)

                    # Extract top keywords
                    feature_names = tfidf.get_feature_names_out()
                    sum_scores = matrix.sum(axis=0).A1
                    sorted_indices = sum_scores.argsort()[::-1]
                    top_keywords = [feature_names[i] for i in sorted_indices[:4]]
                except Exception as ex:
                    cohesion_score = 0.0

            detected_clusters.append({
                "category": cat,
                "ward_id": dominant_ward_id,
                "complaint_count": len(cluster_members),
                "centroid_lat": centroid_lat,
                "centroid_lng": centroid_lng,
                "radius_meters": radius_meters,
                "first_seen": str(first_seen) if first_seen else None,
                "last_seen": str(last_seen) if last_seen else None,
                "cohesion_score": cohesion_score,
                "is_same_incident": cohesion_score >= 0.35,
                "top_keywords": top_keywords,
                "complaint_ids": [c.get("id") for c in cluster_members if c.get("id") is not None],
            })

    # Sort largest clusters first
    detected_clusters.sort(key=lambda x: x["complaint_count"], reverse=True)
    return detected_clusters
