import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
import {GoogleGenerativeAI} from "@google/generative-ai";

// Ініціалізація Gemini API з вашим ключем
const genAI = new GoogleGenerativeAI("AIzaSyDYwwYd9srPKzRZikYpd4qAaWjtmF_pX9Y");

export const analyzeToken = onRequest({cors: true}, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const {tokenName, tokenTicker, candleData, userQuestion} = req.body;

    if (!tokenName || !tokenTicker || !candleData || !userQuestion) {
      res.status(400).send("Missing required fields");
      return;
    }

    const model = genAI.getGenerativeModel({model: "gemini-pro"});

    const prompt = `
      You are a professional crypto trader and analyst. Your task is to analyze market data and provide clear, well-founded answers. Analyze the token ${tokenName} (${tokenTicker}).
      Here is the recent candle data (Open, High, Low, Close): ${JSON.stringify(
      candleData,
    )}.
      The user has asked the following question: '${userQuestion}'.
      Provide your analysis, pointing out possible support/resistance levels, FVG, and other key elements on the chart.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).send({analysis: text});
  } catch (error) {
    logger.error("Error analyzing token:", error);
    res.status(500).send("Internal Server Error");
  }
});