// backend/src/routes/chat.ts

/** @fileoverview
 * Express router handling Mandarin chat endpoints:
 *  - /context/:mode  : generate scenario prompts
 *  - /:mode/respond  : chat responses with optional pinyin/English toggle
 *  - /:mode/finish   : grade completed conversation
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { authAdmin, db, FieldValue } from '../firebase';

/** OpenAI client initialization based on presence of API key. */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

/** Mapping from chat mode to its system instruction. */
const MODE_INFO = {
  beginner:     'You are a tutor who only uses HSK-1 vocabulary and simple grammar.',
  intermediate: 'You are a tutor who uses HSK-2 and HSK-3 vocabulary and moderate grammar.',
  advanced:     'You are a tutor who uses rich, natural Mandarin with advanced structures.',
  progression:  'You are the learner’s personal tutor. NEVER use words the learner hasn’t seen. Introduce 1–2 new words MAX.',
} as const;
type ChatMode = keyof typeof MODE_INFO;

/** Verifies Firebase Auth token from an Authorization header. */
async function verifyUser(header?: string) {
  if (!header?.startsWith('Bearer ')) {
    return null;
  }
  try {
    return await authAdmin.verifyIdToken(header.slice(7));
  } catch {
    return null;
  }
}

/**
 * Persists up to 50 unique Hanzi characters from text into Firestore,
 * incrementing counts and updating timestamps.
 */
async function storeNewChars(uid: string, text: string) {
  const chars = text.match(/\p{Script=Hani}/gu) ?? [];
  if (chars.length === 0) {
    return;
  }

  const uniqueChars = Array.from(new Set(chars)).slice(0, 50);
  const batch = db.batch();
  const coll  = db.collection('users').doc(uid).collection('knownWords');

  for (const ch of uniqueChars) {
    batch.set(
      coll.doc(ch),
      {
        firstSeen:   FieldValue.serverTimestamp(),
        lastSeen:    FieldValue.serverTimestamp(),
        count:       FieldValue.increment(1),
        proficiency: 'new',
      },
      { merge: true }
    );
  }

  await batch.commit();
}

const router = Router();

/**
 * GET /context/:mode
 * Generates an English scenario prompt appropriate to the given mode.
 */
router.get(
  '/context/:mode',
  (async (req, res) => {
    if (!openai) {
      return res.status(503).json({ error: 'OpenAI key not set' });
    }

    const mode = req.params.mode as ChatMode;
    if (!(mode in MODE_INFO)) {
      return res.status(400).json({ error: 'Bad mode' });
    }

    const user = await verifyUser(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Auth required' });
    }

    const messages: ChatCompletionMessageParam[] = [
      {
        role:    'system',
        content:
          'You are a scene-writer for Mandarin learners. Produce one paragraph (50–80 words) in English only that 1) sets the scene, 2) states the learner’s goal, 3) names the person they will talk to, ' +
          `and only uses concepts appropriate for a ${mode}-level learner (HSK-1 for beginner, HSK-2/3 for intermediate, etc). Do NOT include any dialogue.`,
      },
      {
        role:    'user',
        content: `Create a scenario for the "${mode}" level.`,
      },
    ];

    const out = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      temperature: 0.8,
      messages,
    });

    const context = out.choices[0].message!.content!.trim();
    res.json({ context });
  }) as RequestHandler
);

/**
 * POST /:mode/respond
 * Continues the conversation, injecting system prompts for mode,
 * pinyin toggle, and off-topic guard as needed.
 */
router.post(
  '/:mode/respond',
  (async (req, res) => {
    if (!openai) {
      return res.status(503).json({ error: 'OpenAI key not set' });
    }

    const mode = req.params.mode as ChatMode;
    if (!(mode in MODE_INFO)) {
      return res.status(400).json({ error: 'Bad mode' });
    }

    const user = await verifyUser(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Auth required' });
    }

    type ReqBody = {
      context: string;
      conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
      knownWords?: string[];
      includeEnglishPinyin?: boolean;
      userMessage: string;
    };

    const {
      context,
      conversation,
      knownWords = [],
      includeEnglishPinyin = false,
      userMessage,
    } = req.body as ReqBody;

    // Check if learner has used any Chinese characters yet
    const wroteChinese = /\p{Script=Hani}/u.test(
      conversation.map((m) => m.content).join(' ')
    );
    const guardMsg = wroteChinese
      ? undefined
      : 'If the learner writes in English, immediately reply in Chinese and encourage them to continue in Mandarin!';

    const modeMsg   = MODE_INFO[mode];
    const progMsg   = mode === 'progression'
      ? `Learner knows ONLY: ${knownWords.join(', ')}.`
      : undefined;
    const pinyinMsg = includeEnglishPinyin
      ? 'IMPORTANT: Format ALL your responses with Chinese characters followed by pinyin in parentheses and English in square brackets like this example:\n\n你好 (nǐ hǎo) [Hello]\n我是老师 (wǒ shì lǎoshī) [I am the teacher]\n\nEvery Chinese sentence or phrase MUST include both pinyin and English translation.'
      : 'IMPORTANT: Reply using ONLY Chinese characters with NO pinyin and NO English translations. Do not include any parentheses, square brackets, or translations of any kind.';

      const systemMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: context } as ChatCompletionMessageParam,
        ...(guardMsg
        ? [{ role: "system", content: guardMsg } as ChatCompletionMessageParam]
        : []),
        { role: "system", content: modeMsg } as ChatCompletionMessageParam,
        ...(progMsg
        ? [{ role: "system", content: progMsg } as ChatCompletionMessageParam]
        : []),
        { role: "system", content: pinyinMsg } as ChatCompletionMessageParam,
    ];

    const messages: ChatCompletionMessageParam[] = [
      ...systemMessages,
      ...conversation.map((m) => ({
        role:    m.role,
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const out = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 300,
      messages,
    });

    const reply = out.choices[0].message!.content!.trim();
    await storeNewChars(user.uid, reply);

    res.json({ reply });
  }) as RequestHandler
);

/**
 * POST /:mode/finish
 * Persists all new characters then grades each learner turn,
 * returning JSON { score, perMessage: [ {id, correct, feedback}, … ] }.
 */
router.post(
  '/:mode/finish',
  (async (req, res) => {
    if (!openai) {
      return res.status(503).json({ error: 'OpenAI key not set' });
    }

    const mode = req.params.mode as ChatMode;
    if (!(mode in MODE_INFO)) {
      return res.status(400).json({ error: 'Bad mode' });
    }

    const user = await verifyUser(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Auth required' });
    }

    const {
      context = '',
      conversation = [],
    }: {
      context?: string;
      conversation: Array<{
        id:      string;
        role:    'user' | 'assistant';
        content: string;
      }>;
    } = req.body;

    // Persist every turn’s new characters
    for (const msg of conversation) {
      await storeNewChars(user.uid, msg.content);
    }

    const systemPrompt =
      'You are a strict but helpful Mandarin teacher. ' +
      'Grade each learner message for grammar, vocabulary, and relevance. ' +
      'Your comments MUST be in English, but you can quote or suggest Mandarin sentences so long as an English speaker can understand. ' +
      'Output only valid JSON matching this exact shape: ' +
      '{"score":<1–10>,"perMessage":[{"id":"<messageId>","correct":true|false,"feedback":"…"},…]}.';

      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...(context ? [{ role: "system", content: context }] : []),
        ...conversation.map((m) => ({
          role:    m.role,
          content: `[${m.id}] ${m.content}`,
        })),
      ] as ChatCompletionMessageParam[];

    const out = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      temperature: 0,
      max_tokens: 500,
      messages,
    });

    /**
     * GraderOutput describes the JSON shape we expect from the model.
     */
    interface GraderOutput {
      score: number;
      perMessage: Array<{
        id:       string;
        correct:  boolean;
        feedback: string;
      }>;
    }

    let result: GraderOutput = { score: 0, perMessage: [] };

    try {
      result = JSON.parse(out.choices[0].message!.content!);
    } catch (err) {
      console.error('Grader parse error:', err);
      return res.status(500).json({ error: 'Grader parse error' });
    }

    res.json(result);
  }) as RequestHandler
);

export default router;
