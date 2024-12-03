const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());

// Database connection
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Define the schedules and users collection
let scheduleCollection;

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    // Access the database and collections
    const database = client.db("gym");
    scheduleCollection = database.collection("schedule");

    console.log("Successfully connected to MongoDB!");

  } catch (error) {
    console.error("Error connecting to MongoDB", error);
  }
}

// Route to fetch all schedules
app.get("/schedules", async (req, res) => {
  try {
    const schedules = await scheduleCollection.find().toArray();
    if (schedules.length === 0) {
      return res.status(404).json({ success: false, message: "No schedules found" });
    }
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch schedules", error: error.message });
  }
});

// Route to add a new schedule
app.post("/schedule", async (req, res) => {
  try {
    const { title, day, date, time } = req.body;

    if (!title || !day || !date || !time) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const newSchedule = { title, day, date, time, completed: false };

    const result = await scheduleCollection.insertOne(newSchedule);
    res.status(201).json({ success: true, message: "Schedule added successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add schedule", error: error.message });
  }
});

// Route to update a schedule
app.put("/schedule/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, day, date, time } = req.body;

    if (!title || !day || !date || !time) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const updatedSchedule = {
      title,
      day,
      date,
      time
    };

    const result = await scheduleCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedSchedule }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    res.json({ success: true, message: "Schedule updated successfully", data: updatedSchedule });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update schedule", error: error.message });
  }
});

// Route to mark a schedule as complete
app.patch("/schedule/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;

    // Mark the schedule as completed
    const result = await scheduleCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { completed: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    res.json({ success: true, message: "Schedule marked as complete" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark schedule as complete", error: error.message });
  }
});

// Route to delete a schedule
app.delete("/schedule/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is valid and exists in the database
    const result = await scheduleCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    res.json({ success: true, message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});

// Route for testing the server
app.get("/", (req, res) => {
  res.send("Server is up and running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

run().catch(console.dir);
