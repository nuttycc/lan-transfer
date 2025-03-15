import { DiscoveredList, MYINFO } from "../utils/contant";
import { createLeveledLogger } from "../utils/logger";
import { sendDataChannelMessage, sendOffer } from "./wrtc";
import { sendMessage } from "./ws";

const logger = createLeveledLogger("dom");
logger.debug("Hello from dom.ts %o", import.meta);

const sendBtn = <HTMLButtonElement | null>document.getElementById("send-btn");
const sendMsg = <HTMLTextAreaElement | null>document.getElementById("send-msg");

if (!sendBtn || !sendMsg) {
	throw new Error("Could not find send button or message input");
}

sendBtn.addEventListener("click", () => {
	sendMessage(sendMsg.value);
	sendMsg.value = "";
	console.log("Message sent:", sendMsg.value);
});

// UI
export function updateDiscoveredList() {
	const discoveredList = <HTMLUListElement | null>(
		document.querySelector(".discovered-clients")
	);
	if (!discoveredList) {
		throw new Error("Could not find discovered clients list");
	}

	console.log("Updating discovered list", DiscoveredList);

	const list = [];
	for (const id of DiscoveredList) {
		if (id === MYINFO.id) {
			continue;
		}
		const li = document.createElement("li");
		li.innerHTML = `
      <div class="client-radio">
        <label for="${id}">${id}</label>
        <input type="radio" id="${id}" name="client-radio-input" value="${id}">
      </div>
    `;
		list.push(li);
	}

	discoveredList.replaceChildren(...list);
}

// WebRTC

// get peer
function getPeerRadio() {
	const selectedRadio = <HTMLInputElement | null>(
		document.querySelector('input[name="client-radio-input"]:checked')
	);

	if (!selectedRadio) {
		throw new Error("No clients selected");
	}

	return selectedRadio.value;
}

// send offer
const sendOfferBtn = <HTMLButtonElement | null>(
	document.querySelector(".send-offer-btn")
);

if (!sendOfferBtn) {
	throw new Error("Could not find send offer button");
}

sendOfferBtn.addEventListener("click", async (event) => {
	event.preventDefault();
	const peer = getPeerRadio();
	await sendOffer(peer);

	console.log("Send offer to", peer);
});

// RTC msg

const sendRtcMsg = <HTMLButtonElement | null>(
	document.querySelector(".send-rtc-msg")
);
const rtcInput = <HTMLTextAreaElement | null>(
	document.querySelector(".rtc-input")
);
if (!sendRtcMsg || !rtcInput) {
	throw new Error("Could not find send RTC message button");
}

sendRtcMsg.addEventListener("click", async (event) => {
	event.preventDefault();
	sendDataChannelMessage(rtcInput.value);
	rtcInput.value = "";
});

export function updateReceivedMsg(msg: string) {
	const rtcReceivedMsg = <HTMLPreElement | null>(
		document.querySelector(".rtc-received-msg")
	);
	if (!rtcReceivedMsg) {
		throw new Error("Could not find RTC received message element");
	}
	rtcReceivedMsg.textContent = msg;
}
