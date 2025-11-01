'use strict';
/**
 * Simple logger utility for the agents package
 * In production, this could be replaced with winston or another logging library
 */
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.logger = void 0;
var Logger = /** @class */ (function () {
  function Logger() {}
  Logger.prototype.shouldLog = function (_level) {
    var nodeEnv = process.env['NODE_ENV'];
    if (nodeEnv === 'test') {
      return false; // Don't log during tests
    }
    return true;
  };
  Logger.prototype.error = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }
    if (this.shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error.apply(
        console,
        __spreadArray(['[ChatAgent Error] '.concat(message)], args, false)
      );
    }
  };
  Logger.prototype.warn = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn.apply(
        console,
        __spreadArray(['[ChatAgent Warn] '.concat(message)], args, false)
      );
    }
  };
  Logger.prototype.info = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info.apply(
        console,
        __spreadArray(['[ChatAgent Info] '.concat(message)], args, false)
      );
    }
  };
  Logger.prototype.debug = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }
    if (this.shouldLog('debug') && process.env['NODE_ENV'] === 'development') {
      // eslint-disable-next-line no-console
      console.debug.apply(
        console,
        __spreadArray(['[ChatAgent Debug] '.concat(message)], args, false)
      );
    }
  };
  return Logger;
})();
exports.logger = new Logger();
