// Import Express to create router
import express from "express";
// Import database connection helper
import { getDB } from "../db.mjs";
// Import ObjectId for MongoDB document referencing
import { ObjectId } from "mongodb";
// Import UUID generator for unique image filenames
import { v4 as uuidv4 } from "uuid";

// Create a new router instance
const router = express.Router();

// SEARCH POSTS BY CAPTION
router.get("/M01034045/contents", async (req, res) => {
    try {
        // Get database instance
        const db = getDB();

        // Select collection where posts are stored
        const postsCollection = db.collection("contents");

        // Extract search term from query string
        const searchTerm = req.query.q;

        // If search term is missing, return an empty array
        if (!searchTerm) {
            return res.json([]);
        }

        // Perform case-insensitive caption search
        const resultingPost = await postsCollection.find({
            caption: { $regex: searchTerm, $options: "i" }
        })
            .sort({ createdAt: -1 }) // Sort newest first
            .toArray(); // Convert cursor to array

        // Send search results to the client
        res.json(resultingPost);
    }
    catch (error) {
        // Log error for debugging
        console.log("Error searching contents: ", error);

        // Return server error response
        res.status(500).json({ message: "Internal server error." });
    }
});

// CREATE NEW POST (IMAGE + CAPTION)
router.post("/M01034045/contents", async (req, res) => {
    try {
        // Get database instance
        const db = getDB();

        // Verify user login session
        if (!req.session.currentUser) {
            return res.status(400).json({ message: "You must be logged in to post content." });
        }

        // Create an array to hold incoming image chunks
        const chunks = [];

        // Listen for image data stream
        req.on("data", (chunk) => chunks.push(chunk));

        // When upload completes
        req.on("end", async () => {
            // Combine chunks into complete file buffer
            const buffer = Buffer.concat(chunks);

            // Read content type (image file type)
            const contentType = req.headers["content-type"];

            // Validate that uploaded file is an image
            if (!contentType.startsWith("image/")) {
                return res.status(400).json({ message: "Only image uploads allowed." });
            }

            // Extract file extension from MIME type
            const extension = contentType.split("/")[1];

            // Generate a unique filename
            const fileName = `${uuidv4()}.${extension}`;

            // Import filesystem module
            const fs = await import("fs");
            // Import path module
            const path = await import("path");

            // Write image file to /public/uploads folder
            fs.writeFileSync(
                path.resolve("public/uploads", fileName),
                buffer
            );

            // Extract caption from request header
            const caption = req.headers["caption"] || "";

            // Build new post object
            const newPost = {
                user: req.session.currentUser.username,   // username of creator
                fullName: req.session.currentUser.fullName, // full name of creator
                caption: caption,                         // caption text
                image: fileName,                          // stored image filename
                createdAt: new Date(),                    // timestamp
                likes: [],                                // empty likes array
                comments: []                              // empty comments array
            };

            // Insert new post into database
            await db.collection("contents").insertOne(newPost);

            // Respond to client with success message and post data
            res.json({
                message: "Post created successfully.",
                post: newPost
            });
        });

    } catch (error) {
        // Log error for debugging
        console.log("Error creating post:", error);

        // Return generic server error
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET USER FEED (SHOW POSTS FROM FOLLOWED USERS)
router.get("/M01034045/feed", async (req, res) => {
    try {
        // Get database connection
        const db = getDB();

        // Check if user is logged in
        if (!req.session.currentUser) {
            return res.status(401).json({ message: "You must be logged in to view your feed." });
        }

        // Access posts collection
        const postCollection = db.collection("contents");
        // Access follows collection
        const followCollection = db.collection("follows");

        // Extract current user's username
        const currentUser = req.session.currentUser.username;

        // Read pagination values from query (defaults if missing)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit; // How many posts to skip

        // Get list of users that current user follows
        const followingList = await followCollection.find({
            follower: currentUser
        }).toArray();

        // If user follows no one, show empty feed message
        if (followingList.length === 0) {
            return res.json({
                message: "Your feed is empty. Follow someone to see posts.",
                posts: [],
                page: 1,
                totalPages: 0
            });
        }

        // Extract usernames of followed accounts
        const followedUsernames = followingList.map(f => f.following);

        // Count total number of posts (used to calculate totalPages)
        const totalPosts = await postCollection.countDocuments({
            user: { $in: followedUsernames }
        });

        // Get posts from followed users only
        const feedPosts = await postCollection
            .find({ user: { $in: followedUsernames } })
            .sort({ createdAt: -1 }) // Sort by displaying the newest first
            .skip(skip)              // Skip posts for pagination
            .limit(limit)            // Limit number of posts returned
            .toArray();

        // Return posts
        return res.json({
            message: "Feed loaded successfully.",
            posts: feedPosts,
            page: page,
            totalPages: Math.ceil(totalPosts / limit)
        });
    }
    catch (error) {
        // Log error
        console.log("Error showing the posts", error);

        // Return server error
        res.status(500).json({ message: "Internal server error" });
    }
});

// LIKE A POST
router.post("/M01034045/like", async (req, res) => {
    try {
        // Get database reference
        const db = getDB();

        // Ensure user is logged in
        if (!req.session.currentUser) {
            return res.status(401).json({ message: "You must be logged in." });
        }

        // Extract post ID from request body
        const { postId } = req.body;
        // Extract username performing the like
        const username = req.session.currentUser.username;

        // Access contents collection
        const postCollection = db.collection("contents");

        // Add username to likes array only if not already present
        await postCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $addToSet: { likes: username } }
        );

        // Return success message
        res.json({ message: "Post liked!" });

    } catch (error) {
        // Log error
        console.log("Error liking post:", error);

        // Return error
        res.status(500).json({ message: "Internal server error." });
    }
});

// UNLIKE A POST
router.delete("/M01034045/like", async (req, res) => {
    try {
        // Get database instance
        const db = getDB();

        // Ensure user is logged in
        if (!req.session.currentUser) {
            return res.status(401).json({ message: "You must be logged in." });
        }

        // Extract post ID from request body
        const { postId } = req.body;
        // Extract username performing unlike
        const username = req.session.currentUser.username;

        // Access post collection
        const postCollection = db.collection("contents");

        // Remove username from likes array
        await postCollection.updateOne(
            { _id: new ObjectId(postId) },
            { $pull: { likes: username } }
        );

        // Return success response
        res.json({ message: "Post unliked!" });

    } catch (error) {
        // Log error
        console.log("Error unliking post:", error);

        // Return error
        res.status(500).json({ message: "Internal server error." });
    }
});

// ADD COMMENT TO A POST
router.post("/M01034045/comment", async (req, res) => {
    try {
        // Get database instance
        const db = getDB();

        // Verify login session
        if (!req.session.currentUser) {
            return res.status(401).json({ message: "You must be logged in." });
        }

        // Extract comment data
        const { postId, text } = req.body;

        // Validate comment text
        if (!text || text.trim() === "") {
            return res.status(400).json({ message: "Comment cannot be empty." });
        }

        // Create comment object
        const comment = {
            user: req.session.currentUser.username,     // commenter username
            fullName: req.session.currentUser.fullName, // commenter full name
            text,                                       // comment text
            createdAt: new Date()                       // timestamp
        };

        // Access posts collection
        const posts = db.collection("contents");

        // Push comment into comments array
        await posts.updateOne(
            { _id: new ObjectId(postId) },
            { $push: { comments: comment } }
        );

        // Return success response
        res.json({ message: "Comment added!", comment });

    } catch (error) {
        // Log error
        console.log("Error adding comment:", error);

        // Return server error
        res.status(500).json({ message: "Internal server error." });
    }
});

// GET FULL SINGLE POST WITH ALL COMMENTS
router.get("/M01034045/contents/full", async (req, res) => {
    try {
        // Get database instance
        const db = getDB();

        // Extract post ID from query string
        const postId = req.query.postId;

        // Validate post ID
        if (!postId) {
            return res.status(400).json({ message: "postId is required." });
        }

        // Find full post document
        const post = await db.collection("contents").findOne({
            _id: new ObjectId(postId)
        });

        // If no post found
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        // Return full post data
        res.json(post);

    } catch (error) {
        // Log error
        console.log("Error fetching full post:", error);

        // Return server error
        res.status(500).json({ message: "Internal server error." });
    }
});

// GET all posts created by a specific user (Profile page)
router.get("/M01034045/contents/user/:username", async (req, res) => {
    try {
        const db = getDB();
        // Get databse instance
        const contents = db.collection("contents"); // Get db collection

        // Extract username from URL parameters
        const username = req.params.username;

        // Fetch posts of that user
        const posts = await contents
            .find({ user: username })
            .sort({ createdAt: -1 })
            .toArray();

        res.json(posts);
    } catch (error) {
        console.error("Error loading user posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// DELETE a post by ID
router.delete("/M01034045/contents", async (req, res) => {
    try {
        // Ensure user is logged in
        if (!req.session.currentUser) {
            return res.status(401).json({ message: "Not logged in." });
        }

        // Extract postId from body
        const { postId } = req.body;

        // Get DB collections
        const db = getDB();
        const contents = db.collection("contents");

        // Find post in the database
        const post = await contents.findOne({ _id: new ObjectId(postId) });

        // If post not found
        if (!post) {
            return res.status(404).json({ message: "Post not found." });
        }

        // Make sure only the owner can delete their post
        if (post.user !== req.session.currentUser.username) {
            return res.status(403).json({ message: "You can only delete your own posts." });
        }

        // Delete post
        await contents.deleteOne({ _id: new ObjectId(postId) });

        return res.json({ message: "Post deleted successfully." });

    } catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// GET USER RECOMMENDATIONS (users the current user is not following)
router.get("/M01034045/recommendations", async (req, res) => {
    try {
        const db = getDB();

        // User must be logged in
        if (!req.session.currentUser) {
            return res.status(401).json({ message: "Not logged in." });
        }

        // Get current user's username
        const currentUser = req.session.currentUser.username;

        // Access users and follows collections
        const usersCollection = db.collection("users");
        const followsCollection = db.collection("follows");

        // Get list of usernames the current user already follows
        const followingList = await followsCollection.find({
            follower: currentUser
        }).toArray();

        // Extract usernames from following list
        const followingUsernames = followingList.map(f => f.following);

        // Fetch ALL users
        const allUsers = await usersCollection.find({}).toArray();

        // Filter: remove current user + already followed users
        const recommendations = allUsers.filter(u =>
            u.username !== currentUser &&
            !followingUsernames.includes(u.username)
        );

        // Randomise + limit to 5 recommendations
        const shuffled = recommendations.sort(() => 0.5 - Math.random());
        const finalList = shuffled.slice(0, 5);

        res.json(finalList);

    } catch (error) {
        console.log("Recommendation error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



// Export router for use in main server
export default router;
