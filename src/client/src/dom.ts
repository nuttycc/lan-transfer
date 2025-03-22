import { clients, dataChannel, sendOffer } from "./webrtc";

const sendOfferBtn = <HTMLButtonElement | null>(
	document.querySelector(".send-offer")
);
const sendMsgBtn = <HTMLButtonElement | null>(
	document.querySelector(".send-msg")
);
const msgInput = <HTMLTextAreaElement | null>document.querySelector("textarea");
const receivedMsg = <HTMLTextAreaElement | null>(
	document.querySelector(".received-msg")
);

if (!sendOfferBtn || !sendMsgBtn || !msgInput || !receivedMsg)
	throw new Error("Not found send-offer button.");

sendOfferBtn.addEventListener("click", () => {
	console.log("send-offer button clicked.");
	sendOffer(...clients);
});

sendMsgBtn.addEventListener("click", () => {
	console.log("send-msg button clicked.");
	dataChannel.send(msgInput.value);
});

msgInput.addEventListener("input", () => {
	console.log("msgInput changed.");
});

export function updateReceivedMsg(msg: string) {
	const receivedMsg = <HTMLTextAreaElement | null>(
		document.querySelector(".received-msg")
	);
	if (!receivedMsg) throw new Error("Not found received-msg textarea.");
	receivedMsg.value = msg;
}
