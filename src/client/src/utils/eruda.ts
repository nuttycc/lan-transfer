import eruda from "eruda";
import { isMobile } from "./check";

if (isMobile()) {
	activeEruda();
}

//----
//----
function activeEruda() {
	const erudaX = <HTMLDivElement | null>document.querySelector(".eruda-x");
	if (!erudaX) {
		throw new Error("eruda-x not found");
	}
	const script = document.createElement("script");
	script.src = "https://cdn.jsdelivr.net/npm/eruda";

	script.onload = () => {
		eruda.init({
			container: erudaX,
		});
		// @ts-ignore
		eruda.position({ x: "90dvw", y: "90dvh" });
	};
	document.body.append(script);
}
