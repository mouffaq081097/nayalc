import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { productName, brandName, description, price, category } = await req.json();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_actual_gemini_api_key_here") {
      return NextResponse.json({ error: "AI Service not configured correctly. Please provide a valid API key." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = `
      As an elite luxury beauty consultant for Naya Lumière, provide a sophisticated and highly practical ritual guide for the following masterpiece:
      
      Product Name: ${productName}
      Brand: ${brandName}
      Category: ${category}
      Price: AED ${price}
      Initial Description: ${description}

      Please generate a response formatted in Markdown with these specific sections and emojis:
      1. ✨ **The Ritual**: How to apply it (technique) and when to use it (AM/PM).
      2. 🎯 **Target Audience**: Which skin types or concerns this masterpiece is curated for.
      3. 🤝 **The Perfect Sync**: What other products or ingredients to pair this with for maximum efficacy.
      4. 💡 **Specialist's Secret**: A professional tip for an elevated experience.

      Maintain a tone that is expert, precise, and elegant. Be practical but luxurious. Do not use conversational filler.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("AI Product Info Error:", error);
    return NextResponse.json({ error: "Failed to generate luxury insights" }, { status: 500 });
  }
}
