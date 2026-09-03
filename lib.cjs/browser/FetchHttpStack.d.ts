import type { HttpProgressHandler, HttpRequest, HttpResponse, HttpStack, SliceType } from '../options.js';
export interface FetchHttpStackOptions {
    /**
     * Milliseconds to wait for a request to complete before it is aborted. The
     * Fetch API has no timeout of its own, so without this a request that stalls
     * without erroring is never resolved nor rejected. Defaults to no timeout.
     *
     * A request cancelled this way rejects with a `TimeoutError` DOMException,
     * which is distinguishable from the `AbortError` that `abort()` produces.
     */
    timeout?: number;
}
export declare class FetchHttpStack implements HttpStack {
    private _timeout?;
    constructor({ timeout }?: FetchHttpStackOptions);
    createRequest(method: string, url: string): FetchRequest;
    getName(): string;
}
declare class FetchRequest implements HttpRequest {
    private _method;
    private _url;
    private _headers;
    private _controller;
    private _timeout?;
    constructor(method: string, url: string, timeout?: number);
    getMethod(): string;
    getURL(): string;
    setHeader(header: string, value: string): void;
    getHeader(header: string): string;
    setProgressHandler(_progressHandler: HttpProgressHandler): void;
    send(body?: SliceType): Promise<FetchResponse>;
    private _startDeadline;
    abort(): Promise<void>;
    getUnderlyingObject(): undefined;
}
declare class FetchResponse implements HttpResponse {
    private _res;
    private _body;
    constructor(res: Response, body: string);
    getStatus(): number;
    getHeader(header: string): string | undefined;
    getBody(): string;
    getUnderlyingObject(): Response;
}
export {};
