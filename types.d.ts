interface Options {
  security: boolean
  debug: true
  closeOnParseMessage: boolean
  heartbeatDelay: number
}

type CallId = string

type MessageTypes = {
  Welcome: number
  Call: number
  CallResult: number
  CallError: number
  Subscribe: number
  Unsubscribe: number
  Event: number
  Heartbeat: number
}

type MessageType = MessageTypes[keyof MessageTypes]

type Message = [MessageType, ...unknown[]]

type CallMessageArguments = DataValues

type Uri = string
type Result = string

type CallMessage = [MessageType.Call, CallId, Uri, CallMessageArguments]
type CallResultMessage = [MessageType.CallResult, CallId, Result]
type CallErrorMessage = [MessageType.CallError, CallId, string, string, string]


interface EventData {
  [key: string]: DataValue | EventData
}

type DataValue = string | number | boolean
type DataValues = DataValue[]

type SubscribeMessage = [MessageType.Subscribe, Uri]
type SubscribeResultMessage = [MessageType.Subscribe, Uri, DataValue]

type EventMessage = [MessageType.Event, Uri, string]
type EventResultMessage = [MessageType.Event, Uri, DataValues]

type HeartbeatInterval = (handler: TimerHandler, timeout?: number) => void

type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>
} : T

type InvoicePromise = {
  resolve: (value: Message) => void
  reject: (value: Message) => void
}