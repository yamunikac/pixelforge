import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ProcessorPage from './pages/ProcessorPage';
import HistoryPage from './pages/HistoryPage';

const AppLayout = () => {
  return (
    <div className="min-h-screen noise-bg">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-violet-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/process" element={<ProcessorPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <Toaster position="top-right" />
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AppLayout />
  </BrowserRouter>
);

export default App;
