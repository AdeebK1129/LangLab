interface AnnotatedMessageProps {
  content: string;
  correct: boolean;
  notes: string[];
}

export default function AnnotatedMessage({
  content,
  correct,
  notes,
}: AnnotatedMessageProps) {
  return (
    <div
      className={`p-4 mb-2 rounded-lg border
        ${correct ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"}
      `}
    >
      <p className="whitespace-pre-wrap">{content}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {notes.map((n, i) => (
          <li key={i} className={correct ? "text-green-700" : "text-red-700"}>
            • {n}
          </li>
        ))}
      </ul>
    </div>
  );
}
