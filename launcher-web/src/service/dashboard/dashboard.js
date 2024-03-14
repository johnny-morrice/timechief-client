import { TimechiefClient } from "../timechiefclient";

function isLicenseValid(license) {
    const now = new Date();
    const validUntil = new Date(license.valid_until * 1000);
    return now <= validUntil;
}

const limit = 50;

class DashboardService {
    
        hasValidSubscription() {
            return TimechiefClient.default.listLicenses(limit).then(licenses => {
                const exists = licenses.length > 0;
                const active = licenses.some(license => isLicenseValid(license));
                return exists && active;
            });
        }
        
        hasDevices() {
            return TimechiefClient.default.listDevices(limit).then(devices => {
                return devices.length > 0;
            });
        }
        
        hasLicenses() {
            return TimechiefClient.default.listLicenses(limit).then(licenses => {
                return licenses.length > 0;
            });
        }
        
        hasOrders() {
            return TimechiefClient.default.listOrders(limit).then(orders => {
                return orders.length > 0;
            });
        }
}


class FakeDashboardService {
    hasValidSubscription() {
        return promiseWith(true);
    }
    
    hasDevices() {
        return promiseWith(true);
    }
    
    hasLicenses() {
        return promiseWith(true);
    }
    
    hasOrders() {
        return promiseWith(true);
    }
}

export const Service = new DashboardService();

function promiseWith(value) {
    return new Promise((resolve, reject) => {
        resolve(value);
    });
}