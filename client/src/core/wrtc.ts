import { MYINFO } from "../utils/contant";
import { updateReceivedMsg } from "./dom";
import { sendMessage } from "./ws";
import debug from "debug";


const logger = debug("wrtc");
logger("Hello from wrtc.ts");


export let peerB = "";

export function setPeerB(id: string) {
	peerB = id;
	console.log("peerB", peerB);
}

// client/src/utils/wrtc.ts
const pc = new RTCPeerConnection({
	iceServers: [],
});

const dataChannel = createDataChannel();

// 监听对面的 datachannel
pc.ondatachannel = (event) => {
	const dataChannelByPeer = event.channel;

	dataChannelByPeer.onmessage = (event) => {
		console.log("Received message from remote peer:", event.data);
		updateReceivedMsg(event.data);
	};
	dataChannelByPeer.onopen = () => {
		console.log("Data channel is opened by remote peer");
	};
	dataChannelByPeer.onclose = () => {
		console.log("Data channel is closed by remote peer");
	};
	dataChannelByPeer.onerror = (error) => {
		console.error("Data channel error:", error);
	};
};

pc.onicecandidate = (event) => {
	if (event.candidate) {
		console.log("ICE candidate:", event.candidate);
		sendMessage(
			JSON.stringify({
				type: "ice",
				from: MYINFO.id,
				to: peerB,
				data: event.candidate,
			}),
		);
	}
};

pc.oniceconnectionstatechange = (event) => {
	console.log("ICE connection state changed:", pc.iceConnectionState);
};

pc.onicecandidateerror = (event) => {
	console.log("ICE candidate error:", event);
};

export async function sendOffer(id: string) {
	// 示例：在调用sendOffer前获取媒体流
	// const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
	// stream.getTracks().forEach(track => pc.addTrack(track, stream));

	const offer = await pc.createOffer();
	await pc.setLocalDescription(offer);
	setPeerB(id);
	sendMessage(
		JSON.stringify({
			type: "offer",
			from: MYINFO.id,
			to: peerB,
			data: offer,
		}),
	);
}

export async function setRemoteDescription(offer: RTCSessionDescriptionInit) {
	console.log("Setting remote description:", offer);
	pc.setRemoteDescription(offer);
}

export async function sendAnswer() {
	const answer = await pc.createAnswer();
	await pc.setLocalDescription(answer);

	sendMessage(
		JSON.stringify({
			type: "answer",
			from: MYINFO.id,
			to: peerB,
			data: answer,
		}),
	);
}

export async function addIceCandidate(candidate: RTCIceCandidateInit) {
	// check remoteDescription
	if (!pc.remoteDescription) {
		console.log("RemoteDescription is not set, can not add ICE candidate");
		return;
	}

	await pc.addIceCandidate(candidate);
}

// dadaChannel
function createDataChannel() {
	const dataChannel = pc.createDataChannel(`${MYINFO.id}-${peerB}`);
	dataChannel.onopen = () => {
		console.log("Data channel is open");
	};
	dataChannel.onclose = () => {
		console.log("Data channel is closed");
	};
	dataChannel.onmessage = (event) => {
		console.log("Received message from data channel:", event.data);
	};
	dataChannel.onerror = (error) => {
		console.error("Data channel error:", error);
	};

	return dataChannel;
}

export function sendDataChannelMessage(message: string) {
	if (dataChannel.readyState === "open") {
		dataChannel.send(message);
		console.log(`Sent message on "${dataChannel.label}":`, message);
	} else {
		console.log(`DataChannel "${dataChannel.label}" is not open.`);
	}
}
