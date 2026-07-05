'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coordinate } from '@/shared/types';

interface GeolocationState {
  position: Coordinate | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export function useGeolocation(watch = false) {
  const [state, setState] = useState<GeolocationState>(() => ({
    position: null,
    accuracy: null,
    error: isGeolocationSupported() ? null : '이 브라우저는 위치 서비스를 지원하지 않습니다.',
    loading: isGeolocationSupported(),
  }));

  const onSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      accuracy: pos.coords.accuracy,
      error: null,
      loading: false,
    });
  }, []);

  const onError = useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({ ...prev, error: err.message, loading: false }));
  }, []);

  useEffect(() => {
    if (!isGeolocationSupported()) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    };

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, options);
      return () => navigator.geolocation.clearWatch(id);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }
  }, [watch, onSuccess, onError]);

  return state;
}
