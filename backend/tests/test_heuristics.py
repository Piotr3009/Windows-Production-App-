from backend.app.models import OptimizationComponent, OptimizationConfig
from backend.app.optimizer.heuristics import best_fit_decreasing


def test_best_fit_decreasing_groups_lengths():
    components = [
        OptimizationComponent(id="A", section="63x63", material="Softwood", length=1120, quantity=2),
        OptimizationComponent(id="B", section="63x63", material="Softwood", length=845, quantity=3),
    ]

    config = OptimizationConfig(stock_length=5900, kerf=3, end_trim=10, minimum_piece=200)
    groups = best_fit_decreasing(components, config)

    assert len(groups) == 1
    group = groups[0]
    assert group.section == "63x63"
    assert group.summary["totalBars"] >= 1
    for bar in group.bars:
        assert sum(bar.cuts) <= config.stock_length
