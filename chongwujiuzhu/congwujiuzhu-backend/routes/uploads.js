const express = require('express');
const multer = require('multer');
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID || '',
  SecretKey: process.env.COS_SECRET_KEY || ''
});

const MAX_RETRIES = parseInt(process.env.COS_RETRY || '3', 10);
const RETRY_DELAY_MS = parseInt(process.env.COS_RETRY_DELAY_MS || '1500', 10);

const getExt = (filename) => {
  const parts = (filename || '').split('.');
  if (parts.length < 2) return '';
  return `.${parts.pop()}`;
};

const buildKey = (originalname) => {
  const prefix = (process.env.COS_PREFIX || '/congwu/').replace(/\\/g, '/');
  const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const ext = getExt(originalname);
  return `${normalized}${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
};

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: 'No file uploaded' });
  }

  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION;

  // Fallback to local storage if COS is not configured
  if (!bucket || !region) {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}${getExt(req.file.originalname)}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFile(filePath, req.file.buffer, (err) => {
      if (err) {
        console.error('Local upload failed:', err);
        return res.status(500).json({ code: 500, message: 'Upload failed' });
      }
      
      // Assuming server runs on port 3000. In production this should be configured.
      // For local dev, we use the host from request or default to localhost:3000
      const protocol = req.protocol;
      const host = req.get('host');
      const url = `${protocol}://${host}/uploads/${filename}`;
      
      res.json({
        code: 200,
        message: 'success',
        data: { url }
      });
    });
    return;
  }

  const key = buildKey(req.file.originalname);

  const putWithRetry = (attempt) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: req.file.buffer,
        Timeout: 120000
      },
      (err, data) => {
        if (err) {
          const canRetry =
            attempt < MAX_RETRIES &&
            (err.code === 'UserNetworkTooSlow' ||
              err.code === 'RequestTimeout' ||
              err.code === 'TimeoutError');
          if (canRetry) {
            const delay = RETRY_DELAY_MS * attempt;
            return setTimeout(() => putWithRetry(attempt + 1), delay);
          }
          console.error('COS upload failed:', err);
          return res.status(500).json({ code: 500, message: 'Upload failed' });
        }

        const baseUrl = `https://${bucket}.cos.${region}.myqcloud.com`;
        const url = `${baseUrl}${key.startsWith('/') ? key : `/${key}`}`;

        res.json({
          code: 200,
          message: 'success',
          data: { url, etag: data && data.ETag }
        });
      }
    );
  };

  putWithRetry(1);
});

module.exports = router;
