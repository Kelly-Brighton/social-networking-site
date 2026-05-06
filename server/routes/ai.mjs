import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI client with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint to handle AI generated content requests
router.post("/M01034045/ai", async (req, res) => {
    try{
        const { type, text } = req.body;

        let prompt = "";

        // Improve the prompt based on the requested type of content
        if (type === "caption"){
            prompt = `
            Rewrite this Manchester United caption to sound more exciting and engaging for fans: 
            
            "${text}"
            
            Kepp it short, energetic, and football-themed. Don't use emojis`;
        }
        else if (type === "comment"){
            prompt = `
            Generate a short, hype football comment for this Manchester United post: 
            
            "${text}"
            
            Depending on the content, it could be a reaction to a match result, a player transfer, or a team announcement. Make it sound like a passionate fan's comment. Keep it concise and avoid emojis.`;
        }

        else if (type === "match"){
            prompt = `
            A Manchester United fan asked: 
            
            "${text}"
            
            Give a short, friendly football-style answer.`;
        }

        // Call OpenAI API to generate content based on the prompt
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });

        // Send the generated content back to the client
        res.json({ result: response.choices[0].message.content });
        
    }
    catch (error){
        console.error("Error generating AI content:", error);
        res.status(500).json({ error: "Failed to generate AI content" });
    }
});

export default router;
