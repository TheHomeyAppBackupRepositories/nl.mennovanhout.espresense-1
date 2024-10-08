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
        this.timers = {};
        this.connectionLosTimeInSeconds = 30;
    }
    async onInit() {
        this.log('MyDevice has been initialized');
        // MQTT
        this.client.subscribe(`espresense/rooms/${this.getData().id}/#`);
        this.client.subscribe('espresense/devices/#');
        this.client.on('message', this.messageReceived.bind(this));
        // Flows
        this.whenDeviceIsCloserThanXMetersCard = this.homey.flow.getDeviceTriggerCard('when-device-is-closer-than-x-meters');
        this.whenDeviceIsCloserThanXMetersCard.registerArgumentAutocompleteListener('deviceId', this.deviceAutocompleteListener.bind(this));
        this.whenDeviceIsCloserThanXMetersCard.registerRunListener(async (args, state) => {
            return state.distance < args.distance && args.deviceId.name === state.deviceId;
        });
        this.whenDeviceIsFurtherThanXMetersCard = this.homey.flow.getDeviceTriggerCard('when-device-is-further-than-x-meters');
        this.whenDeviceIsFurtherThanXMetersCard.registerArgumentAutocompleteListener('deviceId', this.deviceAutocompleteListener.bind(this));
        this.whenDeviceIsFurtherThanXMetersCard.registerRunListener(async (args, state) => {
            return state.distance > args.distance && args.deviceId.name === state.deviceId;
        });
    }
    async messageReceived(topic, message) {
        if (topic.toString().includes(`espresense/rooms/${this.getData().id}/max_distance`)) {
            await this.setCapabilityValue('espresense_max_distance_capability', parseFloat(message.toString()));
        }
        if (topic.toString().includes(`espresense/rooms/${this.getData().id}/status`)) {
            await this.setCapabilityValue('espresense_status_capability', message.toString());
        }
        if (topic.toString().includes('devices') && topic.toString().includes(this.getData().id)) {
            const espresenseId = topic.toString().replace('espresense/devices/', '').split('/')[0];
            // Get device name
            const deviceName = this.homey.settings.get('mapping')[espresenseId];
            if (!deviceName) {
                return;
            }
            if (!this.hasCapability(`espresense_distance_capability.${deviceName}`)) {
                await this.addCapability(`espresense_distance_capability.${deviceName}`);
            }
            const json = JSON.parse(message.toString());
            await this.setCapabilityValue(`espresense_distance_capability.${deviceName}`, json.distance);
            await this.setCapabilityOptions(`espresense_distance_capability.${deviceName}`, { title: { en: `${deviceName}` } });
            // this.log(deviceName);
            // this.log(json.distance);
            // Trigger flow cards
            await this.whenDeviceIsCloserThanXMetersCard?.trigger(this, {
                'device-distance': json.distance,
            }, {
                deviceId: deviceName,
                distance: json.distance,
            });
            await this.whenDeviceIsFurtherThanXMetersCard?.trigger(this, {
                'device-distance': json.distance,
            }, {
                deviceId: deviceName,
                distance: json.distance,
            });
            // Add timer for losing connection
            if (this.timers[deviceName]) {
                clearTimeout(this.timers[deviceName]);
            }
            this.timers[deviceName] = setTimeout(async () => {
                // Remove from object
                delete this.timers[deviceName];
                // Run further card
                await this.whenDeviceIsFurtherThanXMetersCard?.trigger(this, {
                    'device-distance': json.distance,
                }, {
                    deviceId: deviceName,
                    distance: this.getCapabilityValue('espresense_max_distance_capability'),
                });
            }, this.connectionLosTimeInSeconds * 1000);
        }
    }
    async deviceAutocompleteListener(query, args) {
        const names = (Object.values(this.homey.settings.get('mapping')) || []).map((name) => {
            return {
                name,
            };
        });
        return names.filter((result) => result.name.toLowerCase().includes(query.toLowerCase()));
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
