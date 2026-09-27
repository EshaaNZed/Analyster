"""
Convenience entrypoint script to run the data engineering pipeline from root.
Usage: python scripts/run_data_pipeline.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.data_engine.pipeline_runner import run_data_engineering_pipeline

if __name__ == "__main__":
    run_data_engineering_pipeline()
