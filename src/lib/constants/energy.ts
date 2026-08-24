import { TaskEnergy } from '@nicoflow/shared/types';
import {
  ENERGY_OPTIONS as SHARED_ENERGY_OPTIONS,
  getEnergyOption as sharedGetEnergyOption,
} from '@nicoflow/shared/utils';
import { BatteryLow, BatteryMedium, Brain, type LucideIcon } from 'lucide-react-native';

// Icon + hex-color pairing is RN-specific (lucide-react-native, not
// className-driven) — everything else (value/label ordering) comes from
// @nicoflow/shared/utils so mobile and web agree on the energy model.
const ICON: Record<TaskEnergy, LucideIcon> = {
  [TaskEnergy.LOW]: BatteryLow,
  [TaskEnergy.MEDIUM]: BatteryMedium,
  [TaskEnergy.DEEP]: Brain,
};

const COLOR: Record<TaskEnergy, { color: string; darkColor: string }> = {
  [TaskEnergy.LOW]: { color: '#10b981', darkColor: '#34d399' },
  [TaskEnergy.MEDIUM]: { color: '#f59e0b', darkColor: '#fbbf24' },
  [TaskEnergy.DEEP]: { color: '#8b5cf6', darkColor: '#a78bfa' },
};

const LABEL: Record<TaskEnergy, string> = {
  [TaskEnergy.LOW]: 'Low',
  [TaskEnergy.MEDIUM]: 'Medium',
  [TaskEnergy.DEEP]: 'Deep',
};

export const ENERGY_OPTIONS = SHARED_ENERGY_OPTIONS.map(option => ({
  value: option.value,
  icon: ICON[option.value],
  label: LABEL[option.value],
  ...COLOR[option.value],
}));

export const getEnergyOption = (energy: TaskEnergy) => {
  const value = sharedGetEnergyOption(energy).value;
  return ENERGY_OPTIONS.find(option => option.value === value) ?? ENERGY_OPTIONS[1];
};
