export type Step<S> = { id: string; label: string; ms: number; state: S };
export type StepMeta = Pick<Step<unknown>, 'id' | 'label' | 'ms'>;
