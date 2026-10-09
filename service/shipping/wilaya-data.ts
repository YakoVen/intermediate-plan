import fs from 'fs';
import path from 'path';
import type { CommuneInfo, WilayaInfo } from '@/interfaces/shipment';

/**
 * Vendored Algerian address data.
 *
 * Server-side only: reads the JSON files with `fs`, so keep it out of client
 * components. The client reads this through the `/api/shipping/*` routes
 * instead (communes.json is ~160 KB and has no business in a browser bundle).
 *
 * Source: dzship repo `data/` (MIT, datasets public domain). Vendored rather
 * than fetched at runtime because the API asks callers to cache reference data,
 * and a shipping form must work when the gateway is slow.
 */

const DATA_DIR = path.join(process.cwd(), 'service', 'shipping', 'data');

/**
 * Grand Sud. Union of the two lists in the dzship docs, which disagree
 * slightly: `wilayas-and-communes.md` says "(11, 33, 37, 49-50, 52-54, 56)"
 * while `cash-on-delivery.md` also names Adrar and Ouled Djellal. Both are
 * included here. Prefer the live `isDeepSouth` flag from `GET /v1/wilayas` when
 * a network call is acceptable.
 */
const DEEP_SOUTH_CODES = new Set([1, 11, 33, 37, 49, 50, 51, 52, 53, 54, 56]);

interface RawWilaya58 {
  code: number;
  name: string;
  nameAr: string;
  nameAscii: string;
  communeCount: number;
}

interface RawWilaya2026 extends RawWilaya58 {
  courierSupported?: boolean;
  shipAs?: number;
  shipAsName?: string;
}

interface RawCommune {
  wilayaCode: number;
  name: string;
  nameAr: string;
  gazetteName?: string;
}

let wilayas58Cache: WilayaInfo[] | null = null;
let wilayas69Cache: WilayaInfo[] | null = null;
let communesCache: CommuneInfo[] | null = null;

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')) as T;
}

function toWilayaInfo(raw: RawWilaya58 | RawWilaya2026): WilayaInfo {
  return {
    code: raw.code,
    nameFr: raw.name,
    nameAr: raw.nameAr,
    nameAscii: raw.nameAscii,
    communeCount: raw.communeCount,
    courierSupported: 'courierSupported' in raw ? raw.courierSupported : true,
    shipAs: 'shipAs' in raw ? raw.shipAs : undefined,
    shipAsName: 'shipAsName' in raw ? raw.shipAsName : undefined,
    isDeepSouth: DEEP_SOUTH_CODES.has(raw.code),
  };
}

/** The 58 wilayas couriers actually deliver to. */
export function getShippableWilayas(): WilayaInfo[] {
  if (!wilayas58Cache) {
    // The 58-file carries no `courierSupported` key; toWilayaInfo defaults it true.
    wilayas58Cache = readJson<RawWilaya58[]>('wilayas.json').map(toWilayaInfo);
  }
  return wilayas58Cache;
}

/** All 69 wilayas of the 2026 division, each with `courierSupported` + `shipAs`. */
export function getAllWilayas(): WilayaInfo[] {
  if (!wilayas69Cache) {
    wilayas69Cache = readJson<RawWilaya2026[]>('wilayas-2026.json').map(toWilayaInfo);
  }
  return wilayas69Cache;
}

/** All 1,541 communes, courier spelling in `nameFr`. */
export function getAllCommunes(): CommuneInfo[] {
  if (!communesCache) {
    communesCache = readJson<RawCommune[]>('communes.json').map((c) => ({
      wilayaCode: c.wilayaCode,
      nameFr: c.name,
      nameAr: c.nameAr,
      gazetteName: c.gazetteName,
    }));
  }
  return communesCache;
}

/**
 * Communes of one wilaya.
 *
 * Always filter by wilaya: 36 commune names in this dataset exist in more than
 * one wilaya (`El Marsa` is in Chlef, Alger and Skikda), so matching a commune
 * by name alone is unreliable (docs/wilayas-and-communes.md).
 */
export function getCommunesForWilaya(wilayaCode: number): CommuneInfo[] {
  return getAllCommunes().filter((c) => c.wilayaCode === wilayaCode);
}

export function getWilaya(code: number): WilayaInfo | undefined {
  return getAllWilayas().find((w) => w.code === code);
}

export function isValidWilayaCode(code: number): boolean {
  return Number.isInteger(code) && code >= 1 && code <= 58;
}

export function isValidCommuneName(wilayaCode: number, name: string): boolean {
  const norm = normalizeName(name);
  if (!norm) return false;
  return getCommunesForWilaya(wilayaCode).some((c) => normalizeName(c.nameFr) === norm);
}

/**
 * Lowercase, strip accents, collapse whitespace. Couriers each froze their own
 * transliteration years ago, so comparison must be normalized, never exact.
 */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * The wilaya code to actually put on the wire.
 *
 * Algeria became 69 wilayas in April 2026, but no courier accepts a code above
 * 58 yet: the parent wilayas keep running the new territories until the
 * handover completes (deadline 31 December 2026). Sending 68 today gets the
 * parcel rejected, so new wilayas resolve to their `shipAs` parent code.
 */
export function resolveShipCode(code: number): number {
  const wilaya = getWilaya(code);
  if (!wilaya) return code;
  if (wilaya.courierSupported === false && wilaya.shipAs) return wilaya.shipAs;
  return code;
}

/** Display name for a code, preferring the 2026 name when it exists. */
export function getWilayaName(code: number): string {
  const wilaya = getWilaya(code);
  return wilaya?.nameFr ?? String(code);
}

/** Validate the pair the way the courier will. Returns a message on failure. */
export function validateAddress(
  wilayaCode: number,
  communeName: string
): { ok: true } | { ok: false; error: string } {
  if (!Number.isInteger(wilayaCode) || wilayaCode < 1 || wilayaCode > 69) {
    return { ok: false, error: 'Wilaya invalide.' };
  }
  const shipCode = resolveShipCode(wilayaCode);
  if (!isValidCommuneName(shipCode, communeName)) {
    const wilaya = getWilaya(wilayaCode);
    const where = wilaya ? ` (${wilaya.nameFr})` : '';
    return { ok: false, error: `Commune inconnue pour cette wilaya${where}.` };
  }
  return { ok: true };
}

/** Algerian mobile: 05/06/07 + 8 digits. DzShip returns 422 `invalid_phone` otherwise. */
export function validatePhone(phone: string): { ok: true; phone: string } | { ok: false; error: string } {
  const cleaned = phone.replace(/[\s.\-()]/g, '');
  if (!/^0[5-7]\d{8}$/.test(cleaned)) {
    return { ok: false, error: 'Numéro invalide. Expected 05/06/07 followed by 8 digits.' };
  }
  return { ok: true, phone: cleaned };
}

/**
 * Stop-desk support is per courier, not universal.
 * ZR Express (Procolis) and Colivraison publish no desk list and answer
 * `422 NOT_SUPPORTED` (docs/endpoints.md).
 */
export const NO_DESK_LIST_COURIERS = new Set(['zrexpress', 'colivraison']);

// ZR Express aliases resolve to the same Procolis platform.
const ZR_ALIASES = new Set([
  'abexexpress', 'leopardexpress', 'colilog', 'flashdelivery',
]);

export function supportsDeskList(courier: string): boolean {
  const key = courier.toLowerCase();
  if (ZR_ALIASES.has(key)) return false;
  return !NO_DESK_LIST_COURIERS.has(key);
}