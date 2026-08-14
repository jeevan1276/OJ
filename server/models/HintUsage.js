import mongoose from 'mongoose';

const HintUsageSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true
  },
  hint1: {
    type: String,
    default: null
  },
  hint2: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

HintUsageSchema.index({ tenantId: 1, userId: 1, problemId: 1 }, { unique: true });
HintUsageSchema.index({ tenantId: 1, userId: 1 });
HintUsageSchema.index({ tenantId: 1, problemId: 1 });

const HintUsage = mongoose.model('HintUsage', HintUsageSchema);
export default HintUsage; 