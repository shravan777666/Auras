import https from 'https';
import { errorResponse } from '../utils/responses.js';

export const getFile = async (req, res) => {
  try {
    const { encodedPath } = req.params;
    const decodedPath = Buffer.from(encodedPath, 'base64').toString('utf-8');

    if (!decodedPath) {
      return errorResponse(res, 'Invalid file path', 400);
    }

    let fileType = 'application/octet-stream';
    if(decodedPath.endsWith('.pdf')) {
        fileType = 'application/pdf';
    } else if (decodedPath.endsWith('.jpg') || decodedPath.endsWith('.jpeg')) {
        fileType = 'image/jpeg';
    } else if (decodedPath.endsWith('.png')) {
        fileType = 'image/png';
    }

    res.setHeader('Content-Type', fileType);
    
    https.get(decodedPath, (stream) => {
      stream.pipe(res);
    }).on('error', (e) => {
      console.error('Error fetching file from Cloudinary:', e);
      return errorResponse(res, 'File not found', 404);
    });

  } catch (error) {
    console.error('Error getting file:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};
