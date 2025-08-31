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
   * Get hardcoded GPS location for demo purposes
   * Using coordinates near Lima, Peru for consistent testing
   */
  async getCurrentLocation(): Promise<{ lat: number; lon: number; timestamp: number }> {
    // Hardcoded coordinates for demo (Lima, Peru area)
    const DEMO_COORDINATES = {
      lat: -12.0882, // Lima latitude (matches user example)
      lon: -77.0504, // Lima longitude (matches user example)
      timestamp: Math.floor(Date.now() / 1000) // Current timestamp in seconds
    }
    
    // Simulate a small delay like a real GPS call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return Promise.resolve(DEMO_COORDINATES)
  }

  /**
   * Get slightly different location for courier (for demo purposes)
   * This simulates a courier very close to the delivery location
   */
  async getCourierLocation(): Promise<{ lat: number; lon: number; timestamp: number; accuracy: number }> {
    // Coordinates in Lima, Peru - very close to the buyer location (within ~50 meters)
    const COURIER_COORDINATES = {
      lat: -12.0884, // Slightly different latitude (~20 meters south)
      lon: -77.0506, // Slightly different longitude (~15 meters west) 
      timestamp: Math.floor(Date.now() / 1000),
      accuracy: 5 // GPS accuracy in meters (good accuracy for demo)
    }
    
    // Simulate GPS delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return Promise.resolve(COURIER_COORDINATES)
  }

  /**
   * Generate a device ID for the current session
   */
  generateDeviceId(): string {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem('escrow_device_id')
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      localStorage.setItem('escrow_device_id', deviceId)
    }
    
    return deviceId
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Export class for custom instances if needed
export default APIClient