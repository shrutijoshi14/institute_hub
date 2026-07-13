const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const StorageFile = require('../models/StorageFile');
const Institute = require('../models/Institute');
const Subscription = require('../models/Subscription');
const { sequelize } = require('../config/db');

// Configure Multer Disk Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'storage');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB max limit
});

// Helper to resolve file type category based on extensions
const getFileType = (ext) => {
    const images = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];
    const videos = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];
    const certificates = ['.cert', '.crt', '.pdf-cert'];
    const reports = ['.csv', '.xlsx', '.xls', '.tsv', '.ods'];
    
    const extLower = ext.toLowerCase();
    if (images.includes(extLower)) return 'Image';
    if (videos.includes(extLower)) return 'Video';
    if (extLower.includes('cert') || (extLower === '.pdf' && extLower.includes('certificate'))) return 'Certificate';
    if (reports.includes(extLower)) return 'Report';
    return 'Document'; // default fallback
};

// GET /api/storage/files - Retrieve all files for the current tenant
router.get('/files', async (req, res) => {
    try {
        const files = await StorageFile.findAll({
            order: [['created_at', 'DESC']]
        });
        res.json(files);
    } catch (err) {
        console.error('Fetch storage files error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// POST /api/storage/upload - Upload file with subscription limit validation
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const tenantId = req.tenantId || 1;
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded.' });
        }

        const ext = path.extname(req.file.originalname);
        const sizeKb = Math.round(req.file.size / 1024);
        
        // Find subscription limit
        const inst = await Institute.findByPk(tenantId, { bypassTenant: true });
        let maxStorageGb = 5; // default fallback limit
        
        if (inst && inst.subscription_id) {
            const sub = await Subscription.findByPk(inst.subscription_id, { bypassTenant: true });
            if (sub && sub.max_storage_gb !== -1 && sub.max_storage_gb !== undefined) {
                maxStorageGb = sub.max_storage_gb;
            }
        }

        // Compute current storage
        const totalKbResult = await StorageFile.sum('size_kb', { where: { tenant_id: tenantId } }) || 0;
        const totalGb = (totalKbResult + sizeKb) / (1024 * 1024);

        if (totalGb > maxStorageGb) {
            // Delete temp file from uploads
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {}
            return res.status(400).json({ msg: `Upload Denied: Your tenant storage limit of ${maxStorageGb} GB has been exceeded. Please upgrade your plan.` });
        }

        const explicitType = req.body.file_type;
        const finalType = ['Image', 'Document', 'Certificate', 'Video', 'Report'].includes(explicitType) 
            ? explicitType 
            : getFileType(ext);

        const relativePath = 'uploads/storage/' + path.basename(req.file.path);

        const storageFile = await StorageFile.create({
            name: req.file.originalname,
            file_type: finalType,
            size_kb: sizeKb,
            file_path: relativePath,
            uploaded_by: req.headers['x-user-name'] || 'Administrator'
        });

        res.status(201).json(storageFile);
    } catch (err) {
        console.error('Storage upload error:', err);
        // Clean up uploaded file if database fails
        if (req.file && req.file.path) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        res.status(500).json({ msg: 'Server Error' });
    }
});

// DELETE /api/storage/files/:id - Delete a file record and remove from disk
router.delete('/files/:id', async (req, res) => {
    try {
        const fileRecord = await StorageFile.findByPk(req.params.id);
        if (!fileRecord) {
            return res.status(404).json({ msg: 'File not found' });
        }

        // Delete physical file from disk
        const fullPath = path.join(__dirname, '..', fileRecord.file_path);
        try {
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (err) {
            console.warn('Physical file deletion warning:', err.message);
        }

        await fileRecord.destroy();
        res.json({ msg: 'File deleted successfully' });
    } catch (err) {
        console.error('Delete storage file error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GET /api/storage/stats - Aggregate stats per file type category
router.get('/stats', async (req, res) => {
    try {
        const tenantId = req.tenantId || 1;
        
        // Find subscription limit
        const inst = await Institute.findByPk(tenantId, { bypassTenant: true });
        let maxStorageGb = 5; // default fallback
        
        if (inst && inst.subscription_id) {
            const sub = await Subscription.findByPk(inst.subscription_id, { bypassTenant: true });
            if (sub && sub.max_storage_gb !== -1 && sub.max_storage_gb !== undefined) {
                maxStorageGb = sub.max_storage_gb;
            }
        }

        // Get count and sum size grouped by file_type
        const files = await StorageFile.findAll({
            attributes: [
                'file_type',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('size_kb')), 'total_size_kb']
            ],
            group: ['file_type']
        });

        // Initialize zeroed breakdowns
        const breakdown = {
            Image: { count: 0, size_kb: 0 },
            Document: { count: 0, size_kb: 0 },
            Certificate: { count: 0, size_kb: 0 },
            Video: { count: 0, size_kb: 0 },
            Report: { count: 0, size_kb: 0 }
        };

        let totalUsedKb = 0;

        files.forEach(item => {
            const type = item.getDataValue('file_type');
            if (breakdown[type]) {
                const count = parseInt(item.getDataValue('count'), 10) || 0;
                const size = parseInt(item.getDataValue('total_size_kb'), 10) || 0;
                breakdown[type] = { count, size_kb: size };
                totalUsedKb += size;
            }
        });

        const totalUsedGb = totalUsedKb / (1024 * 1024);

        res.json({
            max_storage_gb: maxStorageGb,
            total_used_kb: totalUsedKb,
            total_used_gb: parseFloat(totalUsedGb.toFixed(4)),
            used_percentage: parseFloat(Math.min((totalUsedGb / maxStorageGb) * 100, 100).toFixed(2)),
            breakdown
        });
    } catch (err) {
        console.error('Fetch storage stats error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
