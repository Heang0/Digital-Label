import { Request, Response } from 'express';

export const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // req.file.path is the URL of the uploaded image on Cloudinary
    res.status(200).json({
      message: 'Image uploaded successfully',
      url: req.file.path,
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Internal server error during upload', error: error.message });
  }
};
