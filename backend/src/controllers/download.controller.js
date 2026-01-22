import prisma from '../config/database.js';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';

export const downloadDriverInfo = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Create a zip archive
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.attachment(`driver_${driver.name}_documents.zip`);
    archive.pipe(res);

    // Generate driver info PDF
    const doc = new PDFDocument();
    let pdfBuffer = Buffer.alloc(0);
    
    doc.on('data', (chunk) => {
      pdfBuffer = Buffer.concat([pdfBuffer, chunk]);
    });

    doc.on('end', () => {
      archive.append(pdfBuffer, { name: 'driver_info.pdf' });
      
      // Add document files if they exist
      const documents = [
        { field: 'photo', name: 'driver_photo.jpg' },
        { field: 'dlPhoto', name: 'driving_license.jpg' },
        { field: 'panPhoto', name: 'pan_card.jpg' },
        { field: 'aadharPhoto', name: 'aadhar_card.jpg' }
      ];

      documents.forEach(({ field, name }) => {
        if (driver[field]) {
          let filePath;
          
          if (driver[field].startsWith('http')) {
            // Full URL - extract filename
            const filename = driver[field].split('/').pop();
            filePath = path.join(process.cwd(), 'uploads', filename);
          } else {
            // Legacy filename only
            filePath = path.join(process.cwd(), 'uploads', driver[field]);
          }
          
          console.log(`Checking file: ${filePath}`);
          if (fs.existsSync(filePath)) {
            console.log(`Found file: ${filePath}`);
            archive.file(filePath, { name });
          } else {
            console.log(`File not found: ${filePath}`);
          }
        }
      });

      archive.finalize();
    });

    // Generate PDF content
    doc.fontSize(20).text('Driver Information', 50, 50);
    doc.fontSize(12);
    
    const info = [
      ['Name', driver.name],
      ['Phone', driver.phone],
      ['Email', driver.email],
      ['Aadhar Number', driver.aadharNo],
      ['License Number', driver.licenseNo],
      ['Package Type', driver.packageType],
      ['Status', driver.status],
      ['Rating', driver.rating?.toString() || '0'],
      ['Total Rides', driver.totalRides?.toString() || '0'],
      ['GPay Number', driver.gpayNo || 'N/A'],
      ['PhonePe Number', driver.phonepeNo || 'N/A']
    ];

    let yPosition = 100;
    info.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 50, yPosition);
      yPosition += 20;
    });

    doc.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};