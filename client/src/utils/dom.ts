import { DiscoveredList, MYINFO } from './contant'
import { sendDataChannelMessage, sendOffer } from './wrtc'
import { sendMessage } from './ws'


const sendBtn = <HTMLButtonElement | null>document.getElementById('send-btn') 
const sendMsg = <HTMLTextAreaElement | null>document.getElementById('send-msg') 

if (!sendBtn || !sendMsg) {
  throw new Error('Could not find send button or message input')
}

sendBtn.addEventListener('click', () => {
  sendMessage(sendMsg.value)
  sendMsg.value = ''
  console.log('Message sent:', sendMsg.value)
})



export function updateDiscoveredList(){
  const discoveredList = <HTMLUListElement | null> document.querySelector('.discovered-clients')
  if(!discoveredList) {
    throw new Error('Could not find discovered clients list')
  }

  console.log('Updating discovered list', DiscoveredList)

  const list = []
  for (const id of DiscoveredList) {
    if(id === MYINFO.id) {
      continue
    }
    const li = document.createElement('li')
    li.textContent = id
    list.push(li)
  }

  discoveredList.replaceChildren(...list)
}



//WebRTC

const sendOfferBtn = <HTMLButtonElement | null>document.querySelector('.send-offer-btn') 


if (!sendOfferBtn) {
  throw new Error('Could not find send offer button')
}

sendOfferBtn.addEventListener('click', async (event) => {
  event.preventDefault()
  if(DiscoveredList.size < 2) { 
    console.log('Not enough clients to send offer')
    return
  }

  let first = ''

  for (const value of DiscoveredList.values()) {
    if (value !== MYINFO.id) {
        first = value;
        break; 
    }
  }

  if(!first) {
    throw new Error('No clients found')
  }
  await sendOffer(first)

  console.log('Send offer to', first)
})



// RTC

const sendRtcMsg = <HTMLButtonElement | null>document.querySelector('.send-rtc-msg') 
const rtcInput = <HTMLTextAreaElement | null>document.querySelector('.rtc-input')
if (!sendRtcMsg || !rtcInput) {
  throw new Error('Could not find send RTC message button')
}

sendRtcMsg.addEventListener('click', async (event) => {
  event.preventDefault()
  sendDataChannelMessage(rtcInput.value)
  rtcInput.value = ''
})


export function updateReceivedMsg(msg: string){
  const rtcReceivedMsg = <HTMLPreElement | null>document.querySelector('.rtc-received-msg')
  if(!rtcReceivedMsg) {
    throw new Error('Could not find RTC received message element')
  }
  rtcReceivedMsg.textContent = msg
}