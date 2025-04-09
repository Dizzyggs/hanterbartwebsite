"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var node_fetch_1 = __importDefault(require("node-fetch"));
var handler = function (event, context) { return __awaiter(void 0, void 0, void 0, function () {
    var headers, apiKey, serverId, channelId, _a, eventData, response, responseText, data, _b, eventId, action, eventResponse, eventData_1, eventsResponse, eventsData, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log('Function invoked with event:', {
                    httpMethod: event.httpMethod,
                    path: event.path,
                    queryStringParameters: event.queryStringParameters,
                    body: event.body ? JSON.parse(event.body) : null
                });
                headers = {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                };
                // Handle preflight requests
                if (event.httpMethod === 'OPTIONS') {
                    return [2 /*return*/, {
                            statusCode: 200,
                            headers: headers,
                            body: '',
                        }];
                }
                apiKey = process.env.RAIDHELPER_API_KEY;
                serverId = process.env.DISCORD_SERVER_ID;
                channelId = process.env.DISCORD_CHANNEL_ID;
                console.log('Environment variables check:', {
                    hasApiKey: !!apiKey,
                    hasServerId: !!serverId,
                    hasChannelId: !!channelId,
                    nodeEnv: process.env.NODE_ENV
                });
                if (!apiKey || !serverId || !channelId) {
                    console.error('Missing required environment variables');
                    return [2 /*return*/, {
                            statusCode: 500,
                            headers: headers,
                            body: JSON.stringify({
                                error: 'Missing configuration',
                                details: {
                                    hasApiKey: !!apiKey,
                                    hasServerId: !!serverId,
                                    hasChannelId: !!channelId
                                }
                            }),
                        }];
                }
                _c.label = 1;
            case 1:
                _c.trys.push([1, 13, , 14]);
                _a = event.httpMethod;
                switch (_a) {
                    case 'POST': return [3 /*break*/, 2];
                    case 'GET': return [3 /*break*/, 5];
                }
                return [3 /*break*/, 12];
            case 2:
                eventData = JSON.parse(event.body || '{}');
                console.log('Creating event with data:', eventData);
                return [4 /*yield*/, (0, node_fetch_1.default)("https://raid-helper.dev/api/v2/servers/".concat(serverId, "/channels/").concat(channelId, "/event"), {
                        method: 'POST',
                        headers: {
                            'Authorization': apiKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(eventData),
                    })];
            case 3:
                response = _c.sent();
                return [4 /*yield*/, response.text()];
            case 4:
                responseText = _c.sent();
                console.log('RaidHelper API raw response:', responseText);
                data = void 0;
                try {
                    data = JSON.parse(responseText);
                }
                catch (e) {
                    console.error('Failed to parse RaidHelper API response:', e);
                    throw new Error('Invalid response from RaidHelper API');
                }
                console.log('RaidHelper API parsed response:', data);
                if (!response.ok) {
                    throw new Error(data.error || data.message || "Failed to create event: ".concat(response.statusText));
                }
                return [2 /*return*/, {
                        statusCode: 200,
                        headers: headers,
                        body: JSON.stringify(data),
                    }];
            case 5:
                _b = event.queryStringParameters || {}, eventId = _b.eventId, action = _b.action;
                if (!eventId) return [3 /*break*/, 8];
                return [4 /*yield*/, (0, node_fetch_1.default)("https://raid-helper.dev/api/v2/events/".concat(eventId), {
                        headers: {
                            'Authorization': apiKey,
                        },
                    })];
            case 6:
                eventResponse = _c.sent();
                return [4 /*yield*/, eventResponse.json()];
            case 7:
                eventData_1 = _c.sent();
                if (!eventResponse.ok) {
                    throw new Error(eventData_1.error || eventData_1.message || 'Failed to fetch event');
                }
                return [2 /*return*/, {
                        statusCode: 200,
                        headers: headers,
                        body: JSON.stringify(eventData_1),
                    }];
            case 8:
                if (!(action === 'listEvents')) return [3 /*break*/, 11];
                return [4 /*yield*/, (0, node_fetch_1.default)("https://raid-helper.dev/api/v2/servers/".concat(serverId, "/events"), {
                        headers: {
                            'Authorization': apiKey,
                        },
                    })];
            case 9:
                eventsResponse = _c.sent();
                return [4 /*yield*/, eventsResponse.json()];
            case 10:
                eventsData = _c.sent();
                if (!eventsResponse.ok) {
                    throw new Error(eventsData.error || eventsData.message || 'Failed to fetch events');
                }
                return [2 /*return*/, {
                        statusCode: 200,
                        headers: headers,
                        body: JSON.stringify(eventsData),
                    }];
            case 11: return [3 /*break*/, 12];
            case 12: return [2 /*return*/, {
                    statusCode: 404,
                    headers: headers,
                    body: JSON.stringify({ error: 'Not found' }),
                }];
            case 13:
                error_1 = _c.sent();
                console.error('RaidHelper error:', error_1);
                return [2 /*return*/, {
                        statusCode: 500,
                        headers: headers,
                        body: JSON.stringify({
                            error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                            details: error_1 instanceof Error ? error_1.stack : undefined
                        }),
                    }];
            case 14: return [2 /*return*/];
        }
    });
}); };
exports.handler = handler;
