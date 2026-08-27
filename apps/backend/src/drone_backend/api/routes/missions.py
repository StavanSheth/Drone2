from fastapi import APIRouter, Depends
from typing import List
from drone_backend.services.mission_service import MissionService
from drone_backend.api.dependencies import get_mission_svc

router = APIRouter(tags=["Missions"])
