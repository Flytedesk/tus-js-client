import { readable as isNodeReadableStream } from 'is-stream'
import type {
  HttpProgressHandler,
  HttpRequest,
  HttpResponse,
  HttpStack,
  SliceType,
} from '../options.js'

export interface FetchHttpStackOptions {
  /**
   * Milliseconds to wait for a request to complete before it is aborted. The
   * Fetch API has no timeout of its own, so without this a request that stalls
   * without erroring is never resolved nor rejected. Defaults to no timeout.
   *
   * A request cancelled this way rejects with a `TimeoutError` DOMException,
   * which is distinguishable from the `AbortError` that `abort()` produces.
   */
  timeout?: number
}

export class FetchHttpStack implements HttpStack {
  private _timeout?: number

  constructor({ timeout }: FetchHttpStackOptions = {}) {
    this._timeout = timeout
  }

  createRequest(method: string, url: string) {
    return new FetchRequest(method, url, this._timeout)
  }

  getName() {
    return 'FetchHttpStack'
  }
}

class FetchRequest implements HttpRequest {
  private _method: string
  private _url: string
  private _headers: Record<string, string> = {}
  private _controller = new AbortController()
  private _timeout?: number

  constructor(method: string, url: string, timeout?: number) {
    this._method = method
    this._url = url
    this._timeout = timeout
  }

  getMethod(): string {
    return this._method
  }

  getURL(): string {
    return this._url
  }

  setHeader(header: string, value: string): void {
    this._headers[header] = value
  }

  getHeader(header: string) {
    return this._headers[header]
  }

  setProgressHandler(_progressHandler: HttpProgressHandler): void {
    // The Fetch API currently does not expose a way to track upload progress.
  }

  async send(body?: SliceType): Promise<FetchResponse> {
    if (isNodeReadableStream(body)) {
      throw new Error(
        'Using a Node.js readable stream as HTTP request body is not supported using the Fetch API HTTP stack.',
      )
    }

    const deadline = this._startDeadline()

    try {
      const res = await fetch(this._url, {
        method: this._method,
        headers: this._headers,
        body,
        signal: this._controller.signal,
      })

      const resBody = await res.text()
      return new FetchResponse(res, resBody)
    } finally {
      // Always cleared: a deadline that outlives its request would abort a
      // signal with nothing behind it, and keep a timer alive with it.
      clearTimeout(deadline)
    }
  }

  private _startDeadline(): ReturnType<typeof setTimeout> | undefined {
    if (this._timeout == null) {
      return undefined
    }

    return setTimeout(() => {
      this._controller.abort(new DOMException('Request timed out', 'TimeoutError'))
    }, this._timeout)
  }

  abort(): Promise<void> {
    // Note: When abort() is called, the fetch() promise rejects with an Error of type DOMException, with name AbortError.
    this._controller.abort()
    return Promise.resolve()
  }

  getUnderlyingObject(): undefined {
    // In the Fetch API, there is no object representing the request.
    return undefined
  }
}

class FetchResponse implements HttpResponse {
  private _res: Response
  private _body: string

  constructor(res: Response, body: string) {
    this._res = res
    this._body = body
  }

  getStatus(): number {
    return this._res.status
  }

  getHeader(header: string): string | undefined {
    return this._res.headers.get(header) || undefined
  }

  getBody(): string {
    return this._body
  }

  getUnderlyingObject(): Response {
    return this._res
  }
}
