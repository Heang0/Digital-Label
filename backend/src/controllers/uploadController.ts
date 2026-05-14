import { Request, Response } from 'express';
import imagekit from '../config/imagekit';

export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer, // Use buffer from memory storage
      fileName: `profile-${Date.now()}.webp`,
      folder: '/digital-label/profiles',
      useUniqueFileName: true,
      transformation: {
        pre: 'w-400,h-400,fo-face,c-at_max'
      }
    });

    res.status(200).json({
      message: 'Image uploaded successfully',
      url: uploadResponse.url,
    });
  } catch (error: any) {
    console.error('❌ ImageKit Upload Error:', JSON.stringify(error, null, 2));
    res.status(500).json({ 
      message: 'Internal server error during upload', 
      error: error.message || error,
      details: error
    });
  }
};
