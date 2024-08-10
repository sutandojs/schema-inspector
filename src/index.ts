import { AnyQueryBuilder } from 'sutando';
import MySQL from './dialects/mysql';
import Postgres from './dialects/postgres';
import CockroachDB from './dialects/cockroachdb';
import SQLite from './dialects/sqlite';
import Oracledb from './dialects/oracledb';
import MSSQL from './dialects/mssql';

export function mysqlInspector(connection: AnyQueryBuilder) {
  return new MySQL(connection);
}

export function postgresInspector(connection: AnyQueryBuilder) {
  return new Postgres(connection);
}

export function cockroachdbInspector(connection: AnyQueryBuilder) {
  return new CockroachDB(connection);
}

export function sqliteInspector(connection: AnyQueryBuilder) {
  return new SQLite(connection);
}

export function oracledbInspector(connection: AnyQueryBuilder) {
  return new Oracledb(connection);
}

export function mssqlInspector(connection: AnyQueryBuilder) {
  return new MSSQL(connection);
}

export function schemaInspector(connection: AnyQueryBuilder, dialect?: string) {
  if (!dialect) {
    // @ts-ignore
    dialect = connection.database;
  }

  switch (dialect) {
    case 'mysql':
      return mysqlInspector(connection);
    case 'postgres':
      return postgresInspector(connection);
    case 'cockroachdb':
      return cockroachdbInspector(connection);
    case 'sqlite':
      return sqliteInspector(connection);
    case 'oracledb':
      return oracledbInspector(connection);
    case 'mssql':
      return mssqlInspector(connection);
    default:
      throw new Error(`Unknown dialect: ${dialect}`);
  }
}
