const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const Image = require('../models/Image');

const uploadsDir = path.join(__dirname, '../uploads');

// Helper: ensure uploads dir exists
const ensureDir = () => {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
};

// @desc    Upload image
// @route   POST /api/images/upload
// @access  Private
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const { filename, originalname, size, mimetype } = req.file;

    // Get image metadata using sharp
    const metadata = await sharp(req.file.path).metadata();

    // Save to MongoDB
    const image = await Image.create({
      user: req.user._id,
      originalName: originalname,
      originalPath: filename,
      originalSize: size,
      originalFormat: metadata.format,
      width: metadata.width,
      height: metadata.height,
      status: 'uploaded',
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image: {
        id: image._id,
        originalName: image.originalName,
        originalPath: `/uploads/${filename}`,
        originalSize: size,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process image with various operations
// @route   POST /api/images/process/:id
// @access  Private
const processImage = async (req, res, next) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, user: req.user._id });

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const {
      resize,        // { width, height }
      rotate,        // degrees: 0, 90, 180, 270
      format,        // 'jpeg' | 'png'
      quality,       // 1-100 for compression
      filters,       // ['grayscale', 'sepia', 'blur']
      removeBackground, // boolean
      enhance,       // boolean - sharpen/clarity
    } = req.body;

    ensureDir();
    const sourcePath = path.join(uploadsDir, image.originalPath);
    const processedFilename = `processed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${format || 'jpeg'}`;
    const outputPath = path.join(uploadsDir, processedFilename);

    // Start sharp pipeline
    let pipeline = sharp(sourcePath);

    // 1. Enhance clarity (sharpen)
    if (enhance) {
      pipeline = pipeline.sharpen({ sigma: 1.5, m1: 1.5, m2: 0.5 });
    }

    // 2. Apply filters
    if (filters && filters.length > 0) {
      if (filters.includes('grayscale')) {
        pipeline = pipeline.grayscale();
      }
      if (filters.includes('blur')) {
        pipeline = pipeline.blur(3);
      }
      if (filters.includes('sepia')) {
        // Sepia via tint + grayscale modulate
        pipeline = pipeline.grayscale().tint({ r: 112, g: 66, b: 20 });
      }
    }

    // 3. Resize/Crop
    if (resize && (resize.width || resize.height)) {
      pipeline = pipeline.resize({
        width: resize.width ? parseInt(resize.width) : null,
        height: resize.height ? parseInt(resize.height) : null,
        fit: 'fill', // exact dimensions for crop effect
      });
    }

    // 4. Rotate
    if (rotate && rotate !== 0) {
      pipeline = pipeline.rotate(parseInt(rotate));
    }

    // 5. Remove background (simplified: replace with white background)
    if (removeBackground) {
      pipeline = pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
    }

    // 6. Format conversion & compression
    const outputFormat = (format || 'jpeg').toLowerCase();
    if (outputFormat === 'jpeg' || outputFormat === 'jpg') {
      pipeline = pipeline.jpeg({ quality: quality ? parseInt(quality) : 85, mozjpeg: true });
    } else if (outputFormat === 'png') {
      pipeline = pipeline.png({ quality: quality ? parseInt(quality) : 85, compressionLevel: 9 });
    }

    // Execute pipeline
    await pipeline.toFile(outputPath);

    // Get processed file size
    const processedStats = fs.statSync(outputPath);

    // Update MongoDB record
    image.processedPath = processedFilename;
    image.processedSize = processedStats.size;
    image.processedFormat = outputFormat;
    image.status = 'completed';
    image.operations = { resize, rotate, format: outputFormat, quality, filters, removeBackground };
    await image.save();

    res.json({
      success: true,
      message: 'Image processed successfully',
      image: {
        id: image._id,
        originalPath: `/uploads/${image.originalPath}`,
        processedPath: `/uploads/${processedFilename}`,
        originalSize: image.originalSize,
        processedSize: processedStats.size,
        compressionRatio: ((1 - processedStats.size / image.originalSize) * 100).toFixed(1),
        format: outputFormat,
      },
    });
  } catch (error) {
    // Mark image as failed
    try {
      await Image.findByIdAndUpdate(req.params.id, { status: 'failed' });
    } catch (_) {}
    next(error);
  }
};

// @desc    Get user's image history
// @route   GET /api/images/history
// @access  Private
const getHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      Image.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v'),
      Image.countDocuments({ user: req.user._id }),
    ]);

    // Map paths to full URLs
    const mapped = images.map(img => ({
      id: img._id,
      originalName: img.originalName,
      originalPath: img.originalPath ? `/uploads/${img.originalPath}` : null,
      processedPath: img.processedPath ? `/uploads/${img.processedPath}` : null,
      originalSize: img.originalSize,
      processedSize: img.processedSize,
      originalFormat: img.originalFormat,
      processedFormat: img.processedFormat,
      width: img.width,
      height: img.height,
      operations: img.operations,
      status: img.status,
      createdAt: img.createdAt,
    }));

    res.json({
      success: true,
      data: mapped,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete image
// @route   DELETE /api/images/:id
// @access  Private
const deleteImage = async (req, res, next) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, user: req.user._id });
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Delete files from disk
    const deleteFile = (filename) => {
      if (filename) {
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    };

    deleteFile(image.originalPath);
    deleteFile(image.processedPath);

    await image.deleteOne();

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/images/stats
// @access  Private
const getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [total, completed, failed, sizeData] = await Promise.all([
      Image.countDocuments({ user: userId }),
      Image.countDocuments({ user: userId, status: 'completed' }),
      Image.countDocuments({ user: userId, status: 'failed' }),
      Image.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalOriginalSize: { $sum: '$originalSize' },
            totalProcessedSize: { $sum: '$processedSize' },
          },
        },
      ]),
    ]);

    const sizes = sizeData[0] || { totalOriginalSize: 0, totalProcessedSize: 0 };
    const savedBytes = sizes.totalOriginalSize - sizes.totalProcessedSize;

    res.json({
      success: true,
      stats: {
        totalImages: total,
        completedImages: completed,
        failedImages: failed,
        totalOriginalSize: sizes.totalOriginalSize,
        totalProcessedSize: sizes.totalProcessedSize,
        totalSaved: savedBytes > 0 ? savedBytes : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage, processImage, getHistory, deleteImage, getStats };
