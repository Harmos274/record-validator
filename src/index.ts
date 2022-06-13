export class TypeValidator<T extends Record<keyof T, unknown>> {
  private validator: ObjectDescriptor<T>

  constructor(descriptor: ObjectDescriptor<T>) {
    this.validator = descriptor
  }

  public test(value: T): string | null {
    return TypeValidator.testFromRaw(this.validator, value)
  }

  private static testFromRaw<T>(descriptor: ObjectDescriptor<T>, value: T): string | null {
    for (const key in descriptor) {
      const actualValue = value[key]
      const type = descriptor[key].type
      const customValidator = descriptor[key].customValidator
      const nestedValue = descriptor[key].value
      const arrayType = descriptor[key].arrayType

      if (actualValue !== undefined) {
        if (type !== undefined) {
          const invalidType = typeValidator(type, key.toString(), actualValue)

          if (invalidType) {
            return invalidType
          }
          if (type === "object" && nestedValue !== undefined) {
            const invalidObject = TypeValidator.testFromRaw(nestedValue, actualValue)

            if (invalidObject) {
              return invalidObject
            }
          } else if (type === "array" && arrayType !== undefined) {
            //                                 ↓ wtf?
            const valueArray = actualValue as unknown as Array<unknown>
            let validator: (value: unknown) => string | null

            if (typeof arrayType === "string" || typeof arrayType === "number") {
              validator = (value: unknown): string | null => typeValidator(arrayType, key.toString(), value)
            } else if (typeof arrayType === "object") {
              validator = (value: unknown) => TypeValidator.testFromRaw(arrayType, value)
            } else {
              throw new Error("Abort mission")
            }
            for (const [i, val] of valueArray.entries()) {
              const invalidValue = validator(val)

              if (invalidValue) {
                return `[index ${i}] of ${invalidValue}`
              }
            }
          }
        }
        if (customValidator !== undefined) {
          const invalid = customValidator(key, value[key])
          if (invalid) {
            return invalid
          }
        }
        // Test if required is stricly "false" because it's true by default.
      } else if (!(descriptor[key].required === false)) {
        return `Field "${key.toString()}" is required.`
      }
    }
    return null
  }
}

export type FieldValidator<T, Key extends keyof T> = (key: Key, value: T[Key]) => string | null

export type ValidableType = "string" | "number" | "object" | "array"

export type ObjectDescriptor<T extends Record<keyof T, unknown | unknown[]>> = {
  [Key in keyof T]: {
    required?: boolean
    type?: "string" | "number"
    customValidator?: FieldValidator<T, Key>
    value?: never
    arrayType?: never
  } | {
    required?: boolean
    type: "object"
    customValidator?: FieldValidator<T, Key>
    value: T[Key] extends Record<string, unknown> ? ObjectDescriptor<T[Key]> : never
    arrayType?: never
  } | {
    required?: boolean
    type: "array"
    customValidator?: FieldValidator<T, Key>
    value?: never
    arrayType: T[Key] extends (infer U)[] ? U extends Record<string, unknown> ? ObjectDescriptor<U> : ValidableType : never
  }
}

function typeValidator(type: ValidableType, key: string, value: unknown): string | null {
  // special case for array because typeof array is object
  if (type === "array") {
    return Array.isArray(value) ? null : `"${key}" should be an array.`
  }
  return typeof value === type ? null : `"${key}" should be of type ${type}.`
}

