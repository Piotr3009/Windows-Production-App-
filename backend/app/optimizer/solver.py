"""Integration with advanced solvers (optional OR-Tools support)."""
from __future__ import annotations

from typing import Iterable, List

from ..models import OptimizationConfig, OptimizationComponent, OptimizationGroup
from .heuristics import best_fit_decreasing

try:  # pragma: no cover - optional dependency
    from ortools.linear_solver import pywraplp  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    pywraplp = None


def solve_cutting_stock(
    components: Iterable[OptimizationComponent],
    config: OptimizationConfig,
) -> List[OptimizationGroup]:
    """Route to either heuristic or an optional CP-SAT solver."""
    if config.solver != "ortools" or pywraplp is None:
        return best_fit_decreasing(components, config)

    # Placeholder exact optimisation using heuristic fallback if OR-Tools not configured.
    # A full CP-SAT model can be implemented in the future.
    return best_fit_decreasing(components, config)
