import { CarRoute, RouteResult, TransportOption } from '@/shared/types';

/** 승용차 연비 기반 유류비 추정 — 10km/L, 1,700원/L ≈ km당 170원 */
const FUEL_WON_PER_KM = 170;

/**
 * 카카오내비 자동차 실경로로 결과를 보정한다.
 * - TAXI: 추정치(직선거리 기반) → 실제 소요 시간·요금·도로 경로로 교체
 * - CAR(승용차): 실경로 기반 새 옵션 추가 (비용 = 통행료 + 유류비 추정)
 */
export function enhanceWithCarRoute(result: RouteResult, car: CarRoute): RouteResult {
  const searchedAt = new Date(result.searchedAt);
  const arrivalTime = new Date(searchedAt.getTime() + car.duration * 60000);

  const options = result.options.map((opt) =>
    opt.type === 'TAXI' ? upgradeTaxi(opt, car, arrivalTime) : opt
  );

  options.push(buildCarOption(car, arrivalTime));

  return {
    ...result,
    options: options.sort((a, b) => a.totalTime - b.totalTime),
  };
}

function upgradeTaxi(
  option: TransportOption,
  car: CarRoute,
  arrivalTime: Date
): TransportOption {
  return {
    ...option,
    totalTime: car.duration,
    cost: car.taxiFare + car.tollFare,
    arrivalTime,
    segments: option.segments.map((s) =>
      s.type === 'TAXI'
        ? {
            ...s,
            coordinates: car.coordinates,
            distance: car.distance,
            time: car.duration,
            approximate: false,
          }
        : s
    ),
  };
}

function buildCarOption(car: CarRoute, arrivalTime: Date): TransportOption {
  const fuelCost = Math.round((car.distance / 1000) * FUEL_WON_PER_KM);
  return {
    type: 'CAR',
    totalTime: car.duration,
    walkTime: 0,
    transferCount: 0,
    cost: car.tollFare + fuelCost,
    arrivalTime,
    segments: [
      {
        type: 'CAR',
        startName: '출발지',
        endName: '목적지',
        distance: car.distance,
        time: car.duration,
        coordinates: car.coordinates,
        lineColor: '#6366F1',
        approximate: false,
      },
    ],
  };
}
