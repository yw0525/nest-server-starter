import * as path from 'path';

const ENV = {
  development: path.resolve('.env.development'),
  staging: path.resolve('.env.staging'),
  production: path.resolve('.env.production'),
};

const parseEnv = () =>
  ({
    path: ENV[process.env.NODE_ENV],
  } || {});

export default parseEnv();
