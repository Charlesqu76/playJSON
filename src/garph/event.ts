import { exitCode } from "process";

export const EVENT_MOVE = Symbol("move");
export const EVENT_DELETE = Symbol("delete");

// update key value text
// link or unlink
// add or remove keyvauleBox in objectBox
export const EVENT_UPDATE = Symbol("update");
export const EVENT_LINK = Symbol("link");
export const EVENT_UNLINK = Symbol("unlink");

// linklin
// keyvaluebox
// objectbox
export const EVENT_SELECT = Symbol("select");

// keyvaluebox
// objectbox
export const EVENT_DRAG = Symbol("drag");
