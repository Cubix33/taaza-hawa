"""Hourly Chronos-Bolt forecast job. The model is bundled in the image, never downloaded at runtime."""
from __future__ import annotations

import os

from taaza import forecast

from .common import now, store

_pipeline = None


def _predict(series: list[float], horizon: int) -> list[tuple[float, float, float]]:
    global _pipeline
    import torch
    from chronos import BaseChronosPipeline
    if _pipeline is None:
        _pipeline = BaseChronosPipeline.from_pretrained(os.environ["CHRONOS_MODEL_PATH"], device_map="cpu")
    values = _pipeline.predict(torch.tensor(series, dtype=torch.float32), prediction_length=horizon)
    return [(float(values[0, 0, i]), float(values[0, 1, i]), float(values[0, 2, i])) for i in range(horizon)]


def handler(_event, _ctx):
    mode = os.environ.get("FORECAST_MODE", "shadow")
    return {"created": forecast.run(store(), now(), _predict, mode=mode), "mode": mode}
