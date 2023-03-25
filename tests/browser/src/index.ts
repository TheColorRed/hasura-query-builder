declare global {
  function DOMcreateElement(element: string | Function, properties: any, ...children: any[]): HTMLElement;
}

import '@hasura-query-builder/browser';
import './connections';
import './components';
