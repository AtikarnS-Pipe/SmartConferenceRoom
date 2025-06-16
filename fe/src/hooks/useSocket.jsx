// // src/hooks/useSocket.jsx
// import { useState, useEffect } from 'react';
// import { io } from 'socket.io-client';

// const socket = io(import.meta.env.VITE_API_SOCKET_URL);

// export function useSocket() {
//   const [token, setToken] = useState(null);

//   useEffect(() => {
//     socket.emit('wait_for_token');
//     socket.on('receive_token', (token) => {
//       setToken(token);
//       console.log('Received token:', token);
//     });
//     socket.on('token_revoked', () => {
//       setToken(null);
//     });

//     return () => {
//       socket.off('receive_token');
//       socket.off('token_revoked');
//     };
//   }, []);

//   return token;
// }