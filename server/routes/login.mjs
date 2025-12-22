// Import Express to create the router
import express from "express";
const router = express.Router();

// Import database helper function
import { getDB } from "../db.mjs";

// USER LOGIN
// Validates credentials and creates a login session
router.post("/M01034045/login", async (req, res) => {
    try {
        // Get database instance and users collection
        const db = getDB();
        const userCollection = db.collection("users");

        // Extract submitted username and password
        const { username, password } = req.body;

        // Validate missing fields
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required."
            });
        }

        // Retrieve user record from database
        const currentUser = await userCollection.findOne({ username });

        // Validate user existence and password match
        if (!currentUser || currentUser.password !== password) {
            return res.status(400).json({
                message: "Invalid username or password"
            });
        }

        // Create login session with essential user information
        req.session.currentUser = {
            fullName: currentUser.fullName,
            username: currentUser.username
        };

        // Respond to client with success message
        res.json({
            message: `Welcome back, ${currentUser.username}`,
            user: req.session.currentUser
        });

    } catch (error) {
        // Log any server error for debugging
        console.error("Login error:", error);

        // Return internal server error
        res.status(500).json({
            message: "Internal server error."
        });
    }
});

// CHECK CURRENT LOGIN STATUS
// Returns session information if a user is logged in
router.get("/M01034045/login", async (req, res) => {
    // If session contains a logged-in user, return user info
    if (req.session.currentUser) {
        return res.json({
            loggedIn: true,
            user: req.session.currentUser
        });
    }

    // If no user logged in, return false state
    res.json({
        loggedIn: false
    });
});

// USER LOGOUT
// Destroys session and logs user out
router.delete("/M01034045/login", async (req, res) => {
    // Destroy session and send confirmation response
    req.session.destroy(() => {
        res.json({
            message: "User logged out successfully"
        });
    });
});

// Export router so server.mjs can load it
export default router;
