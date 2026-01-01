import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a project name'],
    },
    originalFile: {
        type: String,
        required: true,
    },
    stems: [{
        name: String,
        url: String,
    }],
}, {
    timestamps: true,
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
