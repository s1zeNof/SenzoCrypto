import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Configuration
const RSS_FEEDS = [
    'https://airdrops.io/feed/',
    'https://airdropalert.com/feed',
    'https://cryptoslate.com/feed/',
    'https://cointelegraph.com/rss/tag/altcoin', // Often contains project news
    'https://decrypt.co/feed'
];

const FIREBASE_CONFIG = {
    apiKey: process.env.VITE_FIREBASE_API_KEY?.trim(),
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: process.env.VITE_FIREBASE_APP_ID?.trim()
};

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@senzo.crypto';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // CHANGE THIS IN PROD

// Initialize Services
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const parser = new Parser();
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function login() {
    try {
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        console.log('Logged in as admin');
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
            console.log('Admin user not found, attempting to create...');
            try {
                await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
                console.log('Admin user created and logged in');
            } catch (createError) {
                console.error('Failed to create admin user:', createError.code, createError.message);
                process.exit(1);
            }
        } else {
            console.error('Login failed:', error.code, error.message);
            process.exit(1);
        }
    }
}

async function checkUrlExists(url) {
    const q = query(collection(db, 'posts'), where('sourceUrl', '==', url));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

async function analyzeAndGenerate(item) {
    console.log(`Analyzing: ${item.title}`);

    // 1. Filter
    const filterPrompt = `
    Analyze this content item.
    Title: ${item.title}
    Content: ${item.contentSnippet || item.content}
    Link: ${item.link}

    STRICT FILTERING RULES:
    1. REJECT "Top 10" lists, "Best Airdrops of 2025", "How to find airdrops", "General Guides", "News about crypto".
    2. REJECT generic market analysis or price predictions.
    3. ACCEPT ONLY specific, actionable guides for a SINGLE project/game/airdrop.
    
    The content MUST be about:
    - A specific new Airdrop campaign (Retroactive or Confirmed).
    - A specific new Crypto Game (P2E) launch.
    - A specific new Testnet/Mainnet launch with potential rewards.

    Is this item specifically about ONE of the above?
    Reply with JSON only:
    {
        "isRelevant": boolean,
        "type": "game" | "airdrop" | "project" | null,
        "confidence": number (0-1),
        "reason": "short explanation why"
    }
    `;

    try {
        const filterResult = await model.generateContent(filterPrompt);
        const filterResponse = filterResult.response.text().replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(filterResponse);

        if (!analysis.isRelevant || analysis.confidence < 0.9) {
            console.log(`Skipping: ${analysis.reason}`);
            return;
        }

        console.log(`Found relevant content! Type: ${analysis.type}. Reason: ${analysis.reason}`);

        // Add delay before generation to avoid rate limits
        await delay(10000);

        // 2. Generate Post
        const generatePrompt = `
        Create a detailed, step-by-step guide in UKRAINIAN based on this opportunity:
        Title: ${item.title}
        Content: ${item.contentSnippet || item.content}
        Link: ${item.link}
        Type: ${analysis.type}

        Requirements:
        - Language: Ukrainian
        - Tone: Professional, "Alpha hunter", practical.
        - Structure the content as a GUIDE, not a news article.

        Specific Fields Required:
        - Reward Status: "Confirmed" (if explicitly stated), "Speculative" (if rumored/points system), or "Unknown".
        - Deadline: Specific date or "TBA" (To Be Announced).
        - Steps: An array of strings, each being a clear action step (e.g., "Connect Wallet", "Bridge ETH to Base", "Swap tokens").

        JSON Output Format:
        {
            "title": string,
            "excerpt": string,
            "content": string (HTML format, include <h2> for sections, <p> for text. Do NOT include the steps list here, they go in the 'steps' array),
            "tags": string[],
            "difficulty": "beginner" | "intermediate" | "advanced",
            "category": string,
            "rewardStatus": "Confirmed" | "Speculative" | "Unknown",
            "deadline": string,
            "steps": string[]
        }
        `;

        const genResult = await model.generateContent(generatePrompt);
        const genResponse = genResult.response.text().replace(/```json|```/g, '').trim();
        const postData = JSON.parse(genResponse);

        // 3. Save to Firestore
        await addDoc(collection(db, 'posts'), {
            ...postData,
            slug: slugify(postData.title),
            type: analysis.type,
            status: 'draft',
            sourceUrl: item.link,
            aiGenerated: true,
            author: {
                uid: auth.currentUser.uid,
                name: 'Senzo AI Agent',
                email: auth.currentUser.email
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            views: 0
        });

        console.log(`Saved new post: ${postData.title}`);

    } catch (error) {
        console.error('Error in AI processing:', error);
    }
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/-+$/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function run() {
    await login();
    import { initializeApp } from 'firebase/app';
    import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
    import { getFirestore, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
    import Parser from 'rss-parser';
    import dotenv from 'dotenv';
    import { GoogleGenerativeAI } from '@google/generative-ai';

    dotenv.config();

    // Configuration
    const RSS_FEEDS = [
        'https://airdrops.io/feed/',
        'https://airdropalert.com/feed',
        'https://cryptoslate.com/feed/',
        'https://cointelegraph.com/rss/tag/altcoin', // Often contains project news
        'https://decrypt.co/feed'
    ];

    const FIREBASE_CONFIG = {
        apiKey: process.env.VITE_FIREBASE_API_KEY?.trim(),
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID?.trim(),
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
        appId: process.env.VITE_FIREBASE_APP_ID?.trim()
    };

    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@senzo.crypto';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // CHANGE THIS IN PROD

    // Initialize Services
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const parser = new Parser();
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function login() {
        try {
            await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
            console.log('Logged in as admin');
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email') {
                console.log('Admin user not found, attempting to create...');
                try {
                    await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
                    console.log('Admin user created and logged in');
                } catch (createError) {
                    console.error('Failed to create admin user:', createError.code, createError.message);
                    process.exit(1);
                }
            } else {
                console.error('Login failed:', error.code, error.message);
                process.exit(1);
            }
        }
    }

    async function checkUrlExists(url) {
        const q = query(collection(db, 'posts'), where('sourceUrl', '==', url));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    }

    async function analyzeAndGenerate(item) {
        console.log(`Analyzing: ${item.title}`);

        // 1. Filter
        const filterPrompt = `
    Analyze this content item.
    Title: ${item.title}
    Content: ${item.contentSnippet || item.content}
    Link: ${item.link}

    STRICT FILTERING RULES:
    1. REJECT "Top 10" lists, "Best Airdrops of 2025", "How to find airdrops", "General Guides", "News about crypto".
    2. REJECT generic market analysis or price predictions.
    3. ACCEPT ONLY specific, actionable guides for a SINGLE project/game/airdrop.
    
    The content MUST be about:
    - A specific new Airdrop campaign (Retroactive or Confirmed).
    - A specific new Crypto Game (P2E) launch.
    - A specific new Testnet/Mainnet launch with potential rewards.

    Is this item specifically about ONE of the above?
    Reply with JSON only:
    {
        "isRelevant": boolean,
        "type": "game" | "airdrop" | "project" | null,
        "confidence": number (0-1),
        "reason": "short explanation why"
    }
    `;

        try {
            const filterResult = await model.generateContent(filterPrompt);
            const filterResponse = filterResult.response.text().replace(/```json|```/g, '').trim();
            const analysis = JSON.parse(filterResponse);

            if (!analysis.isRelevant || analysis.confidence < 0.9) {
                console.log(`Skipping: ${analysis.reason}`);
                return;
            }

            console.log(`Found relevant content! Type: ${analysis.type}. Reason: ${analysis.reason}`);

            // Add delay before generation to avoid rate limits
            await delay(10000);

            // 2. Generate Post
            const generatePrompt = `
        Create a detailed, step-by-step guide in UKRAINIAN based on this opportunity:
        Title: ${item.title}
        Content: ${item.contentSnippet || item.content}
        Link: ${item.link}
        Type: ${analysis.type}

        Requirements:
        - Language: Ukrainian
        - Tone: Professional, "Alpha hunter", practical.
        - Structure the content as a GUIDE, not a news article.

        Specific Fields Required:
        - Reward Status: "Confirmed" (if explicitly stated), "Speculative" (if rumored/points system), or "Unknown".
        - Deadline: Specific date or "TBA" (To Be Announced).
        - Steps: An array of strings, each being a clear action step (e.g., "Connect Wallet", "Bridge ETH to Base", "Swap tokens").

        JSON Output Format:
        {
            "title": string,
            "excerpt": string,
            "content": string (HTML format, include <h2> for sections, <p> for text. Do NOT include the steps list here, they go in the 'steps' array),
            "tags": string[],
            "difficulty": "beginner" | "intermediate" | "advanced",
            "category": string,
            "rewardStatus": "Confirmed" | "Speculative" | "Unknown",
            "deadline": string,
            "steps": string[]
        }
        `;

            const genResult = await model.generateContent(generatePrompt);
            const genResponse = genResult.response.text().replace(/```json|```/g, '').trim();
            const postData = JSON.parse(genResponse);

            // 3. Save to Firestore
            await addDoc(collection(db, 'posts'), {
                ...postData,
                slug: slugify(postData.title),
                type: analysis.type,
                status: 'draft',
                sourceUrl: item.link,
                aiGenerated: true,
                author: {
                    uid: auth.currentUser.uid,
                    name: 'Senzo AI Agent',
                    email: auth.currentUser.email
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                views: 0
            });

            console.log(`Saved new post: ${postData.title}`);

        } catch (error) {
            console.error('Error in AI processing:', error);
            throw error; // Re-throw to be caught by the outer try-catch for 429 handling
        }
    }

    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/-+$/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    async function run() {
        await login();

        for (const feedUrl of RSS_FEEDS) {
            try {
                console.log(`Fetching ${feedUrl}...`);
                const feed = await parser.parseURL(feedUrl);

                // Process only the latest 1 item to avoid spamming and hitting rate limits
                for (const item of feed.items.slice(0, 1)) {
                    if (await checkUrlExists(item.link)) {
                        console.log('Already exists, skipping.');
                        continue;
                    }

                    // Add delay before analysis to avoid rate limits
                    await delay(15000); // Increased delay to 15s

                    try {
                        await analyzeAndGenerate(item);
                    } catch (error) {
                        if (error.status === 429 || error.message?.includes('429')) {
                            console.error('⚠️ QUOTA EXCEEDED (429). Stopping cycle immediately.');
                            return; // Stop processing this feed and potentially the whole cycle
                        }
                        console.error('Error processing item:', error);
                    }
                }
            } catch (error) {
                console.error(`Error fetching ${feedUrl}:`, error.message);
            }
        }

        console.log('Cycle complete. Sleeping for 60 minutes...');
    }

    // Run immediately then every 60 minutes
    run();
    setInterval(run, 60 * 60 * 1000);
