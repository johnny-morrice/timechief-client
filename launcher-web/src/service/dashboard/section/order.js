import { TimechiefClient } from "../../timechiefclient";

class OrderDashboardSectionService {
    getOrders() {
        const limit = 50;
        return TimechiefClient.default.listOrders(limit);
    }
}

class FakeOrderDashboardSectionService {
    getOrders() {
        return new Promise((resolve, reject) => {
            const result = [
                {
                    ordered_at: 1697587551,
                    product_name: "Timechief"
                }
            ];
            resolve(result);
        });
    }
}

export const Service = new OrderDashboardSectionService();