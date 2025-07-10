const EventEmitter = require('events');

class AppEventEmitter extends EventEmitter {}

const eventBus = new AppEventEmitter();

module.exports = eventBus;