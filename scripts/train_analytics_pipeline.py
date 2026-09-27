"""Convenience entrypoint: python scripts/train_analytics_pipeline.py"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.analytics.analytics_pipeline import run_analytics_pipeline

if __name__ == "__main__":
    run_analytics_pipeline()
