import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import GradientBackground from './components/GradientBackground';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import UploadPage from './pages/Upload';
import DownloadPage from './pages/Download';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <GradientBackground />
      <Navbar />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          },
        }}
      />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/download" element={<DownloadPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
