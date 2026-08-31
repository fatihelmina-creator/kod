import express from 'express';
import Document from '../models/Document.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { encryptData, decryptData } from '../utils/encryption.js';

const router = express.Router();

// Upload document
router.post('/upload', authenticate, async (req, res) => {
  try {
    const { title, description, fileData, fileName, fileType, accessLevel, accessPassword, allowedEmails, maxDownloads, expirationDays } = req.body;

    if (!title || !fileData || !fileName) {
      return res.status(400).json({ error: 'Başlık, dosya ve dosya adı zorunludur' });
    }

    // Validate file size (50MB limit)
    if (fileData.length > 52428800) {
      return res.status(400).json({ error: 'Dosya boyutu 50MB\'ı aşamaz' });
    }

    // Encrypt file data
    const { encrypted, iv } = encryptData(fileData);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expirationDays || 30));

    const document = new Document({
      ownerId: req.userId,
      title,
      description,
      fileName,
      fileType,
      fileSize: fileData.length,
      encryptedData: encrypted,
      encryptionIV: iv,
      accessLevel: accessLevel || 'link-only',
      accessPassword,
      allowedEmails: allowedEmails || [],
      maxDownloads: maxDownloads || 10,
      expiresAt
    });

    await document.save();

    // Generate QR code URL
    const qrUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}?docId=${document.docId}`;

    res.status(201).json({
      message: 'Dosya başarıyla yüklendi',
      document: {
        docId: document.docId,
        title: document.title,
        fileName: document.fileName,
        createdAt: document.createdAt,
        expiresAt: document.expiresAt,
        maxDownloads: document.maxDownloads,
        qrUrl
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's documents
router.get('/my-documents', authenticate, async (req, res) => {
  try {
    const documents = await Document.find({ ownerId: req.userId })
      .select('-encryptedData -encryptionIV')
      .sort({ createdAt: -1 });

    res.json({
      count: documents.length,
      documents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document details (public or with access check)
router.get('/:docId', optionalAuth, async (req, res) => {
  try {
    const { docId } = req.params;
    const { password } = req.query;

    const document = await Document.findOne({ docId });

    if (!document) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    // Check if expired
    if (new Date() > document.expiresAt) {
      return res.status(410).json({ error: 'Dosya süresi dolmuştur' });
    }

    // Check download limit
    if (document.currentDownloads >= document.maxDownloads) {
      return res.status(403).json({ error: 'İndirme limitine ulaşıldı' });
    }

    // Access control
    if (document.accessLevel === 'private') {
      if (!req.userId || req.userId.toString() !== document.ownerId.toString()) {
        return res.status(403).json({ error: 'Bu dosyaya erişim izniniz yok' });
      }
    } else if (document.accessLevel === 'link-only') {
      if (document.accessPassword && document.accessPassword !== password) {
        return res.status(403).json({ error: 'Şifre yanlış' });
      }
    } else if (document.accessLevel === 'public') {
      if (document.allowedEmails.length > 0 && req.userEmail && !document.allowedEmails.includes(req.userEmail)) {
        return res.status(403).json({ error: 'Bu dosyaya erişim izniniz yok' });
      }
    }

    res.json({
      docId: document.docId,
      title: document.title,
      description: document.description,
      fileName: document.fileName,
      fileType: document.fileType,
      accessLevel: document.accessLevel,
      expiresAt: document.expiresAt,
      currentDownloads: document.currentDownloads,
      maxDownloads: document.maxDownloads,
      createdAt: document.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download document
router.get('/:docId/download', optionalAuth, async (req, res) => {
  try {
    const { docId } = req.params;
    const { password } = req.query;

    const document = await Document.findOne({ docId });

    if (!document) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    // Check if expired
    if (new Date() > document.expiresAt) {
      return res.status(410).json({ error: 'Dosya süresi dolmuştur' });
    }

    // Check download limit
    if (document.currentDownloads >= document.maxDownloads) {
      return res.status(403).json({ error: 'İndirme limitine ulaşıldı' });
    }

    // Access control (same as get)
    if (document.accessLevel === 'private') {
      if (!req.userId || req.userId.toString() !== document.ownerId.toString()) {
        return res.status(403).json({ error: 'Bu dosyaya erişim izniniz yok' });
      }
    } else if (document.accessLevel === 'link-only') {
      if (document.accessPassword && document.accessPassword !== password) {
        return res.status(403).json({ error: 'Şifre yanlış' });
      }
    }

    // Decrypt data
    const decryptedData = decryptData(document.encryptedData, document.encryptionIV);

    // Update download history
    document.currentDownloads += 1;
    document.downloadHistory.push({
      downloadedAt: new Date(),
      downloadedBy: req.userEmail || 'anonymous',
      ipAddress: req.ip
    });
    await document.save();

    // Send file
    res.set({
      'Content-Type': document.fileType,
      'Content-Disposition': `attachment; filename="${document.fileName}"`
    });
    res.send(Buffer.from(decryptedData, 'utf8'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document (owner only)
router.delete('/:docId', authenticate, async (req, res) => {
  try {
    const { docId } = req.params;

    const document = await Document.findOne({ docId });

    if (!document) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    if (document.ownerId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Sadece dosya sahibi silebilir' });
    }

    await Document.deleteOne({ docId });

    res.json({ message: 'Dosya başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update document settings (owner only)
router.patch('/:docId', authenticate, async (req, res) => {
  try {
    const { docId } = req.params;
    const { title, description, accessLevel, accessPassword, allowedEmails, maxDownloads, expirationDays } = req.body;

    const document = await Document.findOne({ docId });

    if (!document) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    if (document.ownerId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Sadece dosya sahibi güncelleyebilir' });
    }

    if (title) document.title = title;
    if (description) document.description = description;
    if (accessLevel) document.accessLevel = accessLevel;
    if (accessPassword !== undefined) document.accessPassword = accessPassword;
    if (allowedEmails) document.allowedEmails = allowedEmails;
    if (maxDownloads) document.maxDownloads = maxDownloads;
    
    if (expirationDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      document.expiresAt = expiresAt;
    }

    await document.save();

    res.json({
      message: 'Dosya ayarları güncellendi',
      document: {
        docId: document.docId,
        title: document.title,
        accessLevel: document.accessLevel,
        expiresAt: document.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get download history (owner only)
router.get('/:docId/history', authenticate, async (req, res) => {
  try {
    const { docId } = req.params;

    const document = await Document.findOne({ docId });

    if (!document) {
      return res.status(404).json({ error: 'Dosya bulunamadı' });
    }

    if (document.ownerId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Erişim reddedildi' });
    }

    res.json({
      docId: document.docId,
      title: document.title,
      totalDownloads: document.currentDownloads,
      maxDownloads: document.maxDownloads,
      downloadHistory: document.downloadHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
