export function Json<T = any>(structure?: any): T {
  return new JsonConstructor(structure) as unknown as T;
}

export class JsonConstructor {
  constructor(public structure?: any) {}
}
