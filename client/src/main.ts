import "./style.css";

import "./core/ws";
import "./core/dom";
import "./core/wrtc";

import "./utils/eruda";


import debug from "debug";
localStorage.debug = "*";
const logger = debug("main");
logger("Hello from main");
