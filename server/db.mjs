import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// Create a MongoDB client using the connection URI from .env
const client = new MongoClient(process.env.MONGO_URI);

// This will hold our database connection
let db; 

// Function to connect to MongoDB
export async function connectDB() {
    try {
        await client.connect(); // Connect to MongoDB
        db = client.db("redconnectDB"); // Choose (or create) a database
        console.log("Connected to MongoDB");
    } 
    catch (err) {
        console.error("MongoDB connection failed:", err);
        //uuidv4();
    }
}

// Function to return the database connection
export function getDB() {
    return db;
}

