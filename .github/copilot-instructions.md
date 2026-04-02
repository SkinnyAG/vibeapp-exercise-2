## Unit Testing Requirements

When generating or modifying code:

- Always create or update unit tests alongside implementation
- Tests must be runnable with `npm run test -- --coverage`

### Coverage Targets
- Line coverage ≥ 60%
- Branch coverage ≥ 70%
- Function coverage ≥ 80%

### Test Quality Guidelines
- Tests must be deterministic and reproducible
- Focus on behaviour, not implementation details
- Include edge cases and branch conditions
- Use mocks/stubs where appropriate
- Include setup/teardown when relevant

### Project Structure
- Store tests under `/tests/` or `/src/tests/`
- Ensure tests run locally without errors

### Output Expectations
- Include assertions in all tests
- Ensure coverage report is generated