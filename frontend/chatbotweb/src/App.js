import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import MasterPage from './components/MasterPage';
import ChatWindow from './components/ChatWindow';
import Modal from './components/Modal';
import { useModal } from './hooks/useModal';
import { setModalHandler } from './services/api';
import './App.css';

function App() {
  const { modal, showModal, hideModal } = useModal();

  useEffect(() => {
    setModalHandler({ showModal, hideModal });
  }, [showModal, hideModal]);

  return (
    <div className="app">
      <Modal
        isOpen={modal.isOpen}
        onClose={hideModal}
        title={modal.title}
        message={modal.message}
      />

      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<MasterPage />}>
              <Route index element={<Navigate to="chat" replace />} />
              <Route path="chat" element={<ChatWindow />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;