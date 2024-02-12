"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_ts_1 = require("./utils.ts");
var Wamper = /** @class */ (function () {
    function Wamper(socketUrl, options, messageTypes) {
        var _this = this;
        this._invoices = new Invoices();
        this._heartbeat = {
            increment: 0,
            interval: {}
        };
        this._options = __assign(__assign({}, Wamper.options), options);
        this._messageTypes = __assign(__assign({}, Wamper.messageTypes), messageTypes);
        this._ws = new WebSocket("".concat(this._options.security ? 'wss' : 'ws', "://").concat(socketUrl));
        this.connection = new Promise(function (resolve, reject) {
            _this._ws.onopen = function () {
                _this._debug('The socket is open');
                _this.setHeartbeat();
                resolve(_this);
            };
            _this._ws.onmessage = function (event) {
                _this._parseMessage(event.data);
            };
            _this._ws.onerror = function (error) {
                _this._debug('Error opening the socket', 'error');
                reject(error);
            };
        });
    }
    Wamper.prototype._parseMessage = function (message) {
        var data;
        try {
            data = JSON.parse(message);
        }
        catch (e) {
            this._debug(Wamper.logMessages.parsingError);
            if (this._options.closeOnParseMessage) {
                this.close();
            }
            return;
        }
        var type = data[0];
        switch (type) {
            case Wamper.messageTypes.CallResult:
                this._callResult(data);
                break;
            case Wamper.messageTypes.CallError:
                this._callError(data);
                break;
            case Wamper.messageTypes.Subscribe:
                this._subscribeResult(data);
                break;
            case Wamper.messageTypes.Event:
                this._eventResult(data);
                break;
        }
    };
    Wamper.prototype._sendMessage = function (message, subscribeKey) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connection];
                    case 1:
                        _a.sent();
                        this._ws.send(JSON.stringify(message));
                        if (subscribeKey) {
                            return [2 /*return*/, this._invoices.create(subscribeKey)];
                        }
                        else {
                            return [2 /*return*/, Promise.resolve()];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Wamper.prototype.call = function (uri) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var id = (0, utils_ts_1.hash)();
        var message = __spreadArray([this._messageTypes.Call, id, uri], args, true);
        return this._sendMessage(message, id);
    };
    Wamper.prototype._callResult = function (data) {
        var id = data[1];
        var invoice = this._invoices.get(id);
        if (!invoice && this._options.debug) {
            this._debug('The message was not found with this key', 'error');
        }
        invoice.resolve(data);
        this._invoices.delete(id);
    };
    Wamper.prototype._callError = function (data) {
        var id = data[1];
        var invoice = this._invoices.get(id);
        if (!invoice && this._options.debug) {
            this._debug('The message was not found with this key', 'error');
        }
        invoice.reject(data);
        this._invoices.delete(id);
    };
    Wamper.prototype.subscribe = function (uri) {
        if (this._invoices.has(uri) && this._options.debug) {
            this._debug('A subscription with such parameters already exists', 'warn');
        }
        var message = [this._messageTypes.Subscribe, uri];
        return this._sendMessage(message, uri);
    };
    Wamper.prototype._subscribeResult = function (data) {
        var uri = data[1];
        if (!this._invoices.has(uri) && this._options.debug) {
            this._debug('A subscription with such parameters already not exists', 'warn');
            return;
        }
        var invoice = this._invoices.get(uri);
        return invoice.resolve(data);
    };
    Wamper.prototype.unsubscribe = function (uri) {
        return __awaiter(this, void 0, void 0, function () {
            var message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._invoices.has(uri)) {
                            this._debug('');
                            return [2 /*return*/];
                        }
                        message = [this._messageTypes.Unsubscribe, uri];
                        return [4 /*yield*/, this._sendMessage(message, uri)];
                    case 1:
                        _a.sent();
                        this._invoices.delete(uri);
                        return [2 /*return*/];
                }
            });
        });
    };
    Wamper.prototype.event = function (uri, data) {
        var message = [this._messageTypes.Event, data];
        return this._sendMessage(message, uri);
    };
    Wamper.prototype._eventResult = function (data) {
        var id = data[1];
        var invoice = this._invoices.get(id);
        if (!invoice && this._options.debug) {
            this._debug('The message was not found with this key', 'error');
        }
        invoice.resolve(data);
    };
    Wamper.prototype._sendHeartbeat = function () {
        return this._sendMessage([this._messageTypes.Heartbeat, this._heartbeat.increment++]);
    };
    Wamper.prototype.setHeartbeat = function () {
        var _this = this;
        if (this._options.heartbeatDelay < 0)
            return;
        this._heartbeat.interval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._sendHeartbeat()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }, this._options.heartbeatDelay * 1000);
    };
    Wamper.prototype.close = function () {
        if (this._heartbeat.interval)
            clearInterval(this._heartbeat.interval);
        this._ws.close();
    };
    Wamper.prototype._debug = function (message, level) {
        if (level === void 0) { level = 'log'; }
        if (this._options.debug)
            console[level](message);
    };
    Wamper.options = {
        security: true,
        debug: true,
        closeOnParseMessage: false,
        heartbeatDelay: 30,
    };
    Wamper.messageTypes = {
        Welcome: 0,
        Call: 2,
        CallResult: 3,
        CallError: 4,
        Subscribe: 5,
        Unsubscribe: 6,
        Event: 8,
        Heartbeat: 20
    };
    Wamper.logMessages = {
        parsingError: 'Error parsing the message'
    };
    return Wamper;
}());
exports.default = Wamper;
var Invoices = /** @class */ (function (_super) {
    __extends(Invoices, _super);
    function Invoices() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Invoices.prototype.create = function (key) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var promise = { resolve: resolve, reject: reject };
            _this.set(key, promise);
        });
    };
    return Invoices;
}(Map));
