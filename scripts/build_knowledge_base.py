"""
Convenience entrypoint: python scripts/build_knowledge_base.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.knowledge_base.kb_builder import build_knowledge_base

if __name__ == "__main__":
    build_knowledge_base()
