import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import db from '@/lib/db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }

    // 1. Fetch data for analysis
    const { rows: products } = await db.query(`
      SELECT 
        p.id, p.name, p.slug, p.description, p.long_description,
        (SELECT COUNT(*) FROM product_images WHERE product_id = p.id AND (alt_text IS NULL OR alt_text = '')) as "missing_alts"
      FROM products p
    `);

    // Check if slug column exists in categories to prevent crash
    let categories;
    let missingCategorySlugs = 0;
    try {
        const catResult = await db.query(`SELECT id, name, slug FROM categories`);
        categories = catResult.rows;
        missingCategorySlugs = categories.filter(c => !c.slug).length;
    } catch (e) {
        // Fallback if slug column doesn't exist
        const catResult = await db.query(`SELECT id, name FROM categories`);
        categories = catResult.rows;
        missingCategorySlugs = categories.length; // All are considered missing if column doesn't exist
    }

    // 2. Perform technical audit
    const auditResults = {
      totalProducts: products.length,
      missingSlugs: products.filter(p => !p.slug).length,
      shortDescriptions: products.filter(p => (p.description?.length || 0) < 50).length,
      missingLongDescriptions: products.filter(p => !p.long_description).length,
      missingAltTexts: products.reduce((acc, p) => acc + parseInt(p.missing_alts || 0), 0),
      totalCategories: categories.length,
      missingCategorySlugs: missingCategorySlugs
    };

    // 3. Use AI for strategic insights
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const contextData = products.slice(0, 10).map(p => ({ name: p.name, desc: p.description }));

    const prompt = `
      You are an expert SEO Strategist for luxury e-commerce.
      Analyze the following site health data and provide 3 high-level strategic recommendations to improve rankings in Google Search for "nayalc.com", a luxury beauty boutique in the UAE.
      
      Site Health: ${JSON.stringify(auditResults)}
      Sample Catalog: ${JSON.stringify(contextData)}
      
      Format your response as a JSON object:
      {
        "score": 0-100,
        "recommendations": [
          {"title": "...", "impact": "High/Medium", "action": "..."},
          ...
        ],
        "marketInsights": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const aiAnalysis = JSON.parse(text);

    return NextResponse.json({
      audit: auditResults,
      analysis: aiAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("SEO Audit Error:", error);
    return NextResponse.json({ error: "Failed to perform SEO audit", details: error.message }, { status: 500 });
  }
}
