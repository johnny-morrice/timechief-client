import { TimechiefClient } from "../../timechiefclient";

class SupportDashboardSectionService {
    getCurrentPrincipal() {
        return TimechiefClient.default.getCurrentPrincipal();
    }
}

class FakeSupportDashboardSectionService {
    getCurrentPrincipal() {
        return new Promise((resolve, reject) => {
            const result = {
                uuid: "82ee9f29-7c69-4e8d-a419-45a542bcb237",
            };
            resolve(result);
        });
    }
}

export const Service = new SupportDashboardSectionService();