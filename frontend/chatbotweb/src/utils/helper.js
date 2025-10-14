export const capitalizeName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };