from flask import Blueprint, request
from pydantic import BaseModel, Field

from services import gds_service
from utils.responses import ok

gds_bp = Blueprint("gds", __name__, url_prefix="/api/gds")


class PageRankPayload(BaseModel):
    topN: int = Field(default=20, ge=1, le=100)


class NodeSimilarityPayload(BaseModel):
    userId: str
    topK: int = Field(default=10, ge=1, le=100)


class LouvainPayload(BaseModel):
    topN: int = Field(default=20, ge=1, le=100)


@gds_bp.post("/pagerank")
def pagerank():
    payload = PageRankPayload(**(request.get_json(silent=True) or {}))
    return ok(gds_service.run_pagerank(payload.topN))


@gds_bp.post("/node-similarity")
def node_similarity():
    payload = NodeSimilarityPayload(**request.get_json(force=True))
    return ok(gds_service.run_node_similarity(payload.userId, payload.topK))


@gds_bp.post("/communities")
def communities():
    payload = LouvainPayload(**(request.get_json(silent=True) or {}))
    return ok(gds_service.run_louvain(payload.topN))


@gds_bp.delete("/graph/<graph_name>")
def drop_graph(graph_name):
    return ok(gds_service.drop_graph(graph_name))
