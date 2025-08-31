import { apiFetch } from "./client";
import { routes } from "./routes";
import type {
  OrderCreate,
  OrderResponse,
  OtpRequest,
  OtpResponse,
  DeliveryConfirmationRequest,
  DeliveryConfirmationResponse,
} from "./types";

export const OrdersApi = {
  register(order: OrderCreate) {
    return apiFetch<OrderResponse>(routes.registerOrder, {
      method: "POST",
      body: order,
    });
  },
  requestOtp(payload: OtpRequest) {
    return apiFetch<OtpResponse>(routes.requestOtp, {
      method: "POST",
      body: payload,
    });
  },
  confirmDelivery(payload: DeliveryConfirmationRequest) {
    return apiFetch<DeliveryConfirmationResponse>(routes.confirmDelivery, {
      method: "POST",
      body: payload,
    });
  },
};
