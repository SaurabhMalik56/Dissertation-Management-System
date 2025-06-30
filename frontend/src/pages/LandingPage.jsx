import { Link } from 'react-router-dom';
import {
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserShield,
  FaCogs,
  FaClipboardList,
  FaCheckCircle,
  FaArrowRight,
} from 'react-icons/fa';

const steps = [
  'Student submits proposal',
  'HOD reviews and approves',
  'Faculty is assigned',
  'Meetings tracked & evaluated'
];

const roles = [
  { icon: <FaGraduationCap />, role: 'Students', desc: 'Submit proposals, check guide, attend meetings.' },
  { icon: <FaChalkboardTeacher />, role: 'Faculty', desc: 'Guide students, schedule meetings, give feedback.' },
  { icon: <FaUserShield />, role: 'HOD', desc: 'Approve projects, assign guides, oversee progress.' },
  { icon: <FaCogs />, role: 'Admin', desc: 'System maintenance, manage access & controls.' }
];

const features = [
  { icon: <FaClipboardList />, title: 'Proposal Submission', desc: 'Submit your project proposal with ease.' },
  { icon: <FaChalkboardTeacher />, title: 'Faculty Assignment', desc: 'Get assigned a suitable project guide.' },
  { icon: <FaCheckCircle />, title: 'Progress Tracking', desc: 'Track meetings and project milestones.' },
];

const LandingPage = () => {
  return (
    <div className="bg-white text-gray-800 font-sans scroll-smooth">

      {/* HEADER */}
      <header className="w-full bg-white fixed top-0 z-50 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-700">Disserto</h1>
          <nav className="hidden md:flex gap-8 text-gray-700 font-medium">
            <a href="#features" className="hover:text-indigo-600">Features</a>
            <a href="#workflow" className="hover:text-indigo-600">Workflow</a>
            <a href="#roles" className="hover:text-indigo-600">User Roles</a>
          </nav>
          <Link to="/login" className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all">Sign In</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="h-screen bg-gradient-to-r from-indigo-50 to-white flex items-center justify-center text-center px-6 pt-24">
        <div className="max-w-3xl">
          <h2 className="text-5xl font-extrabold text-indigo-700 leading-tight mb-6">
            Academic Project Management, Simplified.
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Disserto helps students, guides, and departments manage final-year projects with transparency and efficiency.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 shadow-md transition-all">
              Get Started
            </Link>
            <Link to="/login" className="border-2 border-indigo-600 text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-indigo-700 mb-12">Key Features</h3>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map(({ icon, title, desc }, idx) => (
              <div key={idx} className="p-8 bg-indigo-50 rounded-xl shadow-md hover:shadow-xl transition">
                <div className="text-4xl text-indigo-600 mb-4 mx-auto">{icon}</div>
                <h4 className="text-xl font-semibold mb-2">{title}</h4>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="py-20 bg-indigo-50">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-indigo-700 text-center mb-12">How It Works</h3>
          <div className="relative border-l-2 border-indigo-300 ml-6 pl-6">
            {steps.map((step, i) => (
              <div key={i} className="mb-10">
                <div className="absolute -left-3 top-1.5 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white"></div>
                <h4 className="text-xl font-semibold text-indigo-800 mb-1">Step {i + 1}</h4>
                <p className="text-gray-600">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-indigo-700 mb-12">User Roles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {roles.map(({ icon, role, desc }, idx) => (
              <div key={idx} className="bg-indigo-50 p-6 rounded-xl shadow-md hover:shadow-xl transition">
                <div className="text-4xl text-indigo-600 mb-3 mx-auto">{icon}</div>
                <h4 className="text-xl font-bold mb-2">{role}</h4>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-indigo-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm text-center sm:text-left">
          <div>
            <h5 className="text-lg font-bold mb-2">Disserto</h5>
            <p>Streamlining your academic project journey, the smart way.</p>
          </div>
          <div>
            <h5 className="text-lg font-bold mb-2">Quick Links</h5>
            <ul>
              <li><a href="#features" className="hover:text-indigo-300">Features</a></li>
              <li><a href="#workflow" className="hover:text-indigo-300">Workflow</a></li>
              <li><a href="#roles" className="hover:text-indigo-300">User Roles</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-lg font-bold mb-2">Connect</h5>
            <ul>
              <li><a href="https://github.com/saurabhmalik-dev" className="hover:text-indigo-300">GitHub</a></li>
              <li><a href="mailto:saurabh@example.com" className="hover:text-indigo-300">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-6 text-indigo-200 text-xs">
          © {new Date().getFullYear()} Disserto. Built by Saurabh Malik.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
