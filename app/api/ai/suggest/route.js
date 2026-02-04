import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import db from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { userInput, selections } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }

    // Fetch products to provide context to Gemini
    const { rows: products } = await db.query(`
      SELECT 
        p.id, p.name, p.description, p.price,
        b.name as "brandName",
        STRING_AGG(DISTINCT c.name, ', ') as "categoryNames"
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN category_products cp ON p.id = cp.product_id
      LEFT JOIN categories c ON cp.category_id = c.id
      GROUP BY p.id, p.name, p.description, p.price, b.name
      LIMIT 50
    `);

    const productContext = products.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brandName,
      price: p.price,
      categories: p.categoryNames,
      description: p.description?.substring(0, 100) + '...'
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      You are the "Naya Lumière AI Curator", an expert in luxury beauty.
      Based on the following user input and selections, suggest the most suitable product from our collection.
      
      User Input: "${userInput}"
      User Selections: ${JSON.stringify(selections)}
      
      Collection Context:
      ${JSON.stringify(productContext)}
      
      Instructions:
      1. Analyze the user's needs (skin type, concerns, preferences).
      2. Choose the single best product from the provided collection.
      3. Provide a sophisticated and elegant explanation of why this product is perfect for them.
      4. Format your response as a JSON object with two fields: "productId" (the ID of the suggested product) and "explanation" (your elegant recommendation text).
      5. If no product matches perfectly, suggest the closest luxury alternative.
      
      Example Response Format:
      {
        "productId": 123,
        "explanation": "Given your preference for deep hydration and luminous finish, I highly recommend our Signature Hydra-Glow Elixir..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up JSON response if AI adds markdown backticks
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const suggestion = JSON.parse(text);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return NextResponse.json({ error: "Failed to generate AI suggestion" }, { status: 500 });
  }
}
