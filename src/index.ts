export class TypeValidator<T extends Record<keyof T, unknown>> {
  private validator: ObjectDescriptor<T>

  constructor(descriptor: ObjectDescriptor<T>) {
    this.validator = descriptor
  }

  public test(value: T): string | null {
    return TypeValidator.testFromRaw(this.validator, value)
  }

  private static testFromRaw<T>(descriptor: ObjectDescriptor<T>, value: T): string | null {
    const keys: Array<keyof T> = Object.keys(descriptor) as Array<keyof T>

    for (const key of keys) {
      if (value[key] !== undefined) {
        const type = descriptor[key].type
        const customValidator = descriptor[key].customValidator

        if (type !== undefined) {
          const invalidType = typeValidator<T>(type, key, value[key])

          if (invalidType) {
            return invalidType
          }
          const nestedValue = descriptor[key].value

          if (type === "object" && nestedValue !== undefined) {
            return TypeValidator.testFromRaw(nestedValue, value[key])
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

export type FieldValidator<T> = (key: keyof T, value: T[keyof T]) => string | null

export type ValidableType = "string" | "number" | "object"

export type ObjectDescriptor<T extends Record<keyof T, unknown>> = {
  [Property in keyof T]: {
    required?: boolean
    type?: ValidableType
    customValidator?: FieldValidator<T>
    value?: ObjectDescriptor<T[Property]>
  }
}

function typeValidator<T>(type: ValidableType, key: keyof T, value: unknown) {
  return typeof value === type ? null : `"${key.toString()}" should be of type ${type}.`
}

