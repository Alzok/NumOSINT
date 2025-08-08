import { StateCreator } from 'zustand';
import { InvestigationFormState, FormIndicator, IndicatorType } from '@/types';

const initialIndicator: FormIndicator = { id: 1, type: 'NAME', value: '' };

const initialFormState: InvestigationFormState = {
    indicators: [initialIndicator],
    maxGeneration: 4,
    minConfidence: 0.7,
};

export interface FormSlice {
  investigationForm: InvestigationFormState;
  updateIndicator: (id: number, newIndicatorData: Partial<Omit<FormIndicator, 'id'>>) => void;
  addIndicator: () => void;
  removeIndicator: (id: number) => void;
  setInvestigationFormOptions: (options: { maxGeneration?: number; minConfidence?: number }) => void;
  resetInvestigationForm: () => void;
  setInvestigationForm: (formState: InvestigationFormState) => void;
}

export const createFormSlice: StateCreator<FormSlice, [], [], FormSlice> = (set) => ({
  investigationForm: initialFormState,
  updateIndicator: (id, newIndicatorData) => set(state => ({
    investigationForm: {
      ...state.investigationForm,
      indicators: state.investigationForm.indicators.map(indicator =>
        indicator.id === id ? { ...indicator, ...newIndicatorData } : indicator
      ),
    },
  })),
  addIndicator: () => set(state => ({
    investigationForm: {
      ...state.investigationForm,
      indicators: [...state.investigationForm.indicators, { id: Date.now(), type: 'NAME', value: '' }],
    },
  })),
  removeIndicator: (id) => set(state => ({
    investigationForm: {
      ...state.investigationForm,
      indicators: state.investigationForm.indicators.filter(indicator => indicator.id !== id),
    },
  })),
  setInvestigationFormOptions: (options) => set(state => ({
    investigationForm: {
        ...state.investigationForm,
        ...options
    }
  })),
  resetInvestigationForm: () => set({ investigationForm: initialFormState }),
  setInvestigationForm: (formState) => set({ investigationForm: formState }),
});