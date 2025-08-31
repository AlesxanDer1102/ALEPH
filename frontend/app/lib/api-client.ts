import {
  OrderCreate,
  OrderResponse,
  OtpRequest,
  OtpResponse,
  DeliveryConfirmationRequest,
  DeliveryConfirmationResponse,
  APIError
} from '../types/api'

// Get backend URL from environment variables
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

class APIClient {
  private baseUrl: string

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    if (body) {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData: APIError = await response.json().catch(() => ({ 
          detail: `HTTP ${response.status}: ${response.statusText}` 
        }))
        throw new Error(errorData.detail || `Request failed with status ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Register an order in the backend (optional off-chain metadata)
   */
  async registerOrder(orderData: OrderCreate): Promise<OrderResponse> {
    return this.makeRequest<OrderResponse>('/orders', 'POST', orderData)
  }

  /**
   * Request OTP/QR code for delivery confirmation
   */
  async requestOTP(otpRequest: OtpRequest): Promise<OtpResponse> {
    return this.makeRequest<OtpResponse>('/otp/request', 'POST', otpRequest)
  }

  /**
   * Confirm delivery using OTP/QR code
   */
  async confirmDelivery(deliveryRequest: DeliveryConfirmationRequest): Promise<DeliveryConfirmationResponse> {
    return this.makeRequest<DeliveryConfirmationResponse>('/deliveries/confirm', 'POST', deliveryRequest)
  }

  /**
   * Get current GPS location (browser API wrapper)
   */
  async getCurrentLocation(): Promise<{ lat: number; lon: number; timestamp: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            timestamp: Math.floor(position.timestamp / 1000) // Convert to seconds
          })
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }

  /**
   * Generate a device ID for the current session
   */
  generateDeviceId(): string {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem('escrow_device_id')
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('escrow_device_id', deviceId)
    }
    
    return deviceId
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Export class for custom instances if needed
export default APIClient