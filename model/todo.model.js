import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: Boolean,
        default: false,
    },
});

const TodoModel = mongoose.model("Todo", todoSchema);

export default TodoModel;
