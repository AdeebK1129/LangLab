// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import multer from 'multer';
import OpenAI from 'openai';
import usersRouter from './routes/users';
import chatRouter from './routes/chat';

/** Express application instance */
const app = express();
/** Server port from environment or default */
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: 'http://localhost:5173',
    exposedHeaders: ['Authorization'],
  })
);
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/chat', chatRouter);

/** Multer middleware for file uploads */
const upload = multer();
/** OpenAI client instance */
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

/**
 * Basic hello world endpoint
 */
app.get('/api/hello', (_req, res) => {
  res.json({message: 'Hello, world!'});
});

/**
 * Health check endpoint
 */
app.get('/api/health', (_req, res) => {
  res.json({status: 'ok'});
});

/**
 * Audio transcription endpoint (mock implementation)
 */
app.post('/api/transcribe', upload.single('file'), (_req, res) => {
  res.json({text: 'this was your audio!'});
});

/**
 * AI chat response endpoint
 */
app.post('/api/conversations/text/respond', async (req, res) => {
  try {
    const {conversationId, userMessage} = req.body;
    console.log(
      `[${new Date().toISOString()}] conv=${conversationId} user=>`,
      userMessage
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {role: 'system', content: 'You are a helpful Mandarin-learning tutor.'},
        {role: 'user', content: userMessage},
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const aiReply = completion.choices[0]?.message?.content?.trim() || '';
    res.json({reply: aiReply});
  } catch (err) {
    console.error('OpenAI error', err);
    res.status(500).json({error: 'AI request failed'});
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});