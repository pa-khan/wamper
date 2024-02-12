import { hash } from './utils.ts'

export default class Wamper {
  connection: Promise<this>
  private _ws: WebSocket
  private _invoices: Invoices = new Invoices()
  private _options: Options
  private _heartbeat = {
    increment: 0,
    interval: {} as Timer
  }
  private _messageTypes: MessageTypes
  
  static options: Options = {
    security: true,
    debug: true,
    closeOnParseMessage: false,
    heartbeatDelay: 30,
  }
  
  static messageTypes: MessageTypes = {
    Welcome: 0,
    Call: 2,
    CallResult: 3,
    CallError: 4,
    Subscribe: 5,
    Unsubscribe: 6,
    Event: 8,
    Heartbeat: 20
  }
  
  /**
   * System messages when debug is enabled
   * @type {{socketOpen: string, socketError: string, parsingError: string, notFoundKey: string, subscribeExists: string, subscribeNotExists: string}}
   */
  static logMessages = {
    parsingError: 'Error parsing the message',
    socketOpen: 'The socket is open',
    socketError: 'Error opening the socket',
    notFoundKey: 'The message was not found with this key',
    subscribeExists: 'A subscription with such parameters already exists',
    subscribeNotExists: 'A subscription with such parameters already not exists',
  }
  
  constructor(socketUrl: string, options?: Partial<Options>, messageTypes?: Partial<MessageTypes>) {
    this._options = {
      ...Wamper.options,
      ...options
    }
    
    this._messageTypes = {
      ...Wamper.messageTypes,
      ...messageTypes
    }
    
    this._ws = new WebSocket(`${ this._options.security ? 'wss' : 'ws' }://${ socketUrl }`)
    
    this.connection = new Promise((resolve, reject) => {
      /**
       * When opening a socket
       */
      this._ws.onopen = () => {
        this._debug(Wamper.logMessages.socketOpen)
        
        this.setHeartbeat()
        
        resolve(this)
      }
      
      /**
       * Listening to messages
       * @param {MessageEvent} event
       */
      this._ws.onmessage = (event) => {
        this._parseMessage(event.data)
      }
      
      /**
       * When closing a socket
       * @param {Event} error
       */
      this._ws.onerror = (error) => {
        this._debug(Wamper.logMessages.socketError, 'error')
        reject(error)
      }
    })
  }
  
  /**
   * Parsing an incoming message for transmission to specific contexts
   * @param {string} message
   * @private
   */
  private _parseMessage(message: string) {
    let data: Message
    
    try {
      data = JSON.parse(message)
    } catch (e) {
      this._debug(Wamper.logMessages.parsingError)
      
      if (this._options.closeOnParseMessage) {
        this.close()
      }
      
      return
    }
    
    const [type] = data
    
    switch (type) {
      case Wamper.messageTypes.CallResult:
        this._callResult(data as CallResultMessage)
        break
      case Wamper.messageTypes.CallError:
        this._callError(data as CallErrorMessage)
        break
      case Wamper.messageTypes.Subscribe:
        this._subscribeResult(data as SubscribeResultMessage)
        break
      case Wamper.messageTypes.Event:
        this._eventResult(data as EventResultMessage)
        break
    }
  }
  
  /**
   * Sending a message
   * @param {Message} message
   * @param {string} subscribeKey
   * @returns {Promise<InvoicePromise | void>}
   * @private
   */
  private async _sendMessage(message: Message, subscribeKey?: string) {
    await this.connection
    
    this._ws.send(JSON.stringify(message))
    
    if (subscribeKey) {
      return this._invoices.create(subscribeKey)
    } else {
      return Promise.resolve()
    }
  }
  
  /**
   * Sending a message to an action call
   * @param {Uri} uri
   * @param {DataValue} args
   * @returns {Promise<InvoicePromise | void>}
   */
  call(uri: Uri, ...args: CallMessageArguments) {
    const id = hash()
    const message: Message = [this._messageTypes.Call, id, uri, ...args]
    
    return this._sendMessage(message, id)
  }
  
  
  _callResult(data: CallResultMessage) {
    const [, id] = data
    const invoice = this._invoices.get(id)
    
    if (!invoice && this._options.debug) {
      this._debug(Wamper.logMessages.notFoundKey, 'error')
    }
    
    invoice!.resolve(data)
    this._invoices.delete(id)
  }
  
  _callError(data: CallErrorMessage) {
    const [, id] = data
    const invoice = this._invoices.get(id)
    
    if (!invoice && this._options.debug) {
      this._debug(Wamper.logMessages.notFoundKey, 'error')
    }
    
    invoice!.reject(data)
    this._invoices.delete(id)
  }
  
  /**
   * Sending a subscription message
   * @param {Uri} uri
   * @returns {Promise<InvoicePromise | void>}
   */
  subscribe(uri: Uri) {
    if (this._invoices.has(uri) && this._options.debug) {
      this._debug(Wamper.logMessages.subscribeExists, 'warn')
    }
    
    const message: Message = [this._messageTypes.Subscribe, uri]
    
    return this._sendMessage(message, uri)
  }
  
  /**
   * Parsing the result of a subscription result message
   * @param {SubscribeResultMessage} data
   */
  _subscribeResult(data: SubscribeResultMessage) {
    const [, uri] = data
    
    if (!this._invoices.has(uri) && this._options.debug) {
      this._debug(Wamper.logMessages.subscribeNotExists, 'warn')
      
      return
    }
    
    const invoice = this._invoices.get(uri)
    
    return invoice!.resolve(data)
  }
  
  /**
   * Unsubscribe from an event
   * @param {Uri} uri
   * @returns {Promise<void>}
   */
  async unsubscribe(uri: Uri) {
    if (!this._invoices.has(uri)) {
      this._debug('')
      return
    }
    const message: Message = [this._messageTypes.Unsubscribe, uri]
    
    await this._sendMessage(message, uri)
    
    this._invoices.delete(uri)
  }
  
  /**
   * Sending an event
   * @param {Uri} uri
   * @param {EventData} data
   * @returns {Promise<InvoicePromise | void>}
   */
  event(uri: Uri, data: EventData) {
    const message: Message = [this._messageTypes.Event, data]
    
    return this._sendMessage(message, uri)
  }
  
  /**
   * Parsing successful event result
   * @param {EventResultMessage} data
   * @private
   */
  private _eventResult(data: EventResultMessage) {
    const [, id] = data
    const invoice = this._invoices.get(id)
    
    if (!invoice && this._options.debug) {
      this._debug(Wamper.logMessages.notFoundKey, 'error')
    }
    
    invoice!.resolve(data)
  }
  
  /**
   * Sending a ping
   * @returns {Promise<InvoicePromise | void>}
   * @private
   */
  private _sendHeartbeat() {
    return this._sendMessage([this._messageTypes.Heartbeat, this._heartbeat.increment++])
  }
  
  /**
   * Ping to the server with a specified parameter from the options
   */
  setHeartbeat() {
    if (this._options.heartbeatDelay < 0) return
    
    this._heartbeat.interval = setInterval(async() => {
      await this._sendHeartbeat()
    }, this._options.heartbeatDelay * 1000)
  }
  
  /**
   * Closing the channel and setting intervals
   * @private
   */
  private close() {
    if (this._heartbeat.interval) clearInterval(this._heartbeat.interval)
    
    this._ws.close()
  }
  
  /**
   * Interaction logging
   * @param {Error | string} message
   * @param {"log" | "warn" | "error"} level
   * @private
   */
  private _debug(message: Error | string, level: 'log' | 'warn' | 'error' = 'log') {
    if (this._options.debug) console[level](message)
  }
}

/**
 * Class for implementing response context
 */
class Invoices<T = InvoicePromise> extends Map<string, T> {
  create(key: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const promise: T = {resolve, reject} as T
      
      this.set(key, promise)
    })
  }
}