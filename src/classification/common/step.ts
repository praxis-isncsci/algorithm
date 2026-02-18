import { Translation } from '../common';

export type StepDescription = {
  key: Translation;
  params?: { [key: string]: string };
};

export type StepAction = {
  key: Translation;
  params?: { [key: string]: string };
};

export type Step<S = unknown> = {
  description: StepDescription;
  actions: StepAction[];
  next: StepHandler<S> | null;
  state: S;
};

export type StepHandler<S> = (state: S) => Step<S>;

export function createStep<S>(
  description: Step<S>['description'],
  actions: Step<S>['actions'],
  state: S,
  updates: Partial<S>,
  next: Step<S>['next'],
): Step<S> {
  return {
    description,
    actions,
    state: { ...state, ...updates },
    next,
  };
}
