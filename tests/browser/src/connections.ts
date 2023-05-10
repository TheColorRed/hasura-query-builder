import { Connections } from '@hasura-query-builder/core';

Connections.create({
  connections: {
    default: {
      url: new URL('https://busy-boxer-29.hasura.app/v1/graphql'),
      headers: {
        'x-hasura-admin-secret': '3x0v59po46zqTZXgEf8clpw8WbbSE0Ka4S3pYOs1c3zKV71wffsOa6wlBNVnse3P',
        cat: 'undefined',
      },
      settings: { logging: false },
    },
  },
  settings: { logging: true },
  headers: {
    cat: 'dog',
  },
});
