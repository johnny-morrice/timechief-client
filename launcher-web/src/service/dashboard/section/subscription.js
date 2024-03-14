import { TimechiefClient } from "../../timechiefclient";

class SubscriptionDashboardSectionService {
    getLicenses() {
        const limit = 50;
        return TimechiefClient.default.listLicenses(limit);
    }
}

class FakeSubscriptionDashboardSectionService {
    getLicenses() {
        return new Promise((resolve, reject) => {
            const result = [
                {
                    valid_until: 1760981059,
                    premium: true
                }
            ];
            resolve(result);
        });
    }
}

export const Service = new SubscriptionDashboardSectionService();