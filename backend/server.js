const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const ConnectDB = require("./MongoDB");
const Users = require("./modles/User");
const Task = require("./modles/Tasks");
const cors = require("cors");
const PORT = 3001;

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("SECRET_KEY is not defined in environment variables");
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(cors());

ConnectDB();
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token found" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received:", { email });

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      success: true,
      message: "Successfully logged in",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (err) {
    console.error("Server error during login:", err);
    return res
      .status(500)
      .json({ message: "Internal server error during login" });
  }
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Users({
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    return res
      .status(201)
      .json({ message: "User successfully created", user: newUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to register", err });
  }
});

app.get("/getTasks", verifyToken, async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const userTasks = await Task.find({ user: userId });
    return res.json({ userTasks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching tasks" });
  }
});

app.post("/tasks", verifyToken, async (req, res) => {
  const { title, description, status, dueDate, priority, user } = req.body;

  try {
    // Verify that the token's user matches the requested user
    if (req.user.id !== user) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const newTask = new Task({
      title,
      description,
      status,
      dueDate,
      priority,
      user,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newTask.save();
    return res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error creating task" });
  }
});

app.put("/tasks/:taskId", verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Error updating task" });
  }
});

app.delete("/tasks/:taskId", verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    await Task.findByIdAndDelete(taskId);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
