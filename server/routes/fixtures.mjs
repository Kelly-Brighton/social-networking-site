import express from "express"; // Import Express
import fetch from "node-fetch"; // Import fetch for HTTP requests

const router = express.Router(); // Create router object

// Create a GET route that the frontend will call to fetch Man United fixtures
router.get("/M01034045/fixtures", async (req, res) => {
    try {
        // The API endpoint for Manchester United scheduled matches (team ID 66)
        const API_URL = "https://api.football-data.org/v4/teams/66/matches?status=SCHEDULED";

        // Send a request to the Football-Data API with your secret API key in the header
        const response = await fetch(API_URL, {
            headers: {
                "X-Auth-Token": "f3126946a2134feca9a4966a65bd8ebd"
            }
        });

        // Convert the raw response into actual usable JSON data
        const data = await response.json();

        // Extract the "matches" array from the API response (or an empty array if missing)
        const matches = data.matches || [];

        // Format the first 5 upcoming fixtures in a structure matching your frontend
        const formatted = matches
            .slice(0, 5) // Only take the first 5 matches
            .map(m => ({
                home: m.homeTeam.name,          // The home team name
                away: m.awayTeam.name,          // The away team name
                round: `Matchday ${m.matchday}`, // Convert matchday number into readable text
                date: m.utcDate                 // Match date in ISO string format
            }));

        // Send the formatted fixture data back to the frontend as JSON
        res.json(formatted);

    } catch (error) { 
        // If anything crashes above, we catch the error here
        console.error("Fixtures loading error:", error); // Log the error for debugging

        // Send a failure message to the frontend so it knows something went wrong
        res.status(500).json({ message: "Could not load fixtures." });
    }
});


// Export router for use in server.mjs
export default router;
