// frontend/src/pages/Dashboard.tsx
import {Link} from 'react-router-dom';

import schoolIcon from '@/assets/school.svg';
import universityIcon from '@/assets/university.svg';
import graduationCapIcon from '@/assets/graduation-cap.svg';
import dumbbellIcon from '@/assets/dumbbell.svg';

/**
 * Configuration for available chat modes
 */
const MODES: {
  key: string;
  label: string;
  icon: string;
  to: string;
}[] = [
  {key: 'beginner', label: 'Beginner', icon: schoolIcon, to: '/chat/beginner'},
  {key: 'intermediate', label: 'Intermediate', icon: universityIcon, to: '/chat/intermediate'},
  {key: 'advanced', label: 'Advanced', icon: graduationCapIcon, to: '/chat/advanced'},
  {key: 'progression', label: 'Progression', icon: dumbbellIcon, to: '/chat/progression'},
];

/**
 * Dashboard page displaying available chat modes
 */
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Info banner */}
      <div className="max-w-4xl mx-auto mb-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg p-4 shadow-lg">
        <p className="text-center text-lg md:text-xl font-medium">
          💬 <strong>How it works:</strong> Pick a level to start chatting in 
          Mandarin. Our AI tutor will adjust its vocabulary & grammar to your 
          choice, and at the end you'll get instant feedback on your sentences!
        </p>
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Chat modes</h2>
      </div>

      {/* Mode cards */}
      <div className="max-w-4xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((mode) => (
          <Link
            key={mode.key}
            to={mode.to}
            className="group block bg-white rounded-xl shadow hover:shadow-md transition p-6 text-center"
          >
            <img
              src={mode.icon}
              alt={`${mode.label} icon`}
              className="mx-auto mb-4 w-12 h-12 filter group-hover:brightness-110"
            />
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition">
              {mode.label}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}