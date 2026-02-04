import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { message, history, productContext } = await req.json();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_actual_gemini_api_key_here") {
      return NextResponse.json({ error: "AI Service not configured correctly. Please provide a valid API key." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const systemInstruction = `
      You are the "Naya Lumière Beauty Specialist", an elite AI consultant for a high-end luxury beauty boutique. 
      Your tone is sophisticated, professional, helpful, and elegant (inspired by luxury brands like Chanel or Dior).
      
      Context about the product the user is looking at:
      Name: ${productContext.name}
      Brand: ${productContext.brand}
      Price: AED ${productContext.price}
      Description: ${productContext.description}
      Benefits: ${productContext.benefits}
      How to use: ${productContext.howToUse}
      Ingredients: ${productContext.ingredients}

      Instructions:
      1. Provide expert advice on how to use this product.
      2. Explain the benefits of its key ingredients if asked.
      3. Be concise but maintain a luxurious feel.
      4. If the user asks about something unrelated to beauty or the product, gracefully redirect them back to the collection.
      5. Always refer to the user as "Client" or "M'lady/Sir" if appropriate, or keep it neutrally elegant.
    `;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Hello, I need some expert advice on your collection." }],
        },
        {
          role: "model",
          parts: [{ text: "Welcome to Naya Lumière. It is my pleasure to assist you in curating your perfect beauty ritual. Which masterpiece may I elaborate on today?" }],
        },
        ...history.map(item => ({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.content }]
        }))
      ],
    });

    const result = await model.generateContent(systemInstruction + "\n\nUser Message: " + message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
