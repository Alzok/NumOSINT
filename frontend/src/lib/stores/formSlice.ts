import { StateCreator } from 'zustand';
import { InvestigationFormState, InputField } from '@/types';

const initialFormField: InputField = { id: 1, value: '' };

const initialFormState: InvestigationFormState = {
    names: [initialFormField],
    emails: [initialFormField],
    usernames: [initialFormField],
    phones: [initialFormField],
    ips: [initialFormField],
    domains: [initialFormField],
    urls: [initialFormField],
    maxGeneration: 3,
    minConfidence: 0.7,
};

export interface FormSlice {
  investigationForm: InvestigationFormState;
  setInvestigationFormField: (type: keyof Omit<InvestigationFormState, 'maxGeneration' | 'minConfidence'>, id: number, value: string) => void;
  addInvestigationFormField: (type: keyof Omit<InvestigationFormState, 'maxGeneration' | 'minConfidence'>) => void;
  removeInvestigationFormField: (type: keyof Omit<InvestigationFormState, 'maxGeneration' | 'minConfidence'>, id: number) => void;
  setInvestigationFormOptions: (options: { maxGeneration?: number; minConfidence?: number }) => void;
  resetInvestigationForm: () => void;
  setInvestigationForm: (formState: InvestigationFormState) => void;
}

export const createFormSlice: StateCreator<FormSlice, [], [], FormSlice> = (set) => ({
  investigationForm: initialFormState,
  setInvestigationFormField: (type, id, value) => set(state => ({
    investigationForm: {
        ...state.investigationForm,
        [type]: state.investigationForm[type].map(field => field.id === id ? { ...field, value } : field)
    }
  })),
  addInvestigationFormField: (type) => set(state => ({
    investigationForm: {
        ...state.investigationForm,
        [type]: [...state.investigationForm[type], { id: Date.now(), value: '' }]
    }
  })),
  removeInvestigationFormField: (type, id) => set(state => ({
    investigationForm: {
        ...state.investigationForm,
        [type]: state.investigationForm[type].filter(field => field.id !== id)
    }
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