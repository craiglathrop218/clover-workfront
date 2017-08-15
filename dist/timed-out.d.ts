/// <reference types="node" />
import { ClientRequest } from "http";
export declare class TimedOut {
    static applyToRequest(req: TimedOut.MyClientRequest, time: number): TimedOut.MyClientRequest;
}
export declare namespace TimedOut {
    interface MyClientRequest extends ClientRequest {
        timeoutTimer: number;
    }
}
