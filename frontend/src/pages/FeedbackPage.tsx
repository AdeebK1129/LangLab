// frontend/src/pages/FeedbackPage.tsx
import {useEffect} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import type {ChatMessage} from './ChatPage';

/**
 * Results from the feedback analysis of a conversation
 */
interface FeedbackResult {
  score: number;
  perMessage: Array<{id: string; correct: boolean; feedback: string}>;
}

/**
 * Data passed through router state to the feedback page
 */
interface LocationState {
  context: string;
  conversation: ChatMessage[];
  feedback: FeedbackResult;
  newWordsCount: number;
}

/**
 * Page that displays conversation feedback and scoring after a chat session
 */
export default function FeedbackPage() {
  const {mode} = useParams<{mode: string}>();
  const navigate = useNavigate();
  const {state} = useLocation();
  const s = (state as LocationState) || null;

  useEffect(() => {
    if (!s || !s.conversation || !s.feedback || !mode) {
      navigate(`/chat/${mode ?? ''}`, {replace: true});
    }
  }, [s, mode, navigate]);

  if (!s) return null;

  // Build a lookup from message-id → feedback metadata
  const lookup = new Map(s.feedback.perMessage.map((p) => [p.id, p]));

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Lesson Feedback</h1>

      <section className="bg-gray-100 p-4 rounded-lg">
        <h2 className="font-semibold mb-2">Scenario</h2>
        <p>{s.context}</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Your Conversation</h2>
        {s.conversation.map((msg) => {
          const info = lookup.get(msg.id);
          // Un-graded assistant messages
          if (msg.role === 'assistant' || !info) {
            return (
              <div key={msg.id} className="ml-4">
                <div className="text-xs text-gray-500 capitalize">
                  {msg.role}
                </div>
                <div className="p-2 rounded-lg bg-white border border-gray-200">
                  {msg.content}
                </div>
              </div>
            );
          }

          // Graded user message: wrap in a group for hover
          return (
            <div key={msg.id} className="ml-4 relative group">
              <div className="text-xs text-gray-500 capitalize">
                {msg.role}
              </div>
              <div
                className={`
                  p-2 my-1 rounded-lg border 
                  ${info.correct
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'}
                `}
              >
                {msg.content}
              </div>

              {/* Tooltip panel */}
              <div
                className={`
                  invisible group-hover:visible 
                  absolute left-0 bottom-full mb-2 
                  w-max max-w-xs 
                  bg-gray-800 text-white text-sm 
                  p-2 rounded shadow-lg 
                  z-10
                `}
              >
                {info.feedback}
              </div>
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
          onClick={() => navigate(`/results/${mode}`, {state: s})}
          className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition"
        >
          View Results
        </button>
      </div>
    </div>
  );
}