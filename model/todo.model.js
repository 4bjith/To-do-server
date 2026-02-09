import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: Boolean,
        default: false,
    },
});

const TodoModel = mongoose.model("Todo", todoSchema);

export default TodoModel;
