/**
 * A helper export function that ensures we won't work with null values
 */
export function nonNull(val: any, fallback: any) {
  return Boolean(val) ? val : fallback;
}

/**
 * How do we handle children. Children can either be:
 * 1. Calls to DOMcreateElement, returns a Node
 * 2. Text content, returns a Text
 *
 * Both can be appended to other nodes.
 */
export function DOMparseChildren(children: (string | HTMLElement)[]) {
  return children.map(child => {
    if (typeof child === 'string') {
      return document.createTextNode(child);
    }
    return child;
  });
}

/**
 * How do we handle regular nodes.
 * 1. We create an element
 * 2. We apply all properties from JSX to this DOM node
 * 3. If available, we append all children.
 */
export function DOMparseNode(element: string, properties: any, children: any) {
  const el = document.createElement(element);
  Object.keys(nonNull(properties, {})).forEach(key => {
    // @ts-ignore
    el[key] = properties[key];
  });
  DOMparseChildren(children).forEach(child => {
    el.appendChild(child);
  });
  return el;
}

/**
 * Our entry export function.
 * 1. Is the element a export function, than it's a export functional component.
 *    We call this export function (pass props and children of course)
 *    and return the result. We expect a return value of type Node
 * 2. If the element is a string, we parse a regular node
 */
export function DOMcreateElement(element: string | Function, properties: any, ...children: any[]) {
  if (typeof element === 'function') {
    return element({
      ...nonNull(properties, {}),
      children,
    });
  }
  return DOMparseNode(element, properties, children);
}
