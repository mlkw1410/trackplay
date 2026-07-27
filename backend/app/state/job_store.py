"""Temporary in-memory stores retained from the original implementation."""

# These stores intentionally remain in memory. They are cleared on server restart,
# matching the behavior of the pre-refactor application.
videos = {}
jobs = {}
