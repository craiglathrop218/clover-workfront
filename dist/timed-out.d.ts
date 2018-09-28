/// <reference types="node" />
import http from "http";
export declare class TimedOut {
    static applyToRequest(req: TimedOut.MyClientRequest, time: number): TimedOut.MyClientRequest;
}
export declare namespace TimedOut {
    interface MyClientRequest extends http.ClientRequest {
        timeoutTimer: number;
    }
}
