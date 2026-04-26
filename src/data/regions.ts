import regionsData from "./regions.json";
import type { Region } from "./passport";

export interface RegionCountry {
  name: string;
  flag: string;
  language: string;
}

export interface RegionEntry {
  name: Region;
  defaultCountry: string;
  flag: string;
  sub: string;
  educationTaxonomyLabel: string;
  educationLevels: string[];
  countries: RegionCountry[];
}

export type SettingOption = "Urban" | "Rural";

export const REGIONS: RegionEntry[] = (regionsData.regions as RegionEntry[]);

export const SETTINGS: SettingOption[] = (regionsData.settings as SettingOption[]);

export const REGION_NAMES: Region[] = REGIONS.map((r) => r.name);

export function getRegion(name: Region): RegionEntry {
  return REGIONS.find((r) => r.name === name) ?? REGIONS[0];
}

export function getCountriesForRegion(name: Region): RegionCountry[] {
  return getRegion(name).countries;
}

export function getEducationLevels(name: Region): string[] {
  return getRegion(name).educationLevels;
}

export function getLanguagesForRegion(name: Region): string[] {
  return Array.from(new Set(getRegion(name).countries.map((c) => c.language)));
}