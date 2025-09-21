import 'jest'

// Silence console in tests by default; can be re-enabled per test if needed
const original = { ...console }

beforeAll(() => {
  for (const key of ['log', 'info', 'warn', 'error']) {
    // @ts-expect-error override
    console[key] = jest.fn()
  }
})

afterAll(() => {
  Object.assign(console, original)
})
