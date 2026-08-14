import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tenant name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long'],
        maxlength: [100, 'Name cannot be more than 100 characters'],
        unique: true,
        index: true
    },
    slug: {
        type: String,
        required: [true, 'Tenant slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Tenant owner is required']
    },
    settings: {
        maxProblems: {
            type: Number,
            default: 1000,
            min: [1, 'Maximum problems must be at least 1']
        },
        maxUsers: {
            type: Number,
            default: 10000,
            min: [1, 'Maximum users must be at least 1']
        },
        enableAI: {
            type: Boolean,
            default: true
        },
        enableSubmissions: {
            type: Boolean,
            default: true
        },
        customBranding: {
            type: Boolean,
            default: false
        }
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

tenantSchema.index({ owner: 1, isActive: 1 });
tenantSchema.index({ createdAt: -1 });

tenantSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    next();
});

export default mongoose.model('Tenant', tenantSchema);
