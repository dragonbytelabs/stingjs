declare module "stingjs" {
  interface StingApi {
    data(name: string, setup: () => Record<string, unknown>): void
    signal<T>(initialValue: T): [() => T, (nextValue: T | ((prev: T) => T)) => void]
  }

  const sting: StingApi
  export default sting
}
