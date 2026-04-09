import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import db from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { cartItems } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ advice: "Your cart is empty. Add some products to get personalized advice!" });
    }

    // Fetch active products to provide catalog context to Gemini
    const { rows: products } = await db.query(`
      SELECT 
        p.id, p.name, p.description,
        b.name as "brandName"
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active'
      LIMIT 100
    `);

    const catalogContext = products.map(p => ({
      name: p.name,
      brand: p.brandName,
      description: p.description ? p.description.substring(0, 100) + '...' : ''
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const itemsContext = cartItems.map(item => `- ${item.name} (by ${item.brand || 'Naya Lumière'})`).join('\n');

    let prompt = '';

    if (cartItems.length === 1) {
        prompt = `
          You are a high-end luxury skincare and beauty consultant for "Naya Lumière Cosmetics".
          The customer has exactly ONE item in their cart:
          ${itemsContext}
          
          Based on this single item, suggest ONE perfect product to pair with it from our catalog to complete their routine. 
          It can be from the same brand or a complementary brand.
          
          Here is our available catalog (use this to make a specific product recommendation):
          ${JSON.stringify(catalogContext)}
          
          Instructions:
          - Keep your response strictly under 3 sentences.
          - Be elegant, professional, and persuasive.
          - Explicitly name the specific product you recommend from the provided catalog and explain WHY it pairs beautifully with the item in their cart.
          - Do not use markdown headers or lists, just return a single text paragraph.
        `;
    } else {
        prompt = `
          You are a high-end luxury skincare and beauty consultant for "Naya Lumière Cosmetics".
          The customer has the following items in their cart:
          ${itemsContext}
          
          Instructions:
          - Analyze how these specific products work together. Are there any active ingredient conflicts? Do they form a cohesive and effective routine?
          - Keep your response strictly under 4 sentences.
          - Be elegant, professional, and encouraging.
          - If they work beautifully together, validate their choice. If there's a potential issue (e.g., mixing strong retinol with strong acids without caution), gently advise them.
          - Do not use markdown headers or lists, just return a single text paragraph.
        `;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let advice = response.text().trim();

    return NextResponse.json({ advice });
  } catch (error) {
    console.error("AI Cart Advice Error:", error);
    return NextResponse.json({ error: "Failed to generate AI advice", details: error.message }, { status: 500 });
  }
}
