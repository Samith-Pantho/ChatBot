import { useState } from 'react';

export const useModal = () => {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' // 'info', 'success', 'error'
  });

  const showModal = (title, message, type = 'info') => {
    setModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const hideModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      type: 'info'
    });
  };

  return {
    modal,
    showModal,
    hideModal
  };
};