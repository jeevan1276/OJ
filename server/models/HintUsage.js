import mongoose from 'mongoose';

const HintUsageSchema = new mongoose.Schema({
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

HintUsageSchema.index({ userId: 1, problemId: 1 }, { unique: true });

const HintUsage = mongoose.model('HintUsage', HintUsageSchema);
export default HintUsage; 