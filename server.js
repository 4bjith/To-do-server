import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import TodoModel from './model/todo.model.js';


dotenv.config();
const app = express();
const PORT = process.env.PORT || 8100;

app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN || '*',
    })
);
app.use(express.json());
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));


app.get('/api/health', (_, res) => {
    res.status(200).json({ ok: true });
});

app.post('/api/todos', async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Todo item is required.' });
        }
        const newTodo = new TodoModel({ content: content.trim() });
        const savedTodo = await newTodo.save();
        res.status(201).json(savedTodo);
    } catch (error) {
        console.error('Error creating todo item:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }   
}
);

app.get('/api/todos', async (_, res) => {
    try {
        const todos = await TodoModel.find();
        res.status(200).json(todos);
    } catch (error) {
        console.error('Error fetching todo items:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}
);

app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTodo = await TodoModel.findByIdAndDelete(id);
        if (!deletedTodo) {
            return res.status(404).json({ message: 'Todo item not found.' });
        }   
        res.status(200).json({ message: 'Todo item deleted successfully.' });
    } catch (error) {   
        console.error('Error deleting todo item:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }   
}
);

app.patch('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (typeof status !== 'boolean') {
            return res.status(400).json({ message: 'Invalid status value.' });
        }
        const updatedTodo = await TodoModel.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedTodo) {
            return res.status(404).json({ message: 'Todo item not found.' });
        }
        res.status(200).json(updatedTodo);
    } catch (error) {
        console.error('Error updating todo item:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}
);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
