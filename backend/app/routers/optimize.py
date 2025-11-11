"""Optimization endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..models import OptimizationRequest, OptimizationResponse
from ..optimizer.solver import solve_cutting_stock

router = APIRouter(prefix="/api", tags=["optimizer"])


@router.post("/optimize", response_model=OptimizationResponse)
def run_optimization(request: OptimizationRequest) -> OptimizationResponse:
    """Execute the requested optimization strategy."""
    try:
        groups = solve_cutting_stock(request.components, request.configuration)
    except ValueError as exc:  # validation issues from heuristic
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return OptimizationResponse(groups=groups, configuration=request.configuration)
