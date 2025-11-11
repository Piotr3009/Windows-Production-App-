"""Cutting optimization heuristics for sash production."""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, Iterable, List, Tuple

from ..models import (
    OptimizationBar,
    OptimizationConfig,
    OptimizationComponent,
    OptimizationGroup,
)


@dataclass
class _Bar:
    identifier: str
    cuts: List[float]
    remaining: float


def _group_components(components: Iterable[OptimizationComponent]) -> Dict[Tuple[str, str], List[Tuple[str, float]]]:
    grouped: Dict[Tuple[str, str], List[Tuple[str, float]]] = defaultdict(list)
    for component in components:
        key = (component.section, component.material)
        for _ in range(component.quantity):
            grouped[key].append((component.id, component.length))
    return grouped


def best_fit_decreasing(
    components: Iterable[OptimizationComponent],
    config: OptimizationConfig,
) -> List[OptimizationGroup]:
    """Execute a Best-Fit Decreasing heuristic for the pre-pre cut stage."""

    grouped_components = _group_components(components)
    groups: List[OptimizationGroup] = []

    for (section, material), lengths in grouped_components.items():
        ordered = sorted(lengths, key=lambda item: item[1], reverse=True)
        usable_length = config.stock_length - (2 * config.end_trim)
        bars: List[_Bar] = []
        bar_index = 1

        for _, length in ordered:
            if length < config.minimum_piece:
                raise ValueError(
                    f"Component length {length} for section {section} is below minimum allowed {config.minimum_piece}"
                )

            best_fit_index = None
            best_remaining = None

            for index, bar in enumerate(bars):
                required = length if not bar.cuts else length + config.kerf
                if required <= bar.remaining:
                    remaining_after = bar.remaining - required
                    if best_remaining is None or remaining_after < best_remaining:
                        best_remaining = remaining_after
                        best_fit_index = index

            if best_fit_index is None:
                bar_id = f"{section.replace(' ', '')}-{bar_index:04d}"
                bar_index += 1
                bars.append(
                    _Bar(
                        identifier=bar_id,
                        cuts=[length],
                        remaining=usable_length - length,
                    )
                )
            else:
                bar = bars[best_fit_index]
                required = length if not bar.cuts else length + config.kerf
                bar.cuts.append(length)
                bar.remaining -= required

        total_waste = 0.0
        optimization_bars: List[OptimizationBar] = []
        for bar in bars:
            waste = bar.remaining + (2 * config.end_trim)
            utilization = 1 - (waste / config.stock_length)
            total_waste += waste
            optimization_bars.append(
                OptimizationBar(
                    barId=bar.identifier,
                    cuts=bar.cuts,
                    waste=round(waste, 2),
                    utilization=round(utilization, 3),
                )
            )

        summary = {
            "totalBars": len(bars),
            "avgWaste": round(total_waste / max(len(bars), 1), 2) if bars else 0.0,
            "avgUtil": round(
                sum(item.utilization for item in optimization_bars) / max(len(optimization_bars), 1) * 100,
                1,
            ) if optimization_bars else 0.0,
        }

        groups.append(
            OptimizationGroup(
                section=section,
                material=material,
                bars=optimization_bars,
                summary=summary,
            )
        )

    return groups
