Note on testing stack usage in this repository:
- This project appears to use a Jest- or Vitest-compatible test runner with React Testing Library.
- The newly added ProjectView tests use RTL and a runner-agnostic mock API that automatically detects Jest or Vitest.
- No new dependencies were introduced.