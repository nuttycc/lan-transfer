const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
  console.log('Connected to the server');
  ws.send('Hello from Node.js client!');
});

ws.on('message', function message(data) {
  console.log('Received message:', data);
});

ws.on('error', function error(err) {
  console.error('Error occurred:', err);
});

ws.on('close', function close() {
  console.log('Disconnected from the server');
});
