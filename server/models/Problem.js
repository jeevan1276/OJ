import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
    input: {
        type: String,
        required: [true, 'Test case input is required']
    },
    output: {
        type: String,
        required: [true, 'Test case output is required']
    },
    explanation: {
        type: String
    }
});

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Problem title is required'],
        trim: true,
        unique: true,
        minlength: [3, 'Title must be at least 3 characters long'],
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Problem description is required'],
        minlength: [10, 'Description must be at least 10 characters long']
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: [true, 'Problem difficulty is required']
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, 'Rating cannot be negative']
    },
    categories: [{
        type: String,
        required: [true, 'At least one category is required'],
        enum: [
            'Array',
            'String',
            'Linked List',
            'Tree',
            'Graph',
            'Dynamic Programming',
            'Math',
            'Greedy',
            'Sorting',
            'Searching',
            'Hash Table',
            'Stack',
            'Queue',
            'Heap',
            'Binary Search',
            'Breadth-First Search',
            'Depth-First Search',
            'Backtracking',
            'Sliding Window',
            'Two Pointers',
            'Divide and Conquer',
            'Bit Manipulation',
            'Other'
        ]
    }],
    timeLimit: {
        type: Number,
        required: [true, 'Time limit is required'],
        min: [100, 'Time limit must be at least 100ms'],
        max: [10000, 'Time limit cannot exceed 10000ms']
    },
    memoryLimit: {
        type: Number,
        required: [true, 'Memory limit is required'],
        min: [16, 'Memory limit must be at least 16MB'],
        max: [1024, 'Memory limit cannot exceed 1024MB']
    },
    constraints: {
        type: [String],
        required: [true, 'Constraints are required']
    },
    publicTestCases: [testCaseSchema],
    hiddenTestCases: [testCaseSchema],
    totalSubmissions: {
        type: Number,
        default: 0
    },
    successfulSubmissions: {
        type: Number,
        default: 0
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Problem author is required']
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    starterCode: {
        type: Map,
        of: String,
        default: {}
    },
    functionSignature: {
        type: Map,
        of: String,
        default: {}
    },
    functionName: {
        type: String,
        default: 'solution'
    },
    customTestCaseInputTemplate: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

problemSchema.virtual('acceptanceRate').get(function() {
    if (this.totalSubmissions === 0) return 0;
    return (this.successfulSubmissions / this.totalSubmissions) * 100;
});

problemSchema.index({ title: 'text', description: 'text', categories: 'text' });

problemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

problemSchema.methods.getDifficultyColor = function() {
    switch (this.difficulty.toLowerCase()) {
        case 'easy':
            return '#00b8a3';
        case 'medium':
            return '#ffc01e';
        case 'hard':
            return '#ff375f';
        default:
            return '#00b8a3';
    }
};

problemSchema.methods.getRatingColor = function() {
    if (this.rating >= 2400) return '#ff0000';
    if (this.rating >= 2100) return '#ff8c00';
    if (this.rating >= 1900) return '#a0a';
    if (this.rating >= 1600) return '#03a89e';
    if (this.rating >= 1400) return '#00f';
    if (this.rating >= 1200) return '#008000';
    return '#808080';
};

problemSchema.statics.findByDifficulty = function(difficulty) {
    return this.find({ difficulty: difficulty });
};

problemSchema.statics.findByCategories = function(categories) {
    return this.find({ categories: { $in: categories } });
};

problemSchema.statics.findByRatingRange = function(min, max) {
    return this.find({ rating: { $gte: min, $lte: max } });
};

export default mongoose.model('Problem', problemSchema);