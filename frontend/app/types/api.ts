// Types based on FastAPI backend schemas

export interface GPSLocation {
  lat: number
  lon: number
  timestamp: number
  accuracy?: number  // Optional accuracy field for courier GPS
}

// POST /orders
export interface OrderCreate {
  order_id: string
  merchant_address: string
  buyer_address: string
  amount: string
  timeout: number
  destination_lat: number
  destination_lon: number
}

export interface OrderResponse {
  order_id: string
  status: string
}

// POST /otp/request
export interface OtpRequest {
  order_id: string
  gps_buyer: GPSLocation
  mode: 'otp' | 'qr' | 'both'
  device_id: string
}

export interface OtpResponse {
  otp?: string
  qr_payload?: string
  expires_at: number
}

// POST /deliveries/confirm
export interface DeliveryConfirmationRequest {
  order_id: string
  otp: string
  qr_token: string
  courier_id: string
  gps_courier: GPSLocation
  photo_uri: string
}

export interface DeliveryConfirmationResponse {
  status: string
  tx_hash: string
  auth_nonce: string
  expires_at: number
}

// Error response type
export interface APIError {
  detail: string
}