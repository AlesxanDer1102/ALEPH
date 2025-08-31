"use client";
import { useMutation } from "@tanstack/react-query";
import { OrdersApi } from "./orders";
import type {
  OrderCreate,
  OtpRequest,
  DeliveryConfirmationRequest,
  OrderResponse,
  OtpResponse,
  DeliveryConfirmationResponse,
} from "./types";

export function useRegisterOrder() {
  return useMutation<OrderResponse, Error, OrderCreate>({
    mutationFn: (payload) => OrdersApi.register(payload),
  });
}

export function useRequestOtp() {
  return useMutation<OtpResponse, Error, OtpRequest>({
    mutationFn: (payload) => OrdersApi.requestOtp(payload),
  });
}

export function useConfirmDelivery() {
  return useMutation<
    DeliveryConfirmationResponse,
    Error,
    DeliveryConfirmationRequest
  >({
    mutationFn: (payload) => OrdersApi.confirmDelivery(payload),
  });
}
