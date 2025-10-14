import { API_BASE_URL } from '../utils/constants';

let modalHandler = null;

export const setModalHandler = (handler) => {
  modalHandler = handler;
};

let navigateHandler = null;

export const setNavigateHandler = (navigate) => {
  navigateHandler = navigate;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    const errorMessage = 'Session has expired. Please login again.';
    
    if (modalHandler) {
      modalHandler.showModal('Session Expired', errorMessage, 'error');
    }
    
    setTimeout(() => {
      if (navigateHandler) {
        navigateHandler('/login');
      } else {
        window.location.href = '/login';
      }
    }, 2000);
    
    throw new Error(errorMessage);
  }
  
  // Check for other error statuses
  if (!response.ok) {
    const errorMessage = `HTTP error! status: ${response.status}`;
    
    if (modalHandler) {
      modalHandler.showModal('Error', errorMessage, 'error');
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  if (data.Status !== 'OK') {
    const errorMessage = data.Message || 'API request failed';
    
    if (modalHandler) {
      modalHandler.showModal('Error', errorMessage, 'error');
    }
    
    throw new Error(errorMessage);
  }
  
  return data;
};

const handleNetworkError = (error) => {
  const errorMessage = 'Network error: Unable to connect to the server';
  
  if (modalHandler) {
    modalHandler.showModal('Error', errorMessage, 'error');
  }
  
  throw new Error(errorMessage);
};

export const exchangeCodeForToken = async (code) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: code }),
    });
    return await handleResponse(response);
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const logoutUser = async (accessToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return await handleResponse(response);
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getMessageHistory = async (accessToken, previousId = null) => {
  try {
    let url = `${API_BASE_URL}/Chat/ChatHistory`;
    if (previousId) {
      url += `?previous_id=${previousId}`;
    } else {
      url += `?previous_id=0`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await handleResponse(response);
    return {
      messages: data.Result.messages || [],
      lastId: data.Result.last_id || null
    };
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const sendChatMessage = async (accessToken, inputmessage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Chat/PostMessage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: inputmessage }),
    });
    return await handleResponse(response);
  } catch (error) {
    return handleNetworkError(error);
  }
};