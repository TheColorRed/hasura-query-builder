import { concatMap, map, Observable, of, pipe } from 'rxjs';
import { Attributes, BaseModel, Fields, FieldsResult } from '../classes/base-model';
import { Table } from '../classes/table';

export function customFields<
  T extends BaseModel,
  IN extends Fields<T> | Fields<T>[],
  OUT extends FieldsResult<T> | FieldsResult<T>[]
>(builder: Table, attributes?: Attributes<T>) {
  const attrs = Object.keys(attributes ?? {});
  const maps = builder.callbackMap;
  return pipe(
    concatMap<IN, Observable<OUT>>(
      rows =>
        of(rows).pipe(
          map(rows =>
            Array.isArray(rows)
              ? (rows.map(row => updateRow(row, maps, attrs, attributes)) as FieldsResult<T>[])
              : (updateRow(rows, maps, attrs, attributes) as FieldsResult<T>)
          )
        ) as Observable<OUT>
    )
  );
}

function updateRow<V extends BaseModel>(
  fields: Fields<V>,
  maps: (<T, U extends { [key: string]: any }>(row: T) => U)[],
  attrNames: string[],
  attributes?: Attributes<V>
) {
  maps.map(func => func(fields)).forEach(r => (fields = { ...fields, ...r }));
  attrNames.forEach(key => {
    // @ts-ignore
    const result = attributes?.[key](fields as FieldsResult<V>);
    fields = { ...fields, [key]: result };
  });
  return fields;
}
