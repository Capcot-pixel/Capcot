from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import ffmpeg
import shutil
import tempfile
import json

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create temp directory for video processing
TEMP_DIR = Path("/tmp/video_editor")
TEMP_DIR.mkdir(exist_ok=True)


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class VideoProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    user_id: Optional[str] = None
    clips: List[dict] = []
    text_overlays: List[dict] = []
    transitions: List[dict] = []
    audio_tracks: List[dict] = []
    total_duration: float = 0
    resolution: dict = {"width": 1920, "height": 1080}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FilterEffect(BaseModel):
    type: str
    intensity: float

class TrimRequest(BaseModel):
    start_time: float
    end_time: float

class FilterRequest(BaseModel):
    filters: List[FilterEffect]

class ExportRequest(BaseModel):
    resolution: str = "1080p"
    fps: int = 30
    quality: str = "high"


# Helper Functions
def get_temp_path(extension: str = ".mp4") -> str:
    """Generate a unique temporary file path"""
    return str(TEMP_DIR / f"{uuid.uuid4()}{extension}")

def cleanup_file(file_path: str):
    """Remove a temporary file"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        logger.error(f"Error cleaning up file {file_path}: {e}")


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Video Editor API", "version": "1.0.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Video Processing Endpoints

@api_router.post("/projects")
async def create_project(name: str = Form(...)):
    """Create a new video editing project"""
    project = VideoProject(name=name)
    await db.projects.insert_one(project.dict())
    return project

@api_router.get("/projects", response_model=List[VideoProject])
async def get_projects():
    """Get all projects"""
    projects = await db.projects.find().to_list(100)
    return [VideoProject(**project) for project in projects]

@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Get a specific project"""
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return VideoProject(**project)

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, updates: dict):
    """Update a project"""
    updates["updated_at"] = datetime.utcnow()
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"success": True}

@api_router.post("/video/info")
async def get_video_info(file: UploadFile = File(...)):
    """Get video information using ffprobe"""
    temp_input = get_temp_path()
    
    try:
        # Save uploaded file
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get video info using ffprobe
        probe = ffmpeg.probe(temp_input)
        video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
        
        if not video_stream:
            raise HTTPException(status_code=400, detail="No video stream found")
        
        duration = float(probe['format']['duration'])
        width = int(video_stream['width'])
        height = int(video_stream['height'])
        fps = eval(video_stream['r_frame_rate'])
        
        return {
            "duration": duration,
            "width": width,
            "height": height,
            "fps": fps,
            "format": probe['format']['format_name'],
            "size": int(probe['format']['size'])
        }
    finally:
        cleanup_file(temp_input)

@api_router.post("/video/trim")
async def trim_video(
    file: UploadFile = File(...),
    start_time: float = Form(...),
    end_time: float = Form(...)
):
    """Trim a video to specified start and end times"""
    temp_input = get_temp_path()
    temp_output = get_temp_path()
    
    try:
        # Save uploaded file
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Trim video using ffmpeg
        duration = end_time - start_time
        
        (
            ffmpeg
            .input(temp_input, ss=start_time, t=duration)
            .output(temp_output, codec='copy')
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        
        return FileResponse(
            temp_output,
            media_type="video/mp4",
            filename="trimmed_video.mp4"
        )
    except ffmpeg.Error as e:
        logger.error(f"FFmpeg error: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail="Video processing failed")
    finally:
        cleanup_file(temp_input)
        # Note: temp_output will be cleaned up after FileResponse sends it

@api_router.post("/video/filter")
async def apply_filter(
    file: UploadFile = File(...),
    filter_type: str = Form(...),
    intensity: float = Form(...)
):
    """Apply a filter to a video"""
    temp_input = get_temp_path()
    temp_output = get_temp_path()
    
    try:
        # Save uploaded file
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Build filter string
        if filter_type == "brightness":
            vf = f"eq=brightness={intensity - 0.5}"
        elif filter_type == "contrast":
            vf = f"eq=contrast={intensity + 0.5}"
        elif filter_type == "saturation":
            vf = f"eq=saturation={intensity + 0.5}"
        elif filter_type == "blur":
            blur_value = int(intensity * 10) * 2 + 1  # Ensure odd number
            vf = f"boxblur={blur_value}:{blur_value}"
        elif filter_type == "grayscale":
            vf = "hue=s=0"
        elif filter_type == "sepia":
            vf = "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131"
        else:
            raise HTTPException(status_code=400, detail="Invalid filter type")
        
        # Apply filter
        (
            ffmpeg
            .input(temp_input)
            .output(temp_output, vf=vf, vcodec='h264', preset='medium')
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        
        return FileResponse(
            temp_output,
            media_type="video/mp4",
            filename="filtered_video.mp4"
        )
    except ffmpeg.Error as e:
        logger.error(f"FFmpeg error: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail="Video filter failed")
    finally:
        cleanup_file(temp_input)

@api_router.post("/video/merge")
async def merge_videos(files: List[UploadFile] = File(...)):
    """Merge multiple videos"""
    temp_inputs = []
    temp_list = get_temp_path(".txt")
    temp_output = get_temp_path()
    
    try:
        # Save all uploaded files
        for file in files:
            temp_path = get_temp_path()
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            temp_inputs.append(temp_path)
        
        # Create concat file list
        with open(temp_list, "w") as f:
            for path in temp_inputs:
                f.write(f"file '{path}'\n")
        
        # Merge videos
        (
            ffmpeg
            .input(temp_list, format='concat', safe=0)
            .output(temp_output, c='copy')
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        
        return FileResponse(
            temp_output,
            media_type="video/mp4",
            filename="merged_video.mp4"
        )
    except ffmpeg.Error as e:
        logger.error(f"FFmpeg error: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail="Video merge failed")
    finally:
        for path in temp_inputs:
            cleanup_file(path)
        cleanup_file(temp_list)

@api_router.post("/video/speed")
async def change_speed(
    file: UploadFile = File(...),
    speed: float = Form(...)
):
    """Change video playback speed"""
    temp_input = get_temp_path()
    temp_output = get_temp_path()
    
    try:
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Speed control using setpts filter
        video_filter = f"setpts={1/speed}*PTS"
        
        stream = ffmpeg.input(temp_input)
        video = stream.video.filter('setpts', f'{1/speed}*PTS')
        
        # Handle audio if present - chain atempo filters for extreme speeds
        try:
            if speed > 2.0:
                # For speeds > 2x, chain multiple atempo filters
                audio = stream.audio.filter('atempo', 2.0).filter('atempo', speed/2.0)
            elif speed < 0.5:
                # For speeds < 0.5x, chain multiple atempo filters
                audio = stream.audio.filter('atempo', 0.5).filter('atempo', speed/0.5)
            else:
                audio = stream.audio.filter('atempo', speed)
            output = ffmpeg.output(video, audio, temp_output, codec='libx264')
        except:
            output = ffmpeg.output(video, temp_output, codec='libx264')
        
        output.overwrite_output().run(capture_stdout=True, capture_stderr=True)
        
        return FileResponse(
            temp_output,
            media_type="video/mp4",
            filename=f"speed_{speed}x.mp4"
        )
    except ffmpeg.Error as e:
        logger.error(f"FFmpeg error: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail="Speed change failed")
    finally:
        cleanup_file(temp_input)

@api_router.post("/video/text-overlay")
async def add_text_overlay(
    file: UploadFile = File(...),
    text: str = Form(...),
    font_size: int = Form(32),
    color: str = Form("white"),
    position_x: float = Form(0.5),
    position_y: float = Form(0.5),
    start_time: float = Form(0),
    duration: float = Form(5)
):
    """Add text overlay to video"""
    temp_input = get_temp_path()
    temp_output = get_temp_path()
    
    try:
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get video dimensions
        probe = ffmpeg.probe(temp_input)
        video_stream = next((s for s in probe['streams'] if s['codec_type'] == 'video'), None)
        width = int(video_stream['width'])
        height = int(video_stream['height'])
        
        # Calculate position
        x = int(width * position_x)
        y = int(height * position_y)
        
        # Create drawtext filter
        text_filter = f"drawtext=text='{text}':fontsize={font_size}:fontcolor={color}:x={x}:y={y}:enable='between(t,{start_time},{start_time + duration})'"
        
        (
            ffmpeg
            .input(temp_input)
            .output(temp_output, vf=text_filter, codec='libx264', preset='fast')
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        
        return FileResponse(
            temp_output,
            media_type="video/mp4",
            filename="text_overlay.mp4"
        )
    except ffmpeg.Error as e:
        logger.error(f"FFmpeg error: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail="Text overlay failed")
    finally:
        cleanup_file(temp_input)

@api_router.post("/video/transition")
async def add_transition(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    transition_type: str = Form("fade"),
    duration: float = Form(1.0)
):
    """Add transition between two videos"""
    temp_input1 = get_temp_path()
    temp_input2 = get_temp_path()
    temp_output = get_temp_path()
    
    try:
        # Save uploaded files
        with open(temp_input1, "wb") as buffer:
            shutil.copyfileobj(file1.file, buffer)
        with open(temp_input2, "wb") as buffer:
            shutil.copyfileobj(file2.file, buffer)
        
        # Create transition based on type
        input1 = ffmpeg.input(temp_input1)
        input2 = ffmpeg.input(temp_input2)
        
        if transition_type == "fade":
            transition = ffmpeg.filter([input1, input2], 'xfade', transition='fade', duration=duration)
        elif transition_type == "dissolve":
            transition = ffmpeg.filter([input1, input2], 'xfade', transition='dissolve', duration=duration)
        elif transition_type == "wipe":
            transition = ffmpeg.filter([input1, input2], 'xfade', transition='wipeleft', duration=duration)
        elif transition_type == "slide":
            transition = ffmpeg.filter([input1, input2], 'xfade', transition='slideleft', duration=duration)
        else:
            transition = ffmpeg.filter([input1, input2], 'xfade', transition='fade', duration=duration)
        
        (
            ffmpeg
            .output(transition, temp_output, codec='libx264', preset='medium')
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        
        return FileResponse(
            temp_output,
            media_type="video/mp4",
            filename=f"transition_{transition_type}.mp4"
        )
    except ffmpeg.Error as e:
        logger.error(f"FFmpeg error: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail="Transition failed")
    finally:
        cleanup_file(temp_input1)
        cleanup_file(temp_input2)


@api_router.post("/video/export")
async def export_video(
    file: UploadFile = File(...),
    resolution: str = Form("1080p"),
    fps: int = Form(30),
    quality: str = Form("high")
):
    """Export video with specified settings"""
    temp_input = get_temp_path()
    temp_output = get_temp_path()
    
    try:
        # Save uploaded file
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Resolution mapping
        resolution_map = {
            "480p": "854:480",
            "720p": "1280:720",
            "1080p": "1920:1080",
            "4K": "3840:2160"
        }
        
        # Quality mapping
        quality_map = {
            "low": "28",
            "medium": "23",
            "high": "18"
        }
        
        scale = resolution_map.get(resolution, "1920:1080")
        crf = quality_map.get(quality, "23")
        
        # Export video
        (
            ffmpeg
            .input(temp_input)
            .output(
                temp_output,
                vf=f"scale={scale}",
                r=fps,
                vcodec='h264',
                crf=crf,
                preset='medium'
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        
        return FileResponse(
            temp_output,
            media_type="video/mp4",
            filename=f"export_{resolution}_{fps}fps.mp4"
        )
    except ffmpeg.Error as e:
        logger.error(f"FFmpeg error: {e.stderr.decode()}")
        raise HTTPException(status_code=500, detail="Video export failed")
    finally:
        cleanup_file(temp_input)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
