import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route navigation if no hash anchor is present
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-navy-dark">
      <Navbar />
      <main className={`flex-1 ${location.pathname === '/' ? 'pt-0' : 'pt-24'}`}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
