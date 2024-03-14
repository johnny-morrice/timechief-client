import { TimechiefClient } from "../../timechiefclient"

class DeviceDashboardSectionService {
    getDevices() {
        const limit = 50;
        return TimechiefClient.default.listDevices(limit);
    }
}

class FakeDeviceDashboardSectionService {
    getDevices() {
        return new Promise((resolve, reject) => {
            const devices = [{
                nickname: "My device",
                location: "Edinburgh"
            }];
            resolve(devices);
        });
    }
}

export const Service = new DeviceDashboardSectionService();