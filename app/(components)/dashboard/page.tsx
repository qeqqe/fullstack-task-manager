"use client";

import { useEffect, useState } from "react";
import {
  FaTasks,
  FaCheckCircle,
  FaClock,
  FaChartBar,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: string;
}

interface NewTask {
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const DashboardPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    productivity: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<NewTask>({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    dueDate: "",
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        router.push("/");
        return;
      }

      const response = await fetch(
        `http://localhost:3001/getTasks?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.clear();
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      if (data.userTasks) {
        setTasks(data.userTasks);

        const completed = data.userTasks.filter(
          (task: Task) => task.status === "completed"
        ).length;
        const total = data.userTasks.length;

        setStats({
          totalTasks: total,
          completedTasks: completed,
          pendingTasks: total - completed,
          productivity: total > 0 ? Math.round((completed / total) * 100) : 0,
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      router.push("/");
    }
  };

  const handleAddTask = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        router.push("/");
        return;
      }

      const response = await fetch("http://localhost:3001/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newTask, user: userId }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          status: "pending",
          dueDate: "",
        });
        fetchTasks(); // Refresh task list
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchTasks();
        setEditingTask(null);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 p-6">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-8"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <h1 className="text-3xl font-bold text-white">Task Dashboard</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <FaPlus /> Add Task
          </motion.button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[#1E1E1E] p-6 rounded-md border border-[#333333] transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Total Tasks</p>
                <h2 className="text-2xl font-bold text-gray-100">
                  {stats.totalTasks}
                </h2>
              </div>
              <FaTasks className="text-indigo-500" size={30} />
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[#1E1E1E] p-6 rounded-md border border-[#333333] transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Completed</p>
                <h2 className="text-2xl font-bold text-gray-100">
                  {stats.completedTasks}
                </h2>
              </div>
              <FaCheckCircle className="text-green-500" size={30} />
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[#1E1E1E] p-6 rounded-md border border-[#333333] transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Pending</p>
                <h2 className="text-2xl font-bold text-gray-100">
                  {stats.pendingTasks}
                </h2>
              </div>
              <FaClock className="text-yellow-500" size={30} />
            </div>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-[#1E1E1E] p-6 rounded-md border border-[#333333] transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400">Productivity</p>
                <h2 className="text-2xl font-bold text-gray-100">
                  {stats.productivity}%
                </h2>
              </div>
              <FaChartBar className="text-purple-500" size={30} />
            </div>
          </motion.div>
        </motion.div>

        {/* Tasks List */}
        <motion.div
          className="bg-[#1E1E1E] rounded-md border border-[#333333] p-6"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-xl font-bold mb-4 text-white">Tasks</h2>
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between p-4 mb-3 rounded-md bg-[#252525] border border-[#333333] hover:border-gray-600 transition-all"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-200">{task.title}</h3>
                  <p className="text-sm text-gray-400">
                    Updated: {new Date(task.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      handleUpdateTask(task._id, {
                        status:
                          task.status === "completed" ? "pending" : "completed",
                      })
                    }
                    className={`p-2 rounded-full hover:bg-gray-700 ${
                      task.status === "completed"
                        ? "text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    <FaCheck />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingTask(task)}
                    className="p-2 text-gray-400 hover:text-blue-400"
                  >
                    <FaEdit />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-2 text-gray-400 hover:text-red-400"
                  >
                    <FaTrash />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#1E1E1E] rounded-md p-6 w-full max-w-md border border-[#333333]"
              >
                <h2 className="text-2xl font-bold mb-4">Add New Task</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Task Title"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white"
                  />
                  <textarea
                    placeholder="Description"
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white"
                  />
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="w-full p-2 border rounded bg-gray-700 border-gray-600 text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-400 hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddTask}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700"
              >
                <h2 className="text-2xl font-bold mb-4">Edit Task</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        title: e.target.value,
                      })
                    }
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                  />
                  <select
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        status: e.target.value,
                      })
                    }
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingTask(null)}
                      className="px-4 py-2 text-gray-400 hover:text-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateTask(editingTask._id, editingTask)
                      }
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
