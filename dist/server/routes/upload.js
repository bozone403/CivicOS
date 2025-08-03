import { jwtAuth } from './auth.js';
export function registerUploadRoutes(app) {
    // POST /api/upload/image - Upload image for posts
    app.post('/api/upload/image', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            // For now, return a mock image URL since we don't have file storage configured
            // In production, this would upload to a service like AWS S3 or Cloudinary
            const mockImageUrl = `https://picsum.photos/800/600?random=${Date.now()}`;
            res.json({
                success: true,
                imageUrl: mockImageUrl,
                message: "Image uploaded successfully"
            });
        }
        catch (error) {
            console.error('Image upload error:', error);
            res.status(500).json({ error: "Failed to upload image" });
        }
    });
    // POST /api/upload/video - Upload video for posts
    app.post('/api/upload/video', jwtAuth, async (req, res) => {
        try {
            const currentUserId = req.user.id;
            // For now, return a mock video URL
            const mockVideoUrl = `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`;
            res.json({
                success: true,
                videoUrl: mockVideoUrl,
                message: "Video uploaded successfully"
            });
        }
        catch (error) {
            console.error('Video upload error:', error);
            res.status(500).json({ error: "Failed to upload video" });
        }
    });
}
