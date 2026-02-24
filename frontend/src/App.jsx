import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ProcessorPage from './pages/ProcessorPage';
import HistoryPage from './pages/HistoryPage';

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen noise-bg">
        <Navbar />

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/process" element={<ProcessorPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
};

export default App;
