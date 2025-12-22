// Import Express to create a router
import express from "express";
const router = express.Router();

// Import database connection helper
import { getDB } from "../db.mjs";

// REGISTER A NEW USER
router.post("/M01034045/users", async (req, res) => {
    try {
        // Get database instance
        const db = getDB();
        // Select "users" collection
        const userCollection = db.collection("users");

        // Extract submitted fields
        const { fullName, username, password } = req.body;

        // Validate missing fields
        if (!fullName || !username || !password) {
            return res.status(400).json({
                message: "Full name, username and password are required."
            });
        }

        // Check if username already exists in database
        const existingUser = await userCollection.findOne({ username });

        // If username already taken, return error
        if (existingUser) {
            return res.status(400).json({
                message: "Username already taken."
            });
        }

        // Insert new user into database
        await userCollection.insertOne({
            fullName,    // Store full name
            username,    // Store username
            password     // Store password (no hashing required for this coursework)
        });

        // Success message
        res.json({
            message: "User registered successfully!"
        });

    } catch (error) { // Corrected variable name
        // Log internal error for debugging
        console.log("Error registering user:", error);

        // Return server error response
        return res.status(500).json({
            message: "Internal server error."
        });
    }
});

// SEARCH FOR USERS BY NAME OR USERNAME
router.get("/M01034045/users", async (req, res) => {
    try {
        // Access database instance
        const db = getDB();
        // Select users collection
        const userCollection = db.collection("users");

        // Read search term from query parameters
        const query = req.query.q;

        // If no query provided, return empty array
        if (!query) {
            return res.json([]);
        }

        // Search for users whose fullName or username contains the query
        const results = await userCollection.find({
            $or: [
                { username: { $regex: query, $options: "i" } },  // Case-insensitive search
                { fullName: { $regex: query, $options: "i" } }   // Case-insensitive search
            ]
        })
        .project({ password: 0 }) // Exclude password field
        .toArray();               // Convert cursor to array

        // Send found users back to client
        res.json(results);

    } catch (error) { // Corrected variable name
        // Log the error
        console.log("Error searching users:", error);

        // Return error message
        return res.status(500).json({
            message: "Internal server error."
        });
    }
});

// Export router for use in server.mjs
export default router;
