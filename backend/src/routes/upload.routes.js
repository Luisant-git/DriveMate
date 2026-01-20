import express from 'express';
import { upload, uploadFile } from '../controllers/upload.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/upload/file:
 *   post:
 *     summary: Upload a file
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (images, documents)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://storage.example.com/file.jpg"
 *                 filename:
 *                   type: string
 */
router.post('/file', upload.single('file'), uploadFile);

export default router;