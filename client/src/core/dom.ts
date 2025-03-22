import { DiscoveredList, MYINFO } from "../utils/contant";
import { createLeveledLogger } from "../utils/logger";
import { sendFiles } from "../utils/wrtc.ts/file";
import { sendOffer } from "../utils/wrtc.ts/handler";
import { sendDataChannelMessage } from "../utils/wrtc.ts/msg";

const logger = createLeveledLogger("[dom]");
logger.debug("Initializing dom module...");

// UI
export function updateDiscoveredList() {
	const discoveredList = <HTMLUListElement | null>(
		document.querySelector(".discovered-clients")
	);
	if (!discoveredList) {
		throw new Error("Could not find discovered clients list");
	}

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

// Send file

const sendFileBtn = <HTMLButtonElement | null>(
	document.querySelector(".send-file")
);
const fileInput = <HTMLInputElement | null>(
	document.querySelector(".file-input")
);
const fileName = <HTMLSpanElement | null>document.querySelector(".file-name");
if (!sendFileBtn || !fileInput || !fileName) {
	throw new Error("Could not find send file button");
}

fileInput.addEventListener("change", (event) => {
	event.preventDefault();
	fileName.textContent = fileInput.files?.[0]?.name || "Select File";
});

sendFileBtn.addEventListener("click", async (event) => {
	event.preventDefault();
	logger.debug("Send file to", fileInput.files);
	if (!fileInput.files || fileInput.files.length === 0) {
		throw new Error("No files selected");
	}
	sendFiles(fileInput.files);
});

// Display received files
export function displayReceivedFile(file: File) {
	const filesListContainer = <HTMLDivElement | null>(
		document.querySelector(".files-list")
	);

	if (!filesListContainer) {
		throw new Error("Could not find files list container");
	}

	// Create URL for the file
	const fileUrl = URL.createObjectURL(file);

	// Create file item container
	const fileItem = document.createElement("div");
	fileItem.className =
		"file-item flex flex-col gap-2 p-1 bg-gray-600 rounded mb-2";

	// File header with icon and info
	const fileHeader = document.createElement("div");
	fileHeader.className = "flex items-center gap-1";

	// Create icon based on file type
	const icon = document.createElement("span");
	const fileType = file.type.split("/")[0];
	let iconClass = "📄"; // Default document icon

	if (fileType === "image") {
		iconClass = "🖼️";
	} else if (fileType === "video") {
		iconClass = "🎬";
	} else if (fileType === "audio") {
		iconClass = "🔊";
	} else if (file.name.endsWith(".pdf")) {
		iconClass = "📑";
	} else if (file.name.endsWith(".zip") || file.name.endsWith(".rar")) {
		iconClass = "🗜️";
	}

	icon.textContent = iconClass;

	// File info
	const fileInfo = document.createElement("div");
	fileInfo.className = "flex-1";

	const fileName = document.createElement("div");
	fileName.className = "font-medium text-sm";
	fileName.textContent = file.name;

	const fileSize = document.createElement("div");
	fileSize.className = "text-xs text-gray-100";
	fileSize.textContent = formatFileSize(file.size);

	fileInfo.appendChild(fileName);
	fileInfo.appendChild(fileSize);

	// Download button
	const downloadLink = document.createElement("a");
	downloadLink.href = fileUrl;
	downloadLink.download = file.name;
	downloadLink.className =
		"download-btn bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600";
	downloadLink.textContent = "⬇️";
	downloadLink.setAttribute("role", "button");
	downloadLink.setAttribute("tabindex", "0");
	downloadLink.setAttribute("aria-label", `Download ${file.name}`);

	// Add keyboard handler for accessibility
	downloadLink.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			downloadLink.click();
		}
	});

	// Append elements to file header
	fileHeader.appendChild(icon);
	fileHeader.appendChild(fileInfo);
	fileHeader.appendChild(downloadLink);

	// Add file header to main container
	fileItem.appendChild(fileHeader);

	// Add preview for compatible file types
	if (canPreviewFile(file)) {
		const previewContainer = document.createElement("div");
		previewContainer.className = "file-preview mt-2 w-full";

		if (fileType === "image") {
			const img = document.createElement("img");
			img.src = fileUrl;
			img.className = "max-h-32 max-w-full rounded";
			img.alt = file.name;
			previewContainer.appendChild(img);
		} else if (fileType === "video") {
			const video = document.createElement("video");
			video.src = fileUrl;
			video.className = "max-h-32 max-w-full rounded";
			video.controls = true;
			previewContainer.appendChild(video);
		} else if (fileType === "audio") {
			const audio = document.createElement("audio");
			audio.src = fileUrl;
			audio.className = "w-full";
			audio.controls = true;
			previewContainer.appendChild(audio);
		} else if (file.type === "application/pdf") {
			const embedLink = document.createElement("a");
			embedLink.href = fileUrl;
			embedLink.target = "_blank";
			embedLink.className = "text-blue-600 text-xs hover:underline";
			embedLink.textContent = "View PDF";
			previewContainer.appendChild(embedLink);
		}

		fileItem.appendChild(previewContainer);
	}

	// Add to container
	filesListContainer.appendChild(fileItem);

	logger.info(`File displayed in UI: ${file.name}`);
}

// Helper function to check if file can be previewed
function canPreviewFile(file: File): boolean {
	const fileType = file.type.split("/")[0];
	return (
		fileType === "image" ||
		fileType === "video" ||
		fileType === "audio" ||
		file.type === "application/pdf"
	);
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
