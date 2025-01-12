import React, { useState, useEffect } from "react";
import db from "./db";
import axios from "axios";

const API_URL = "https://jsonplaceholder.typicode.com/todos";

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Fetch tasks from IndexedDB on load
  useEffect(() => {
    const fetchLocalTasks = async () => {
      const localTasks = await db.tasks.toArray();
      setTasks(localTasks);
    };
    fetchLocalTasks();
  }, []);


  // Add a new task (local-first)
  const addTask = async (title) => {
    const newTask = {
      title,
      completed: false,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    // Save to IndexedDB
    const id = await db.tasks.add(newTask);
    // Update UI
    setTasks((prevTasks) => [...prevTasks, { ...newTask, id }]);
  };

  // Toggle task completion
  const toggleTask = async (id) => {
    const task = tasks.find((task) => task.id === id);
    const updatedTask = {
      ...task,
      completed: !task.completed,
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    // Update in IndexedDB
    await db.tasks.update(id, updatedTask);

    // Update UI
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === id ? updatedTask : task))
    );
  };

  // Sync tasks with the server
  const syncTasks = async () => {
    setSyncing(true);
    try {
      const syncPromises = tasks
        .filter((task) => task.synced === false)
        .map(async (task) => {
          await axios.post(API_URL, task);
          await db.tasks.update(task.id, { synced: true });
        });

      await Promise.all(syncPromises);
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="app">
      <h1>Local-First To-Do App</h1>

      {/* Add Task */}
      <div>
        <input
          type="text"
          placeholder="Add a task..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              addTask(e.target.value.trim());
              e.target.value = "";
            }
          }}
        />
      </div>

      {/* Task List */}
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />
            {task.title}
            {task.synced ? " ✅" : " 🔄"}
          </li>
        ))}
      </ul>

      {/* Sync Button */}
      <button onClick={syncTasks} disabled={syncing}>
        {syncing ? "Syncing..." : "Sync Tasks"}
      </button>
    </div>
  );
};

export default App;
