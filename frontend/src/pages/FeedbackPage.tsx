import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import type { ChatMessage } from "./ChatPage";

interface FeedbackResult {
  score: number;
  feedback: string;
}

interface LocationState {
  context: string;
  conversation: ChatMessage[];
  feedback: FeedbackResult;
  newWordsCount: number;
}

export default function FeedbackPage() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();

  const s = (state as LocationState) || null;
  // if no state or missing conversation, bounce back
  useEffect(() => {
    if (!s || !s.conversation || !mode) {
      navigate(`/chat/${mode ?? ""}`, { replace: true });
    }
  }, [s, mode, navigate]);

  if (!s || !s.conversation) return null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Lesson Feedback</h1>

      <section className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Scenario</h2>
        <p>{s.context}</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Your Conversation</h2>
        {s.conversation.map((msg, i) => {
          if (msg.role === "assistant") {
            return (
              <div key={i} className="ml-4">
                <div className="text-xs text-gray-500 capitalize">
                  {msg.role}
                </div>
                <div className="p-2 rounded-lg bg-white border border-gray-200">
                  {msg.content}
                </div>
              </div>
            );
          }

          // user turn: split into sentences
          return (
            <div key={i} className="ml-4">
              <div className="text-xs text-gray-500 capitalize">
                {msg.role}
              </div>
              {msg.content
                .split("。")
                .filter((sent) => sent.trim().length > 0)
                .map((sent, j) => {
                  const text = sent + "。";
                  const correct = s.feedback.feedback.includes(text);
                  return (
                    <div
                      key={j}
                      className={`p-2 my-1 rounded-lg border ${
                        correct
                          ? "bg-green-50 border-green-300"
                          : "bg-red-50 border-red-300"
                      }`}
                    >
                      {text}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </section>

      <section className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-2">Overall Score</h2>
        <div className="text-4xl font-bold">{s.feedback.score} / 10</div>
        <div className="mt-1 text-sm text-gray-600">
          New words learned: {s.newWordsCount}
        </div>
      </section>

      <div className="text-center">
        <button
          onClick={() =>
            navigate(`/results/${mode}`, { state: s })
          }
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
        >
          View Results
        </button>
      </div>
    </div>
  );
}
