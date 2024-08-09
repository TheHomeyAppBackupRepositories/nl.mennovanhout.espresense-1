"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
class MyDevice extends homey_1.default.Device {
    constructor() {
        super(...arguments);
        // @ts-ignore
        this.client = this.homey.app.client;
        this.myCode = '';
    }
    async onInit() {
        this.log('ESPresense beacon been initialized');
        const mapping = this.homey.settings.get('mapping');
        this.myCode = Object.keys(mapping).find((key) => mapping[key] === this.getData().id) ?? '';
        this.client.subscribe('espresense/devices/#');
        this.client.on('message', this.messageReceived.bind(this));
    }
    async messageReceived(topic, message) {
        if (!topic.toString().includes('devices') || !topic.toString().includes(this.myCode)) {
            return;
        }
        const json = JSON.parse(message.toString());
        this.log(topic);
        this.log(message);
    }
    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({ oldSettings, newSettings, changedKeys, }) {
        this.log('MyDevice settings where changed');
    }
    async onDeleted() {
        this.client.off('message', this.messageReceived);
        this.client.unsubscribe(`espresense/rooms/${this.getData().id}/#`);
        this.client.unsubscribe('espresense/devices/#');
    }
    onUninit() {
        this.client.off('message', this.messageReceived);
        this.client.unsubscribe(`espresense/rooms/${this.getData().id}/#`);
        this.client.unsubscribe('espresense/devices/#');
        return super.onUninit();
    }
}
module.exports = MyDevice;
