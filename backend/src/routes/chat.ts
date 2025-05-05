// backend/src/routes/chat.ts
import { Router } from "express";
import type { RequestHandler } from "express";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { authAdmin, db, FieldValue } from "../firebase";

// ─── OpenAI client ─────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

// ─── mode map & types ───────────────────────────────────────
const MODE_INFO = {
  beginner:     "You are a tutor who only uses HSK-1 vocabulary and simple grammar.",
  intermediate: "You are a tutor who uses HSK-2 and HSK-3 vocabulary and moderate grammar.",
  advanced:     "You are a tutor who uses rich, natural Mandarin with advanced structures.",
  progression:  "You are the learner’s personal tutor. NEVER use words the learner hasn’t seen. Introduce 1–2 new words MAX.",
} as const;
type ChatMode = keyof typeof MODE_INFO;

// ─── helpers ────────────────────────────────────────────────
const verifyUser = async (hdr?: string) => {
  if (!hdr?.startsWith("Bearer ")) return null;
  try {
    return await authAdmin.verifyIdToken(hdr.slice(7));
  } catch {
    return null;
  }
};

const storeNewWords = async (uid: string, text: string) => {
  const words = (text.match(/\p{Script=Hani}+/gu) ?? []).slice(0, 20);
  if (!words.length) return;
  const batch = db.batch();
  const coll  = db.collection("users").doc(uid).collection("knownWords");
  for (const w of words) {
    batch.set(
      coll.doc(w),
      {
        firstSeen:   FieldValue.serverTimestamp(),
        lastSeen:    FieldValue.serverTimestamp(),
        count:       FieldValue.increment(1),
        proficiency: "new",
      },
      { merge: true }
    );
  }
  await batch.commit();
};

// ─── router ─────────────────────────────────────────────────
const router = Router();

/** 1️⃣  Generate a level-aware scene prompt */
router.get(
  "/context/:mode",
  (async (req, res) => {
    if (!openai) return res.status(503).json({ error: "OpenAI key not set" });

    const mode = req.params.mode as ChatMode;
    if (!MODE_INFO[mode]) return res.status(400).json({ error: "Bad mode" });

    const user = await verifyUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Auth required" });

    const messages: ChatCompletionMessageParam[] = [
      {
        role:    "system",
        content:
          "You are a scene-writer for Mandarin learners. Produce *one paragraph* (50–80 words) in English only that 1) sets the scene, 2) states the learner’s goal, 3) names the person they will talk to, " +
          `and only uses concepts appropriate for a ${mode}-level learner (HSK-1 for beginner, HSK-2/3 for intermediate, etc). Do NOT include any dialogue.`,
      },
      {
        role:    "user",
        content: `Create a scenario for the "${mode}" level.`,
      },
    ];

    const out = await openai.chat.completions.create({
      model:       "gpt-4o-mini",
      temperature: 0.8,
      messages,
    });

    const scene = out.choices[0].message!.content!.trim();
    res.json({ context: scene });
  }) as RequestHandler
);

/** 2️⃣  Respond within full history & toggle EN + 拼音 */
router.post(
  "/:mode/respond",
  (async (req, res) => {
    if (!openai) return res.status(503).json({ error: "OpenAI key not set" });

    const mode = req.params.mode as ChatMode;
    if (!MODE_INFO[mode]) return res.status(400).json({ error: "Bad mode" });

    const user = await verifyUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Auth required" });

    type ReqBody = {
      context: string;
      conversation: { role: "user" | "assistant"; content: string }[];
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

    // Off-topic guard: if learner hasn't used any Chinese yet
    const wroteChinese = /\p{Script=Hani}/u.test(
      conversation.map((m) => m.content).join(" ")
    );
    const guard = !wroteChinese
      ? "If the learner writes in English, immediately reply in Chinese and encourage them to continue in Mandarin!"
      : "";

    // build system prompt
    let sys = `${guard} ${MODE_INFO[mode]}`;
    if (mode === "progression") {
      sys += ` Learner knows ONLY: ${knownWords.join(", ")}.`;
    }
    if (includeEnglishPinyin) {
      sys +=
        " For each Chinese reply, include pinyin in parentheses and English in brackets.";
    }

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: context },
      { role: "system", content: sys },
      ...conversation.map((m) => ({
        role:    m.role,
        content: m.content,
      })),
      { role: "user", content: userMessage },
    ];

    const out = await openai.chat.completions.create({
      model:       "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 300,
      messages,
    });

    const reply = out.choices[0].message!.content!.trim();
    await storeNewWords(user.uid, reply);

    res.json({ reply });
  }) as RequestHandler
);

/** 3️⃣  Finish & grade the session */
router.post(
  "/:mode/finish",
  (async (req, res) => {
    if (!openai) return res.status(503).json({ error: "OpenAI key not set" });

    const mode = req.params.mode as ChatMode;
    if (!MODE_INFO[mode]) return res.status(400).json({ error: "Bad mode" });

    const user = await verifyUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: "Auth required" });

    const {
      context = "",
      conversation = [],
    }: {
      context?: string;
      conversation: { role: "user" | "assistant"; content: string }[];
    } = req.body;

    // 1 persist all new characters from every turn
    for (const m of conversation) {
      if (m.role === "user" || m.role === "assistant") {
        await storeNewWords(user.uid, m.content);
      }
    }

    // 2 grade only the learner’s turns
    const messages = [
        {
          role:    "system" as const,
          content: 'You are a strict but helpful Mandarin teacher…',
        },
        ...(context
          ? [{ role: "system" as const, content: context }]
          : []),
        ...conversation.map((m) => ({
          role:    m.role as "user" | "assistant",
          content: m.content,
        })),
      ] as ChatCompletionMessageParam[];
    const out = await openai.chat.completions.create({
      model:       "gpt-4o-mini",
      temperature: 0,
      max_tokens: 200,
      messages,
    });

    let parsed = { score: 5, feedback: "No feedback." };
    try {
      parsed = JSON.parse(out.choices[0].message!.content!);
    } catch {
      // ignore parse errors
    }
    res.json(parsed);
  }) as RequestHandler
);

export default router;
