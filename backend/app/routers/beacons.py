from fastapi import APIRouter, HTTPException
from app.database import db
from app.models.beacon import Beacon, BeaconCreate, BeaconUpdate
from bson import ObjectId

def beacon_helper(beacon_dict: dict) -> Beacon:
    return Beacon(
        id=str(beacon_dict["_id"]),
        name=beacon_dict["name"],
        address=beacon_dict["address"],
        capacity=beacon_dict["capacity"]
    )

beacons_collection = db['beacons']
router = APIRouter()

@router.post("/beacons")
def create_beacon(payload: BeaconCreate):
    result = beacons_collection.insert_one(payload.model_dump())
    return {
        "message": "Beacon created successfully",
        "beacon_id": str(result.inserted_id)
    }

@router.get("/beacons")
def get_beacons():
    return [beacon_helper(b) for b in beacons_collection.find()]

@router.get("/beacons/{beacon_id}")
def get_beacon(beacon_id: str):
    beacon = beacons_collection.find_one({"_id": ObjectId(beacon_id)})
    if not beacon:
        raise HTTPException(status_code=404, detail="Beacon not found")
    return beacon_helper(beacon)

@router.patch("/beacons/{beacon_id}")
def update_beacon(beacon_id: str, beacon_update: BeaconUpdate):
    update_data = beacon_update.model_dump(exclude_unset=True)
    result = beacons_collection.update_one(
        {"_id": ObjectId(beacon_id)},
        {"$set": update_data}
    )
    return {"matched": result.matched_count, "modified": result.modified_count}

@router.delete("/beacons/{beacon_id}")
def delete_beacon(beacon_id: str):
    result = beacons_collection.delete_one({"_id": ObjectId(beacon_id)})
    return {"deleted": result.deleted_count}