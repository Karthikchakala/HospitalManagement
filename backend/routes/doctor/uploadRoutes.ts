// backend/routes/doctor/uploadRoutes.ts
import { Router, Request, Response } from 'express';
import { protect } from '../../middleware/authMiddleware';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

const router = Router();
// Use memory storage to capture the file buffer before sending to Cloudinary, with limits and filtering
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only PDF and image files are allowed.'));
        }
        cb(null, true);
    }
}); 

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// @route   POST /api/doctor/upload/document
// @desc    Uploads a file to Cloudinary and returns the URL/ID
// @access  Private (Doctor Only)
// router.post('/upload/document', protect, upload.single('document'), async (req: Request, res: Response) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: 'No file uploaded.' });
//         }
        
//         // Convert file buffer to base64 string for secure upload
//         const b64 = Buffer.from(req.file.buffer).toString("base64");
//         let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
//         const result = await cloudinary.uploader.upload(dataURI, {
//             folder: 'hms_emr_docs', // Store in a dedicated folder
//             resource_type: 'auto'
//         });

//         res.status(200).json({
//             public_id: result.public_id,
//             url: result.secure_url,
//             file_type: req.file.mimetype 
//         });

//     } catch (err: any) {
//         console.error('Cloudinary Upload Error:', err);
//         res.status(500).json({ message: 'File upload failed.' });
//     }
// });

router.post('/upload/document', protect, upload.single('document'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        // Basic magic-byte validation as a lightweight scan
        const buf = req.file.buffer;
        const mime = req.file.mimetype;
        const isPdf = mime === 'application/pdf' && buf.slice(0, 4).toString('utf8') === '%PDF';
        const isJpeg = mime === 'image/jpeg' && buf[0] === 0xff && buf[1] === 0xd8 && buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9;
        const isPng = mime === 'image/png' && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
        if (!(isPdf || isJpeg || isPng)) {
            return res.status(400).json({ message: 'File failed validation.' });
        }
        
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'hms_emr_docs',
            resource_type: 'auto' // this supports PDFs
        });

        res.status(200).json({
            public_id: result.public_id,
            url: result.secure_url,
            file_type: req.file.mimetype 
        });

    } catch (err: any) {
        console.error('Cloudinary Upload Error:', err);
        res.status(500).json({ message: 'File upload failed.' });
    }
});


export default router;