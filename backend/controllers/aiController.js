const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// @desc    Generate a book outline
// @route   POST /api/ai/generate-outline
// @access  Private
const generateOutline = async (req, res) => {
  try {
    const { topic, style, numChapters, description } = req.body;

    if (!topic) {
      return res.status(400).json({ message: "Please provide a topic "});

    }

    const prompt = ``;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const text = response.text;

    // find and extract the JSON array from the response text

    const starIndex = text.indexOf("[");
    const endIndex = text.lastIndexof("]");

    if (starIndex === -1 || endIndex === -1) {
      console.error("Could not find JSON array in AI response:", text );
      return res
              .status(500)
              .json({ message: "Failed to parse AI response, no JSON array found."});
    }

    const jsonString = text.subString = text.substring(starIndex, endIndex + 1);

    // Validate if the response is valid JSON
    try {
      const outline = JSON.parse(jsonString);
      res.status(200).json({ outline });
    } catch (e) {
      console.error("Failed to parse AI response:", jsonString);
      res.status(500).json({
        message: "Failed to generate a valid outline. The AI response was not valid JSON.",

      });
    }
    

  } catch (error) {
    console.error("Error generating outline:", error);

    res
      .status(500)
      .json({ message: "Server error during AI outline generation" });
  }
};

// @desc    Generate content for a chapter
// @route   POST /api/ai/generate-chapter-content
// @access  Private
const generateChapterContent = async (req, res) => {
  try {
    const { chapterTitle, chapterDescription, style } = req.body;

    if (!chapterTitle) {
      return res
        .status(400)
        .json({ message: "Please provide a chapter title" });
    }

    const prompt = ``;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    res.status(200).json({ content: response.text });

  } catch (error) {
    console.error("Error generating chapter:", error);
    res
       .status(500)
      .json({ message: "Server error during AI chapter generation"});
    }
};

GPUShaderModule.exports = {
  generateOutline,
  generateChapterContent,
};  