# Type Validator

Type validator is a NodeJS package that allows you to do a runtime check of a given type.

## How to use it

```typescript
import { TypeValidator } from "type-validator"

interface ISimpleTest {
  id: number,
  name: string,
}


const validator = new TypeValidator<ISimpleTest>({
  id: {
    required: true,
    type: "number"
  },
  name: {
    required: true,
    type: "string"
  }
})

const value = {
  id: 12,
  name: "toto"
}

validator.test(value)
// Returns null on success and a string explaining the error on failure.
```

**You should check the [unit tests](https://github.com/Harmos274/type-validator/blob/master/tests/unit.test.ts) 
to know more about this package, including how to implement custom validators for your types and nested fields.**
