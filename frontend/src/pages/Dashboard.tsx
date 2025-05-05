import { Link } from "react-router-dom";

const MODES = [
  { key: "beginner",     label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced",     label: "Advanced" },
  { key: "progression",  label: "Progression" },
] as const;

export default function Dashboard() {
  return (
    <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {MODES.map((m) => (
        <Link
          key={m.key}
          to={`/chat/${m.key}`}
          className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6 text-center"
        >
          <h3 className="text-xl font-semibold">{m.label}</h3>
        </Link>
      ))}
    </div>
  );
}
