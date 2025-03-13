const { isValidJSON } = require('./utils/jsonx');

const WebSocket = require('ws');

const wss = new WebSocket.Server({
  host: '192.168.31.68',
  port: 8080 });

const clients = new Map(); 
let clientId = 0;

wss.on('connection', ws => {
  
  clientId += 1
  clients.set(clientId.toString(), ws)

  console.log(`Client ${clientId} connected`)

  ws.on('message', message => {
    console.log(`Client ${clientId} sent a message.`);

    if(isValidJSON(message.toString())) {
      const messageObj = JSON.parse(message.toString())

      if (!messageObj.type) {
        console.log('Invalid message.', messageObj)
      } else {
        const target = messageObj.target
        if(target === 'all') {
          broadcast(message.toString(), messageObj.sender)
          return
        }

        const targetSocket = clients.get(target)
    
        if(targetSocket) {
          targetSocket.send(message.toString())
          console.log(`Message sent to client ${target}`)
        }
      }
    } else {
      console.log('Message is not valid json: ', message)
    }
  })


  // Send an initial message to the client
  // ws.send(`(System) Welcome ${clientId} to the WebSocket server!`);


  // 告诉分配给客户的 id
  ws.send(JSON.stringify({
    type: 'private',
    target: `${clientId}`,
    sender: 'server',
    data: {'text': 'This is your ID!'}
  }))

  broadcast(JSON.stringify({
    type: 'broadcast',
    target: 'all',
    sender: 'server',
    data: {'text': 'Here are all clients!', clients: Array.from(clients.keys())}
  }))

  ws.on('error', error => {
    console.error('WebSocket error:', error);
  })

  ws.on('close', () => {
    clients.delete(clientId)
    console.log(`Client ${clientId} disconnected.`)
  })
})


wss.on('listening', () => {
  console.log('WebSocket server listening on port', wss.options.port);
});


function broadcast(msg, exceptIds = []){
  for (const [id, client] of clients) {
    if(exceptIds.includes(id)) continue
    client.send(msg)
  }
}
