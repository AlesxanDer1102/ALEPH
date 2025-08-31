import { useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import {
  OrderCreate,
  OrderResponse,
  OtpRequest,
  OtpResponse,
  DeliveryConfirmationRequest,
  DeliveryConfirmationResponse
} from '../types/api'

interface APIState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface APIHook<T, P = void> {
  state: APIState<T>
  execute: (params: P) => Promise<T | null>
  reset: () => void
}

// Generic hook for API calls
function useAPICall<T, P = void>(
  apiFunction: (params: P) => Promise<T>
): APIHook<T, P> {
  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(async (params: P): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await apiFunction(params)
      setState({ data: result, loading: false, error: null })
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      setState({ data: null, loading: false, error: errorMessage })
      return null
    }
  }, [apiFunction])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return { state, execute, reset }
}

// Specific hooks for each API endpoint

export function useRegisterOrder(): APIHook<OrderResponse, OrderCreate> {
  return useAPICall(apiClient.registerOrder.bind(apiClient))
}

export function useRequestOTP(): APIHook<OtpResponse, OtpRequest> {
  return useAPICall(apiClient.requestOTP.bind(apiClient))
}

export function useConfirmDelivery(): APIHook<DeliveryConfirmationResponse, DeliveryConfirmationRequest> {
  return useAPICall(apiClient.confirmDelivery.bind(apiClient))
}

// Hook for getting current location (buyer/user)
export function useCurrentLocation() {
  const [state, setState] = useState<APIState<{ lat: number; lon: number; timestamp: number }>>({
    data: null,
    loading: false,
    error: null
  })

  const getCurrentLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const location = await apiClient.getCurrentLocation()
      setState({ data: location, loading: false, error: null })
      return location
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location'
      setState({ data: null, loading: false, error: errorMessage })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    state,
    getCurrentLocation,
    reset
  }
}

// Hook for getting courier location
export function useCourierLocation() {
  const [state, setState] = useState<APIState<{ lat: number; lon: number; timestamp: number }>>({
    data: null,
    loading: false,
    error: null
  })

  const getCourierLocation = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const location = await apiClient.getCourierLocation()
      setState({ data: location, loading: false, error: null })
      return location
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get courier location'
      setState({ data: null, loading: false, error: errorMessage })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    state,
    getCourierLocation,
    reset
  }
}

// Utility hook for device ID
export function useDeviceId() {
  const [deviceId] = useState(() => apiClient.generateDeviceId())
  return deviceId
}