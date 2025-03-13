import { updateReceivedMsg } from "./dom"

interface WSMsg {
  type: 'broadcast' | 'private' | 'offer' | 'answer' | 'ice',
  sender: string,
  target: string,
  data: {
  [key: string]: any
  },
}


let myId: string | null = null
export let clients: string[] = [] as string[]


const configuration: RTCConfiguration = {
  iceServers: [],
}

const peerConnection = new RTCPeerConnection(configuration)


export const dataChannel = createDataChannel()


function createDataChannel(){
  const dataChannel = peerConnection.createDataChannel('textTransfer')
  console.log('dataChannel: ', dataChannel)
  dataChannel.onopen = () => console.log('Data channel open')
  dataChannel.onmessage = (event) => console.log('Received message:', event.data)

  return dataChannel
}

// ice
const iceCandidates: RTCIceCandidate[] = [] as RTCIceCandidate[]
const remoteIceCandidates: RTCIceCandidate[] = new Proxy([], {
  get(target, prop, receiver) {
    if (prop === 'push') {
      // 返回包装函数，拦截push调用
      return function (...args: any[]) {
        const result = Reflect.apply(target.push, target, args);
        console.log('Remote ICE candidates updated:', remoteIceCandidates.length);
        setRemoteIce(remoteIceCandidates); // 触发后续逻辑
        return result;
      };
    }

    return Reflect.get(target, prop, receiver);
  },
});

peerConnection.onicecandidate = (event) => {
  if(event.candidate) {
    iceCandidates.push(event.candidate)
    console.log('ICE candidates updated:', iceCandidates.length)
    sendIce(iceCandidates)  
  }
}

function setRemoteIce(iceCandidates: RTCIceCandidate[]){
  for(const candidate of iceCandidates) {
    peerConnection.addIceCandidate(candidate)
      .catch((error) => console.error('Error adding ICE candidate:', error))
  }
  console.log('Remote ICE candidates set.', remoteIceCandidates.length)
}

function sendIce(iceCandidates: RTCIceCandidate[]){
  for(const candidate of iceCandidates) {
    socket.send(JSON.stringify({
      type: 'ice',
      target: 'all',
      sender: myId,
      data: candidate
    }))
  }
  console.log('ICE candidates sent: ', iceCandidates.length)
}

peerConnection.oniceconnectionstatechange = () => {
  console.log('ICE connection state changed:', peerConnection.iceConnectionState)
  if(peerConnection.iceConnectionState === 'connected') {
    console.log('ICE connection established.')
  }
}

peerConnection.onicecandidateerror = (event) => {
  console.error('ICE candidate error:', event.errorText)
}

// data channel
peerConnection.ondatachannel = (event: { channel: any }) => {
  const dataChannel = event.channel
  dataChannel.onmessage = (event: { data: string }) => {
    console.log('OK: ', event.data)
    updateReceivedMsg(event.data)
  }
}

const socket = connectWSS()

function connectWSS(){
  const socket = new WebSocket('ws://192.168.31.68:8080');

  socket.onopen = () => {
    console.log('WebSocket connection established.')
  }

  socket.onmessage = (event) => {
    try {
      const jsonObj: WSMsg = JSON.parse(event.data.toString())

      console.log('Received message from server:', jsonObj)

      if(jsonObj.type === 'private') {
        myId = jsonObj.target;

        console.log(`My ID is: ${jsonObj.target}`)
      } 
      else if(jsonObj.type === 'broadcast' && jsonObj.data.clients) {
        clients = jsonObj.data.clients.filter((id: string) => id !== myId)
      } 
      else if(jsonObj.type === 'offer' && jsonObj.sender !== myId) {
        console.log('Received offer.', jsonObj)
        peerConnection.setRemoteDescription(jsonObj.data as RTCSessionDescriptionInit)
          .then(() => {
            console.log('Remote description set successfully.')
            return peerConnection.createAnswer()
          })
          .then((answer) => {
            console.log('Answer created:', answer)
            return peerConnection.setLocalDescription(answer)
          })
          .then(() => {
            console.log('Local description set successfully.')
            socket.send(JSON.stringify({
              type: 'answer',
              target: jsonObj.sender,
              sender: myId,
              data: peerConnection.localDescription
            }))
            console.log('Answer sent.')
          })
      } else if (jsonObj.type === 'answer') {
        // set answer -> set ice
        console.log('Received answer:', jsonObj.data)
        peerConnection.setRemoteDescription(jsonObj.data as RTCSessionDescriptionInit)
          .then(() => {
            console.log('Remote answer description set successfully.')
          })
      } else if(jsonObj.type === 'ice') {
        console.log('Received ICE candidate:', jsonObj.data)
        remoteIceCandidates.push(jsonObj.data as RTCIceCandidate)
      }
    } catch (e) {
      console.log("New Client Notification:", event.data)
      console.error(e)
    }
  }

  socket.onclose = () => {
    console.log('WebSocket connection closed.')
  }

  socket.onerror = (error) => { console.error('WebSocket error:', error) }
  
  return socket
}


export function sendOffer(...targets: string[]) {
  peerConnection.createOffer()
  .then((offer) => {
    console.log('Offer created:', offer)
    peerConnection.setLocalDescription(offer)
    .then(() => {
      console.log('Local description set successfully.')
      sendIce(iceCandidates)
      if(socket.readyState === WebSocket.OPEN) {
        console.log(`Offer sent. `)
        for(const target of targets) {
          socket.send(JSON.stringify({
            type: 'offer',
            target: `${target}`,
            sender: myId,
            data: peerConnection.localDescription
          }))
        }
      } else {
        console.log('WebSocket is not open. Please try later!')
      }
    })
  })
}
