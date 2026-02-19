export interface Question {
    id: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
}

export interface Quiz {
    questions: Question[];
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const generateQuiz = async (content: string): Promise<Quiz> => {
    if (!GEMINI_API_KEY) {
        console.warn('VITE_GEMINI_API_KEY not found, using mock data');
        // Fallback to mock if no key provided (so app doesn't crash for user right now)
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            questions: [
                {
                    id: '1',
                    text: 'Це демо-режим (відсутній API ключ). Яка основна ідея цієї статті?',
                    options: ['Важливість DYOR', 'Купівля на хаях', 'Ігнорування ризиків', 'Трейдинг без стопів'],
                    correctOptionIndex: 0
                },
                {
                    id: '2',
                    text: 'Додайте VITE_GEMINI_API_KEY в .env файл. Що це дасть?',
                    options: ['Нічого', 'Реальні питання від ШІ', 'Помилку', 'Зависання'],
                    correctOptionIndex: 1
                },
                {
                    id: '3',
                    text: 'Який індикатор найкращий?',
                    options: ['RSI', 'MACD', 'Той, який ви розумієте', 'Всі разом'],
                    correctOptionIndex: 2
                }
            ]
        };
    }

    try {
        const prompt = `
            Analyze the following article content and generate a quiz with 6 multiple-choice questions to test the reader's understanding.
            Return ONLY the raw JSON object (no markdown formatting, no backticks) with the following structure:
            {
                "questions": [
                    {
                        "id": "1",
                        "text": "Question text here?",
                        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                        "correctOptionIndex": 0 // index of the correct option (0-3)
                    }
                ]
            }
            
            Article Content:
            ${content.substring(0, 10000)} // Limit content length to avoid token limits
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);
            throw new Error(`Gemini API Error (${response.status}): ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Unexpected API response:', data);
            throw new Error('Invalid response from AI');
        }

        const textResponse = data.candidates[0].content.parts[0].text;

        // Clean up markdown if present (Gemini sometimes adds ```json ... ```)
        let jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find the first '{' and last '}' to extract just the JSON object
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }

        try {
            const quiz = JSON.parse(jsonString) as Quiz;
            if (!quiz.questions || !Array.isArray(quiz.questions)) {
                throw new Error('Invalid quiz format');
            }
            return quiz;
        } catch (parseError) {
            console.error('Failed to parse AI response:', textResponse);
            throw new Error('Failed to parse AI response');
        }

    } catch (error) {
        console.error('Error generating quiz with AI:', error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
            throw new Error('Досягнуто ліміт запитів до AI. Будь ласка, спробуйте пізніше.');
        }
        throw new Error('Failed to generate quiz');
    }
};

export const calculateScore = (questions: Question[], answers: Record<string, number>): number => {
    let correctCount = 0;
    questions.forEach(q => {
        if (answers[q.id] === q.correctOptionIndex) {
            correctCount++;
        }
    });
    return Math.round((correctCount / questions.length) * 100);
};
