"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
class ESPresenseDriver extends homey_1.default.Driver {
    async onInit() {
        this.log('ESPresenseDriver has been initialized');
    }
    async onPair(session) {
        session.setHandler('showView', async (view) => {
            if (view === 'loading') {
                // @ts-ignore
                const { client } = this.homey.app;
                if (!client.connected) {
                    this.log('MQTT is not connected');
                    await session.showView('mqtt_error');
                    return;
                }
                // Show a specific view by ID
                await session.showView('list_devices');
            }
        });
        session.setHandler('list_devices', this.onPairListDevices.bind(this));
    }
    onPairListDevices() {
        // @ts-ignore
        const { rooms } = this.homey.app;
        return Promise.resolve(rooms.map((room) => ({
            name: room,
            data: {
                id: room,
            },
        })));
    }
}
module.exports = ESPresenseDriver;
