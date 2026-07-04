declare global {
  interface Window {
    kakao?: typeof kakao;
  }
}

declare namespace kakao {
  namespace maps {
    function load(callback: () => void): void;

    class Map {
      constructor(container: HTMLElement, options: MapOptions);
      setCenter(latlng: LatLng): void;
      getCenter(): LatLng;
      setLevel(level: number): void;
      getLevel(): number;
      setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
      panTo(latlng: LatLng): void;
      relayout(): void;
    }

    interface MapOptions {
      center: LatLng;
      level: number;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      getLat(): number;
      getLng(): number;
    }

    class LatLngBounds {
      constructor();
      extend(latlng: LatLng): void;
      isEmpty(): boolean;
    }

    class Marker {
      constructor(options: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng): void;
      setImage(image: MarkerImage): void;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
      image?: MarkerImage;
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: MarkerImageOptions);
    }

    interface MarkerImageOptions {
      offset?: Point;
    }

    class Size {
      constructor(width: number, height: number);
    }

    class Point {
      constructor(x: number, y: number);
    }

    class Polyline {
      constructor(options: PolylineOptions);
      setMap(map: Map | null): void;
    }

    interface PolylineOptions {
      path: LatLng[];
      strokeWeight?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeStyle?: 'solid' | 'shortdash' | 'shortdot' | 'shortdashdot' | 'dot' | 'dash' | 'dashdot';
      map?: Map;
    }

    class Circle {
      constructor(options: CircleOptions);
      setMap(map: Map | null): void;
    }

    interface CircleOptions {
      center: LatLng;
      radius: number;
      strokeWeight?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      fillColor?: string;
      fillOpacity?: number;
      map?: Map;
    }

    class CustomOverlay {
      constructor(options: CustomOverlayOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng): void;
    }

    interface CustomOverlayOptions {
      position: LatLng;
      content: string | HTMLElement;
      map?: Map;
      yAnchor?: number;
    }

      namespace services {
      class Geocoder {
        addressSearch(
          address: string,
          callback: (result: GeocodeResult[], status: Status, pagination: PlacePagination) => void,
          options?: { page?: number; size?: number; analyze_type?: 'SIMILAR' | 'EXACT' }
        ): void;
        coord2Address(lng: number, lat: number, callback: (result: Coord2AddressResult[], status: Status) => void): void;
      }

      class Places {
        keywordSearch(
          keyword: string,
          callback: (result: PlaceSearchResult[], status: Status, pagination: PlacePagination) => void,
          options?: { location?: LatLng; radius?: number; size?: number; category_group_code?: string }
        ): void;
      }

      interface PlaceSearchResult {
        id: string;
        place_name: string;
        address_name: string;
        road_address_name: string;
        x: string;
        y: string;
        category_name: string;
        phone: string;
        place_url: string;
      }

      interface PlacePagination {
        totalCount: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        current: number;
        nextPage(): void;
        prevPage(): void;
        gotoPage(page: number): void;
        gotoFirst(): void;
        gotoLast(): void;
      }

      interface GeocodeResult {
        address: Address;
        road_address: RoadAddress | null;
        x: string;
        y: string;
      }

      interface Address {
        address_name: string;
        region_1depth_name: string;
        region_2depth_name: string;
        region_3depth_name: string;
      }

      interface RoadAddress {
        address_name: string;
      }

      interface Coord2AddressResult {
        address: Address;
        road_address: RoadAddress | null;
      }

      type Status = 'OK' | 'ZERO_RESULT' | 'ERROR';
      const Status: {
        OK: 'OK';
        ZERO_RESULT: 'ZERO_RESULT';
        ERROR: 'ERROR';
      };
    }

    namespace event {
      function addListener(target: Map | Marker, type: string, handler: (...args: unknown[]) => void): void;
      function removeListener(target: Map | Marker, type: string, handler: (...args: unknown[]) => void): void;
    }
  }
}
