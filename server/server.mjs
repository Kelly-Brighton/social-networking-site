// Import Express framework
import express from "express";
// Import session middleware for login tracking
import session from "express-session";
// Import path tools for file handling
import path from "path";
// Import database connection function
import { connectDB } from "./db.mjs";
// Convert module URL to file path
import { fileURLToPath } from "url";
// Load environment variables from .env
import dotenv from "dotenv";

// Load .env configuration
dotenv.config();

// Resolve file and directory paths
const __filename = fileURLToPath(import.meta.url); // Current file path
const __dirname = path.dirname(__filename); // Current directory path

// Create an Express application
const app = express();

// Enable JSON parsing for requests
app.use(express.json());

// Enable parsing of form data (URL encoded)
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(
  session({
    secret: "redconnect_secret", // Secret key for session encryption
    resave: false, // Do not resave sessions unnecessarily
    saveUninitialized: false, // Do not save empty sessions
  })
);

// Import all route files
import userRoutes from "./routes/users.mjs";
import loginRoutes from "./routes/login.mjs";
import contentsRoutes from "./routes/contents.mjs";
import followRoutes from "./routes/follow.mjs";
import fixturesRoutes from "./routes/fixtures.mjs";
import aiRoutes from "./routes/ai.mjs";

// Serve static files from "public" directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve uploaded images from /public/uploads
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Serve index.html when root URL is accessed
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Attach all route files to server
app.use(userRoutes);
app.use(loginRoutes);
app.use(contentsRoutes);
app.use(followRoutes);
app.use(fixturesRoutes);
app.use(aiRoutes);

// Additional endpoint used by main.js to check login session
app.get("/M01034045/login/check", (req, res) => {
  // If no user is logged in, return empty object
  if (!req.session.currentUser) {
    return res.json({ username: null });
  }

  // Return logged-in user's username
  res.json({ username: req.session.currentUser.username });
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

// Connect to database and start server
connectDB().then(() => {
  // Start server at configured port
  app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
  });
});
