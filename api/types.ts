// TypeScript types mirroring FastAPI Pydantic schemas

export interface GPSLocation {
  lat: number;
  lon: number;
  accuracy?: number | null;
  timestamp: number; // epoch seconds or ms depending on backend; use seconds if possible
}

// /otp/request
export interface OtpRequest {
  order_id: string; // 0x-prefixed hex
  gps_buyer: GPSLocation;
  device_id?: string;
  mode?: "otp" | "qr" | "both";
}
export interface OtpResponse {
  otp?: string | null;
  qr_payload?: string | null; // base64 payload for QR
  expires_at: number; // epoch seconds
}

// /deliveries/confirm
export interface DeliveryConfirmationRequest {
  order_id: string; // 0x hex
  otp?: string | null;
  qr_token?: string | null;
  gps_courier: GPSLocation;
  courier_id: string;
  photo_uri?: string | null;
}
export interface DeliveryConfirmationResponse {
  status: "RELEASE_SUBMITTED" | string;
  tx_hash: string; // 0x...
  auth_nonce: string;
  expires_at: number;
}

// /orders
export interface OrderCreate {
  order_id: string; // 0x hex id already created on-chain
  merchant_address: string; // 0x...
  buyer_address: string; // 0x...
  amount: string; // base units (e.g., 6 decimals for USDC)
  timeout: number; // epoch seconds
  destination_lat?: number | null;
  destination_lon?: number | null;
}
export interface OrderResponse {
  order_id: string;
  status: string;
}
