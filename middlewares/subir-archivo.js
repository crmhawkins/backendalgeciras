const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/perfiles');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  console.log('🧠 ext recibido en subir archivo:', file.mimetype);//extension
  const mime = allowedTypes.test(file.mimetype);
  if (mime && allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no válido. Solo se permiten JPG, JPEG, PNG o WEBP.'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = { upload };