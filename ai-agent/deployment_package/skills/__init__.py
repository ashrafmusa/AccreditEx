# Skills Package
# Contains modular skill modules for the AI agent

"""
Skills are modular knowledge modules that can be loaded on-demand.
Each skill provides specialized knowledge or guidelines for specific tasks.

Available Skills:
- markdown_formatting: Response formatting guidelines
"""

from .markdown_formatting import get_markdown_formatting_skill, MARKDOWN_FORMATTING_SKILL

__all__ = [
    'get_markdown_formatting_skill',
    'MARKDOWN_FORMATTING_SKILL'
]
