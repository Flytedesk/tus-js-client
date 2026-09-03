import { readable as isNodeReadableStream } from 'is-stream';
export class FetchHttpStack {
    constructor({ timeout } = {}) {
        this._timeout = timeout;
    }
    createRequest(method, url) {
        return new FetchRequest(method, url, this._timeout);
    }
    getName() {
        return 'FetchHttpStack';
    }
}
class FetchRequest {
    constructor(method, url, timeout) {
        this._headers = {};
        this._controller = new AbortController();
        this._method = method;
        this._url = url;
        this._timeout = timeout;
    }
    getMethod() {
        return this._method;
    }
    getURL() {
        return this._url;
    }
    setHeader(header, value) {
        this._headers[header] = value;
    }
    getHeader(header) {
        return this._headers[header];
    }
    setProgressHandler(_progressHandler) {
        // The Fetch API currently does not expose a way to track upload progress.
    }
    async send(body) {
        if (isNodeReadableStream(body)) {
            throw new Error('Using a Node.js readable stream as HTTP request body is not supported using the Fetch API HTTP stack.');
        }
        const deadline = this._startDeadline();
        try {
            const res = await fetch(this._url, {
                method: this._method,
                headers: this._headers,
                body,
                signal: this._controller.signal,
            });
            const resBody = await res.text();
            return new FetchResponse(res, resBody);
        }
        finally {
            // Always cleared: a deadline that outlives its request would abort a
            // signal with nothing behind it, and keep a timer alive with it.
            clearTimeout(deadline);
        }
    }
    _startDeadline() {
        if (this._timeout == null) {
            return undefined;
        }
        return setTimeout(() => {
            this._controller.abort(new DOMException('Request timed out', 'TimeoutError'));
        }, this._timeout);
    }
    abort() {
        // Note: When abort() is called, the fetch() promise rejects with an Error of type DOMException, with name AbortError.
        this._controller.abort();
        return Promise.resolve();
    }
    getUnderlyingObject() {
        // In the Fetch API, there is no object representing the request.
        return undefined;
    }
}
class FetchResponse {
    constructor(res, body) {
        this._res = res;
        this._body = body;
    }
    getStatus() {
        return this._res.status;
    }
    getHeader(header) {
        return this._res.headers.get(header) || undefined;
    }
    getBody() {
        return this._body;
    }
    getUnderlyingObject() {
        return this._res;
    }
}
//# sourceMappingURL=FetchHttpStack.js.map