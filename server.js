import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import TodoModel from './model/todo.model.js';
import User from './model/user.model.js';


dotenv.config();
const app = express();
const PORT = process.env.PORT || 8100;

// Simple in-memory session storage (for demo purposes)
const sessions = new Map();

// Middleware to verify user session
const authenticateSession = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    
    if (!userId || !sessions.has(userId)) {
        return res.status(401).json({ message: 'Unauthorized. Please login first.' });
    }
    
    req.user = { _id: userId };
    next();
};

app.use(
    cors({
        // origin: process.env.CLIENT_ORIGIN || 'http://localhost:8001',
        origin: true,
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
        const userId = req.headers['x-user-id'];
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Todo item is required.' });
        }
        const newTodo = new TodoModel({ content: content.trim(), userId });
        const savedTodo = await newTodo.save();
        res.status(201).json(savedTodo);
    } catch (error) {
        console.error('Error creating todo item:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }   
}
);

app.get('/api/todos', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const filter = userId ? { userId } : {};
        const todos = await TodoModel.find(filter).sort({ createdAt: -1 });
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
        const userId = req.headers['x-user-id'];
        const deletedTodo = await TodoModel.findByIdAndDelete({ _id: id, userId });
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
        const userId = req.headers['x-user-id'];
        const { status } = req.body;
        if (typeof status !== 'boolean') {
            return res.status(400).json({ message: 'Invalid status value.' });
        }
        const updatedTodo = await TodoModel.findByIdAndUpdate({ _id: id, userId }, { status }, { new: true });
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

//--------------user routes------------------

app.get('/api/user', authenticateSession, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.post('/api/user/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }
        const newUser = new User({ username, email, password });
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.post('/api/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        // Create session
        sessions.set(user._id.toString(), { userId: user._id, email: user.email });
        res.status(200).json({ user, sessionId: user._id.toString() });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.post('/api/user/logout', (req, res) => {
    // Implement logout logic (e.g., clear session or token)
    res.status(200).json({ message: 'User logged out successfully.', token: null });
});

app.put('/api/user/update', authenticateSession, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (username) user.username = username;
        if (email) user.email = email;
        if (password) user.password = password;
        const updatedUser = await user.save();
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
