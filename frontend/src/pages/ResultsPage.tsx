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

export default function ResultsPage() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();

  const s = (state as LocationState) || null;
  useEffect(() => {
    if (!s || !mode) {
      navigate("/", { replace: true });
    }
  }, [s, mode, navigate]);

  if (!s) return null;

  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-6">
      <h1 className="text-3xl font-bold">🎉 Lesson Complete!</h1>

      <div className="text-xl">
        Your score:{" "}
        <span className="font-bold">
          {s.feedback.score}/10
        </span>
      </div>

      <div className="text-lg">
        New words learned:{" "}
        <span className="font-bold">
          {s.newWordsCount}
        </span>
      </div>

      <button
        onClick={() => navigate("/")}
        className="mt-6 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition"
      >
        Back to Home
      </button>
    </div>
  );
}
