import React from 'react';
import { formatTime } from '../utils/helper';

const MessageList = ({ messages, currentUser }) => {

  if (messages.length === 0) {
    return (
      <div className="empty-chat">
        <p>No messages yet. Start a conversation!</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={message.ID}
          className={`message ${!message.IS_BOT ? 'user-message' : 'bot-message'}`}
        >
          <div className="message-content">
            {message.MESSAGE}
          </div>
          <div className="message-time">
            {formatTime(message.CREATED_AT)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;