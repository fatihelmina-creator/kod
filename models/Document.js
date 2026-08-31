import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const documentSchema = new mongoose.Schema({
  docId: {
    type: String,
    default: () => 'DOC_' + uuidv4(),
    unique: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Başlık zorunludur'],
    maxlength: 255
  },
  description: String,
  fileName: String,
  fileType: String,
  fileSize: Number,
  encryptedData: {
    type: String,
    required: true
  },
  encryptionIV: {
    type: String,
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['private', 'link-only', 'public'],
    default: 'link-only'
  },
  accessPassword: String,
  allowedEmails: [String],
  maxDownloads: {
    type: Number,
    default: 10,
    min: 1,
    max: 100
  },
  currentDownloads: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  downloadHistory: [
    {
      downloadedAt: Date,
      downloadedBy: String,
      ipAddress: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
documentSchema.index({ ownerId: 1, createdAt: -1 });
documentSchema.index({ docId: 1 });
documentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Auto-update timestamp
documentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Document', documentSchema);
