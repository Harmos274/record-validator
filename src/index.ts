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
          const invalidType = typeValidator(type, key.toString(), value[key])

          if (invalidType) {
            return invalidType
          }
          const nestedValue = descriptor[key].value
          const arrayType = descriptor[key].arrayType

          if (type === "object" && nestedValue !== undefined) {
            return TypeValidator.testFromRaw(nestedValue, value[key])
          } else if (type === "array" && arrayType !== undefined) {
            //                                 ↓ wtf?
            const valueArray = value[key] as unknown as Array<unknown>
            let validator: (value: unknown) => string | null

            if (typeof arrayType === "string") {
              validator = (value: unknown): string | null => typeValidator(arrayType, key.toString(), value)
            } else if (typeof arrayType === "object"){
              validator = (value: unknown) => TypeValidator.testFromRaw(arrayType, value)
            } else {
              throw new Error("Abort mission")
            }
            for (let i = 0; (i < valueArray.length); i++) {
              const invalidValue = validator(valueArray[i])

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
    value?: ObjectDescriptor<T[Key]>
    arrayType?: ObjectDescriptor<T[Key] extends (infer U)[] ? U : never> | ValidableType
  } | {
    required?: boolean
    type: "object"
    customValidator?: FieldValidator<T, Key>
    value: ObjectDescriptor<T[Key]>
    arrayType?: never
  } | {
    required?: boolean
    type: "array"
    customValidator?: FieldValidator<T, Key>
    value?: never
    arrayType: ObjectDescriptor<T[Key] extends (infer U)[] ? U : never> | ValidableType
  }
}

function typeValidator(type: ValidableType, key: string, value: unknown) {
  // special case for array because typeof array is object
  if (type === "array") {
    return Array.isArray(value) ? null : `"${key}" should be an array.`
  }
  return typeof value === type ? null : `"${key}" should be of type ${type}.`
}

