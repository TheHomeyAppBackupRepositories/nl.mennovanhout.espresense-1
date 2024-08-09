"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const homey_1 = __importDefault(require("homey"));
class MyDriver extends homey_1.default.Driver {
    async onInit() {
        this.log('MyDriver has been initialized');
    }
    onPairListDevices() {
        const mapping = this.homey.settings.get('mapping');
        return Promise.resolve(Object.values(mapping).map((device) => ({
            name: device,
            data: {
                id: device,
            },
        })));
    }
}
module.exports = MyDriver;
