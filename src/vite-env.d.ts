/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom/vitest" />

declare module '*.json' {
  const value: unknown;
  export default value;
}
