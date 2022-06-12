import { TypeValidator, FieldValidator } from "../src"

interface ISimpleTest {
  id: number,
  name: string,
}

interface INestedTest {
  id: number
  name: string,
  address: {
    city: string,
    zipcode: number
  }
}

interface IArrayTest {
  id: number
  properties: Array<string | number>
}

interface IObjectArrayTest {
  id: number
  properties: Array<{
    role: string,
    roleId: number | string
  }>
}

describe("Unit Tests", () => {
  describe("Basic Objects", () => {
    const simple_tested_value: ISimpleTest = {
      id: 12,
      name: "dsqs",
    }

    it("should validate a valid use case", () => {
      const validator = new TypeValidator<ISimpleTest>({
        id: {
          required: true,
          type: "number",
        },
        name: {
          required: true,
          type: "string",
        }
      })


      // Null is a passing test, because the test() method only return a string when
      // it's not passing.
      expect(validator.test(simple_tested_value)).toBeNull()
    })

    it("should'nt validate a use case where a type is not respected", () => {
      const validator = new TypeValidator<ISimpleTest>({
        // We now expect the id field to be a string.
        id: {
          required: true,
          type: "string",
        },
        name: {
          required: true,
          type: "string",
        }
      })

      // A non empty string is always evaluated as True in JavaScript
      expect(validator.test(simple_tested_value as ISimpleTest)).toBe('"id" should be of type string.')
    })

    it("should'nt validate a use case where a required field is not respected", () => {
      const validator = new TypeValidator<ISimpleTest>({
        id: {
          required: true,
          type: "string",
        },
        name: {
          required: true,
          type: "string",
        }
      })

      const tested_value: unknown = {
        // The field "name" is missing in the input data.
        id: "12"
      }

      expect(validator.test(tested_value as ISimpleTest)).toBe('Field \"name\" is required.')
    })

    it("should validate a use case where a non required field is not present", () => {
      const validator = new TypeValidator<ISimpleTest>({
        id: {
          required: true,
          type: "string",
        },
        // Name is not required anymore
        name: {
          required: false,
          type: "string",
        }
      })

      const tested_value: unknown = {
        id: "12"
      }

      // It passes now.
      expect(validator.test(tested_value as ISimpleTest)).toBeNull()
    })
  })

  describe("Nested Objects", () => {
    it("should validate a use case where a nested type is present", () => {
      const validator = new TypeValidator<INestedTest>({
        id: {
          required: true,
          type: "number",
        },
        name: {
          required: true,
          type: "string",
        },
        // A nested type should be tested too
        address: {
          required: true,
          type: "object",
          value: {
            city: {
              required: true,
              type: "string"
            },
            zipcode: {
              required: true,
              type: "number"
            }
          }
        }
      })

      const tested_value: INestedTest = {
        id: 12,
        name: "toto",
        address: {
          city: "city",
          zipcode: 1232134
        }
      }

      expect(validator.test(tested_value)).toBeNull()
    })

    it("should'nt validate a use case where a required field in a nested type is not present", () => {
      const validator = new TypeValidator<INestedTest>({
        id: {
          required: true,
          type: "number",
        },
        name: {
          required: true,
          type: "string",
        },
        // A nested type should be tested too
        address: {
          required: true,
          type: "object",
          value: {
            city: {
              required: true,
              type: "string"
            },
            zipcode: {
              required: true,
              type: "number"
            }
          }
        }
      })

      const tested_value: unknown = {
        id: 12,
        name: "toto",
        address: {
          // The field "city" is missing
          zipcode: 1232134
        }
      }

      expect(validator.test(tested_value as INestedTest)).toBe('Field "city" is required.')
    })

    it("should'nt validate a use case where a field in a nested type is not well typed", () => {
      const validator = new TypeValidator<INestedTest>({
        id: {
          required: true,
          type: "number",
        },
        name: {
          required: true,
          type: "string",
        },
        // A nested type should be tested too
        address: {
          required: true,
          type: "object",
          value: {
            city: {
              required: true,
              type: "string"
            },
            zipcode: {
              required: true,
              type: "string"
            }
          }
        }
      })

      const tested_value: unknown = {
        id: 12,
        name: "toto",
        address: {
          city: "city",
          zipcode: 123123
        }
      }

      expect(validator.test(tested_value as INestedTest)).toBe('"zipcode" should be of type string.')
    })
  })

  describe("Custom Validators", () => {
    const customNameValidator: FieldValidator<ISimpleTest, "name"> = (key, value) => {
      if (value.length < 5) {
        return `"${key}" should be longer than 5 characters.`
      }
      return null
    }

    it ("should validate a use case with a custom validator and a valid name with a nested object", () => {
      const validator = new TypeValidator<INestedTest>({
        id: {
          type: "number"
        },
        address: {
          type: "object",
          value: {
            city: {
              type: "string"
            },
            zipcode: {
              type: "number"
            }
          }
        },
        name: {
          type: "string",
          customValidator: customNameValidator
        }
      })
      const tested_value = {
        id: 12,
        name: "toto",
        address: {
          city: "city",
          zipcode: 123123
        }
      }

      expect(validator.test(tested_value)).toBe('"name" should be longer than 5 characters.')
    })

    it("should validate a use case with a custom validator and a valid name", () => {
      const validator = new TypeValidator<ISimpleTest>({
        id: {
          required: true,
          type: "number",
        },
        name: {
          required: true,
          type: "string",
          customValidator: customNameValidator
        },
      })

      const simple_tested_value: ISimpleTest = {
        id: 12,
        name: "dsqsJJ",
      }

      expect(validator.test(simple_tested_value)).toBeNull()
    })

    it("shouldn't validate a use case with a custom validator and a invalid name", () => {
      const validator = new TypeValidator<ISimpleTest>({
        id: {
          required: true,
          type: "number",
        },
        name: {
          required: true,
          type: "string",
          customValidator: customNameValidator
        },
      })

      const simple_tested_value: ISimpleTest = {
        id: 12,
        name: "dsq",
      }

      expect(validator.test(simple_tested_value)).toBe('"name" should be longer than 5 characters.')
    })
  })

  describe("Array Objects", () => {
    it("should validate the type of an array of value", () => {
      const validator = new TypeValidator<IArrayTest>({
        properties: {
          type: "array",
          arrayType: "string"
        },
        id: {
          type: "number"
        },
      })

      const tested_value: IArrayTest = {
        id: 2313,
        properties: ["admin", "user"]
      }
      expect(validator.test(tested_value)).toBeFalsy()
    })

    it("shouldn't validate the type of an array of value if one of them isn't correctly typed", () => {
      const validator = new TypeValidator<IArrayTest>({
        id: {
          type: "number"
        },
        properties: {
          type: "array",
          arrayType: "string"
        }
      })

      const tested_value: IArrayTest = {
        id: 2313,
        properties: ["admin", 12]
      }
      expect(validator.test(tested_value)).toBe('[index 1] of "properties" should be of type string.')
    })

    it("should validate the type of an array of object", () => {
      const validator = new TypeValidator<IObjectArrayTest>({
        id: {
          type: "number"
        },
        properties: {
          type: "array",
          arrayType: {
            role: {
              required: true,
              type: "string"
            },
            roleId: {
              required: true,
              type: "number"
            }
          }
        }
      })

      const tested_value: IObjectArrayTest = {
        id: 2313,
        properties: [
        {
          roleId: 21313,
          role: "fesf"
        },
        {
          roleId: 231,
          role: "fdsfdsf"
        }]
      }
      expect(validator.test(tested_value)).toBeFalsy()
    })

    it("shouldn't validate the type of an array of object if one of them isn't correctly typed", () => {
      const validator = new TypeValidator<IObjectArrayTest>({
        id: {
          type: "number"
        },
        properties: {
          type: "array",
          arrayType: {
            role: {
              required: true,
              type: "string"
            },
            roleId: {
              required: true,
              type: "number"
            }
          }
        }
      })
      const tested_value: IObjectArrayTest = {
        id: 2313,
        properties: [
        {
          roleId: 21313,
          role: "admin"
        },
        {
          roleId: "231",
          role: "fdsfdsf"
        }]
      }

      expect(validator.test(tested_value)).toBe('[index 1] of "roleId" should be of type number.')
    })
  })
})
