// Import Express to create the router
import express from "express";
const router = express.Router();

// Import database connection helper
import { getDB } from "../db.mjs";


// FOLLOW ANOTHER USER
// Creates a follow relationship in the "follows" collection*/
router.post("/M01034045/follow", async (req, res) => {
    try {
        // Access database instance
        const db = getDB();

        // Ensure user is logged in
        if (!req.session.currentUser) {
            return res.status(401).json({
                message: "You must be logged in to follow another user."
            });
        }

        // Collections needed for follow logic
        const userCollection = db.collection("users");
        const followCollection = db.collection("follows");

        // Extract target username from request body
        const { username } = req.body;

        // Validate missing username
        if (!username) {
            return res.status(400).json({
                message: "Username is required."
            });
        }

        // Logged-in user's username
        const currentUser = req.session.currentUser.username;

        // Prevent following yourself
        if (currentUser === username) {
            return res.status(400).json({
                message: "You cannot follow yourself."
            });
        }

        // Ensure the target user exists
        const targetUser = await userCollection.findOne({ username });

        if (!targetUser) {
            return res.status(404).json({
                message: "User does not exist."
            });
        }

        // Check if follow relationship already exists
        const existingFollow = await followCollection.findOne({
            follower: currentUser,
            following: username
        });

        if (existingFollow) {
            return res.status(400).json({
                message: "You are already following this user."
            });
        }

        // Create new follow document
        await followCollection.insertOne({
            follower: currentUser,
            following: username,
            followedAt: new Date()
        });

        // Success response
        res.json({
            message: `You are now following ${username}.`
        });

    } catch (error) {
        // Log internal error
        console.log("Error following user:", error);

        // Send server error response
        res.status(500).json({
            message: "Internal server error."
        });
    }
});

//   UNFOLLOW A USER
//   Removes a follow relationship from the database
router.delete("/M01034045/follow", async (req, res) => {
    try {
        // Access database instance
        const db = getDB();

        // Ensure user is logged in
        if (!req.session.currentUser) {
            return res.status(401).json({
                message: "You must be logged in to unfollow a user."
            });
        }

        // Collections needed
        const userCollection = db.collection("users");
        const followCollection = db.collection("follows");

        // Extract target username
        const { username } = req.body;

        // Validate missing username
        if (!username) {
            return res.status(400).json({
                message: "Username is required."
            });
        }

        // Logged-in user's username
        const currentUser = req.session.currentUser.username;

        // Prevent unfollowing yourself
        if (currentUser === username) {
            return res.status(400).json({
                message: "You cannot unfollow yourself."
            });
        }

        // Ensure target user exists
        const targetUser = await userCollection.findOne({ username });

        if (!targetUser) {
            return res.status(404).json({
                message: "User does not exist."
            });
        }

        // Check existing follow relationship
        const existingFollow = await followCollection.findOne({
            follower: currentUser,
            following: username
        });

        if (!existingFollow) {
            return res.status(400).json({
                message: "You are not following this user."
            });
        }

        // Delete follow relationship
        await followCollection.deleteOne({
            follower: currentUser,
            following: username
        });

        // Success response
        res.json({
            message: `You have unfollowed ${username}.`
        });

    } catch (error) {
        // Log internal error
        console.log("Error unfollowing user:", error);

        // Send server error
        res.status(500).json({
            message: "Internal server error."
        });
    }
});

// RETURN LIST OF USERS THE CURRENT USER FOLLOWS
router.get("/M01034045/follows/me", async (req, res) => {
    try {
        const db = getDB();
        const followCollection = db.collection("follows");

        // If user not logged in → return empty list (safe)
        if (!req.session.currentUser) {
            return res.json([]);
        }

        // Logged-in user's username
        const username = req.session.currentUser.username;

        // Find all follow relationships where the logged-in user is the follower
        const follows = await followCollection
            .find({ follower: username })
            .toArray();

        // Extract only the usernames the user is following
        const followingUsernames = follows.map(f => f.following);

        // Send back list of usernames
        res.json(followingUsernames);

    } catch (err) {
        console.log("Error retrieving follows:", err);

        // If something goes wrong, return empty array
        res.status(500).json([]);
    }
});


// Export router for use in server.mjs
export default router;
