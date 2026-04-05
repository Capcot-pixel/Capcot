// Video Processing Service - Connects Frontend to Backend

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

class VideoProcessingService {
  // Convert local file URI to blob for upload
  async uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return await response.blob();
  }

  // Upload video and get info
  async getVideoInfo(videoUri: string) {
    try {
      const formData = new FormData();
      const blob = await this.uriToBlob(videoUri);
      formData.append('file', blob as any, 'video.mp4');

      const response = await fetch(`${BACKEND_URL}/api/video/info`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to get video info');
      return await response.json();
    } catch (error) {
      console.error('Get video info error:', error);
      throw error;
    }
  }

  // Trim video
  async trimVideo(videoUri: string, startTime: number, endTime: number) {
    try {
      const formData = new FormData();
      const blob = await this.uriToBlob(videoUri);
      formData.append('file', blob as any, 'video.mp4');
      formData.append('start_time', startTime.toString());
      formData.append('end_time', endTime.toString());

      const response = await fetch(`${BACKEND_URL}/api/video/trim`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to trim video');
      
      // Convert response to blob and create local URI
      const videoBlob = await response.blob();
      return await this.blobToUri(videoBlob);
    } catch (error) {
      console.error('Trim video error:', error);
      throw error;
    }
  }

  // Apply filter to video
  async applyFilter(videoUri: string, filterType: string, intensity: number) {
    try {
      const formData = new FormData();
      const blob = await this.uriToBlob(videoUri);
      formData.append('file', blob as any, 'video.mp4');
      formData.append('filter_type', filterType);
      formData.append('intensity', intensity.toString());

      const response = await fetch(`${BACKEND_URL}/api/video/filter`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to apply filter');
      
      const videoBlob = await response.blob();
      return await this.blobToUri(videoBlob);
    } catch (error) {
      console.error('Apply filter error:', error);
      throw error;
    }
  }

  // Change video speed
  async changeSpeed(videoUri: string, speed: number) {
    try {
      const formData = new FormData();
      const blob = await this.uriToBlob(videoUri);
      formData.append('file', blob as any, 'video.mp4');
      formData.append('speed', speed.toString());

      const response = await fetch(`${BACKEND_URL}/api/video/speed`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to change speed');
      
      const videoBlob = await response.blob();
      return await this.blobToUri(videoBlob);
    } catch (error) {
      console.error('Change speed error:', error);
      throw error;
    }
  }

  // Add text overlay
  async addTextOverlay(
    videoUri: string,
    text: string,
    fontSize: number,
    color: string,
    positionX: number,
    positionY: number,
    startTime: number,
    duration: number
  ) {
    try {
      const formData = new FormData();
      const blob = await this.uriToBlob(videoUri);
      formData.append('file', blob as any, 'video.mp4');
      formData.append('text', text);
      formData.append('font_size', fontSize.toString());
      formData.append('color', color);
      formData.append('position_x', positionX.toString());
      formData.append('position_y', positionY.toString());
      formData.append('start_time', startTime.toString());
      formData.append('duration', duration.toString());

      const response = await fetch(`${BACKEND_URL}/api/video/text-overlay`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to add text overlay');
      
      const videoBlob = await response.blob();
      return await this.blobToUri(videoBlob);
    } catch (error) {
      console.error('Add text overlay error:', error);
      throw error;
    }
  }

  // Add transition between two videos
  async addTransition(
    video1Uri: string,
    video2Uri: string,
    transitionType: string,
    duration: number
  ) {
    try {
      const formData = new FormData();
      const blob1 = await this.uriToBlob(video1Uri);
      const blob2 = await this.uriToBlob(video2Uri);
      
      formData.append('file1', blob1 as any, 'video1.mp4');
      formData.append('file2', blob2 as any, 'video2.mp4');
      formData.append('transition_type', transitionType);
      formData.append('duration', duration.toString());

      const response = await fetch(`${BACKEND_URL}/api/video/transition`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to add transition');
      
      const videoBlob = await response.blob();
      return await this.blobToUri(videoBlob);
    } catch (error) {
      console.error('Add transition error:', error);
      throw error;
    }
  }

  // Merge multiple videos
  async mergeVideos(videoUris: string[]) {
    try {
      const formData = new FormData();
      
      for (let i = 0; i < videoUris.length; i++) {
        const blob = await this.uriToBlob(videoUris[i]);
        formData.append('files', blob as any, `video${i}.mp4`);
      }

      const response = await fetch(`${BACKEND_URL}/api/video/merge`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to merge videos');
      
      const videoBlob = await response.blob();
      return await this.blobToUri(videoBlob);
    } catch (error) {
      console.error('Merge videos error:', error);
      throw error;
    }
  }

  // Export video with settings
  async exportVideo(
    videoUri: string,
    resolution: string,
    fps: number,
    quality: string,
    onProgress?: (progress: number) => void
  ) {
    try {
      const formData = new FormData();
      const blob = await this.uriToBlob(videoUri);
      formData.append('file', blob as any, 'video.mp4');
      formData.append('resolution', resolution);
      formData.append('fps', fps.toString());
      formData.append('quality', quality);

      const response = await fetch(`${BACKEND_URL}/api/video/export`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to export video');
      
      const videoBlob = await response.blob();
      return await this.blobToUri(videoBlob);
    } catch (error) {
      console.error('Export video error:', error);
      throw error;
    }
  }

  // Helper: Convert blob to local URI
  async blobToUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Save project to backend
  async saveProject(project: any) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) throw new Error('Failed to save project');
      return await response.json();
    } catch (error) {
      console.error('Save project error:', error);
      throw error;
    }
  }

  // Load projects from backend
  async loadProjects() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects`);
      if (!response.ok) throw new Error('Failed to load projects');
      return await response.json();
    } catch (error) {
      console.error('Load projects error:', error);
      throw error;
    }
  }

  // Update project
  async updateProject(projectId: string, updates: any) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update project');
      return await response.json();
    } catch (error) {
      console.error('Update project error:', error);
      throw error;
    }
  }
}

export const videoService = new VideoProcessingService();
