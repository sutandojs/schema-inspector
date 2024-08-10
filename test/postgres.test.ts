import { sutando, AnyQueryBuilder } from 'sutando';
import { postgresInspector } from '../src';
import { SchemaInspector } from '../src/types/schema-inspector';

const seed = `
  create table teams (
    id serial primary key,
    uuid char(36) not null,
    name varchar(100) default null,
    name_upper varchar(100) generated always as (upper(name)) stored,
    description text,
    credits integer,
    created_at timestamp,
    activated_at date,
    unique(uuid)
  );
  comment on column teams.credits is 'Remaining usage credits';
  COMMENT ON TABLE teams IS 'Teams in competition';

  create type user_roles as enum ('admin', 'user');
  create table users (
    id serial primary key,
    team_id int not null,
    email varchar(100),
    password varchar(60),
    status varchar(60) default 'active',
    role user_roles default 'user',
    constraint fk_team_id
      foreign key (team_id)
      references teams (id)
      on update cascade
      on delete cascade,
    constraint team_id_email_unique
      unique (team_id, email)
  );

  -- One table with camelCase naming
  create table "camelCase" (
    "primaryKey" serial primary key
  );

  -- One table without a primary key
  create table page_visits (
    request_path varchar(100),
    user_agent varchar(200),
    created_at timestamp
  );

  -- One table in a schema
  create schema test;
  create table test.test (
      id serial primary key,
      number int not null
  );
`;

const connection = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'sutando',
  password: process.env.POSTGRES_PASSWORD || 'sutando',
  database: 'sutando_test',
};

describe('postgres-no-search-path', () => {
  let database: AnyQueryBuilder;
  let inspector: SchemaInspector;

  beforeAll(async () => {
    sutando.addConnection({
      client: 'pg',
      connection: connection,
    }, 'postgres-no-search-path');
    database = sutando.connection('postgres-no-search-path');
    inspector = postgresInspector(database);

    await database.schema.dropTableIfExists('page_visits');
    await database.schema.dropTableIfExists('users');
    await database.schema.dropTableIfExists('teams');
    await database.schema.dropTableIfExists('camelCase');
    await database.schema.withSchema('test').dropTableIfExists('test');
    await database.schema.dropSchemaIfExists('test');
    await database.raw('DROP TYPE IF EXISTS user_roles CASCADE;');

    await database.raw(seed);
  });

  afterAll(async () => {
    await database.destroy();
  });

  describe('.tables', () => {
    it('returns tables', async () => {
      const tables = await inspector.tables();
      expect(tables.sort()).toEqual([
        'teams',
        'users',
        'camelCase',
        'page_visits',
      ].sort());
    });
  });

  describe('.tableInfo', () => {
    it('returns information for all tables', async () => {
      expect(await inspector.tableInfo()).toEqual([
        { name: 'camelCase', schema: 'public', comment: null },
        { name: 'page_visits', schema: 'public', comment: null },
        { name: 'teams', schema: 'public', comment: 'Teams in competition' },
        { name: 'users', schema: 'public', comment: null },
      ]);
    });

    it('returns information for specific table', async () => {
      expect(await inspector.tableInfo('teams')).toEqual({
        comment: 'Teams in competition',
        name: 'teams',
        schema: 'public',
      });
    });
  });

  describe('.hasTable', () => {
    it('returns if table exists or not', async () => {
      expect(await inspector.hasTable('teams')).toEqual(true);
      expect(await inspector.hasTable('foobar')).toEqual(false);
    });
  });

  describe('.columns', () => {
    const sortFn = (a: any, b: any) => {
      if (`${a.table}${a.column}` < `${b.table}${b.column}`) {
        return -1;
      }
      if (`${a.table}${a.column}` > `${b.table}${b.column}`) {
        return 1;
      }
      return 0;
    };

    it('returns information for all tables', async () => {
      database.transaction(async (trx) => {
        const trxColumns = await postgresInspector(trx).columns();
        expect(trxColumns.sort(sortFn)).toEqual([
          { table: 'users', column: 'id' },
          { table: 'page_visits', column: 'request_path' },
          { table: 'users', column: 'password' },
          { table: 'users', column: 'status' },
          { table: 'users', column: 'role' },
          { table: 'camelCase', column: 'primaryKey' },
          { table: 'users', column: 'email' },
          { table: 'teams', column: 'uuid' },
          { table: 'page_visits', column: 'created_at' },
          { table: 'teams', column: 'credits' },
          { table: 'teams', column: 'created_at' },
          { table: 'teams', column: 'description' },
          { table: 'teams', column: 'id' },
          { table: 'page_visits', column: 'user_agent' },
          { table: 'users', column: 'team_id' },
          { table: 'teams', column: 'name' },
          { table: 'teams', column: 'name_upper' },
          { table: 'teams', column: 'activated_at' },
        ].sort(sortFn));
      });

      const columns = await inspector.columns();
      expect(columns.sort(sortFn)).toEqual([
        { table: 'users', column: 'id' },
        { table: 'page_visits', column: 'request_path' },
        { table: 'users', column: 'password' },
        { table: 'users', column: 'status' },
        { table: 'users', column: 'role' },
        { table: 'camelCase', column: 'primaryKey' },
        { table: 'users', column: 'email' },
        { table: 'teams', column: 'uuid' },
        { table: 'page_visits', column: 'created_at' },
        { table: 'teams', column: 'credits' },
        { table: 'teams', column: 'created_at' },
        { table: 'teams', column: 'description' },
        { table: 'teams', column: 'id' },
        { table: 'page_visits', column: 'user_agent' },
        { table: 'users', column: 'team_id' },
        { table: 'teams', column: 'name' },
        { table: 'teams', column: 'name_upper' },
        { table: 'teams', column: 'activated_at' },
      ].sort(sortFn));
    });

    it('returns information for specific table', async () => {
      const columns = await inspector.columns('teams');
      expect(columns.sort(sortFn)).toEqual([
        { table: 'teams', column: 'id' },
        { table: 'teams', column: 'uuid' },
        { table: 'teams', column: 'name' },
        { table: 'teams', column: 'name_upper' },
        { table: 'teams', column: 'description' },
        { table: 'teams', column: 'credits' },
        { table: 'teams', column: 'created_at' },
        { table: 'teams', column: 'activated_at' },
      ].sort(sortFn));
    });
  });

  describe('.columnInfo', () => {
    const sortFn = (a: any, b: any) => {
      if (`${a.table}${a.name}` < `${b.table}${b.name}`) {
        return -1;
      }
      if (`${a.table}${a.name}` > `${b.table}${b.name}`) {
        return 1;
      }
      return 0;
    };
    it('returns information for all columns in all tables', async () => {
      const columnInfo = await inspector.columnInfo();
      expect(columnInfo.sort(sortFn)).toEqual([
        {
          name: 'primaryKey',
          table: 'camelCase',
          data_type: 'integer',
          default_value: 'nextval(\'"camelCase_primaryKey_seq"\'::regclass)',
          max_length: null,
          numeric_precision: 32,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'request_path',
          table: 'page_visits',
          data_type: 'character varying',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'user_agent',
          table: 'page_visits',
          data_type: 'character varying',
          default_value: null,
          max_length: 200,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'created_at',
          table: 'page_visits',
          data_type: 'timestamp without time zone',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'id',
          table: 'teams',
          data_type: 'integer',
          default_value: "nextval('teams_id_seq'::regclass)",
          max_length: null,
          numeric_precision: 32,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'uuid',
          table: 'teams',
          data_type: 'character',
          default_value: null,
          max_length: 36,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'name',
          table: 'teams',
          data_type: 'character varying',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'name_upper',
          table: 'teams',
          data_type: 'character varying',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: true,
          generation_expression: 'upper((name)::text)',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'description',
          table: 'teams',
          data_type: 'text',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'credits',
          table: 'teams',
          data_type: 'integer',
          default_value: null,
          max_length: null,
          numeric_precision: 32,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: 'Remaining usage credits',
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'created_at',
          table: 'teams',
          data_type: 'timestamp without time zone',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'activated_at',
          table: 'teams',
          data_type: 'date',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'id',
          table: 'users',
          data_type: 'integer',
          default_value: "nextval('users_id_seq'::regclass)",
          max_length: null,
          numeric_precision: 32,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'team_id',
          table: 'users',
          data_type: 'integer',
          default_value: null,
          max_length: null,
          numeric_precision: 32,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: 'id',
          foreign_key_table: 'teams',
          comment: null,
          schema: 'public',
          foreign_key_schema: 'public',
          enum_values: null,
        },
        {
          name: 'email',
          table: 'users',
          data_type: 'character varying',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'password',
          table: 'users',
          data_type: 'character varying',
          default_value: null,
          max_length: 60,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'status',
          table: 'users',
          data_type: 'character varying',
          default_value: 'active',
          max_length: 60,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'role',
          table: 'users',
          data_type: 'user_roles',
          default_value: 'user',
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: ['admin', 'user'],
        },
      ].sort(sortFn));
    });

    it('returns information for all columns in specific table', async () => {
      const columnInfo = await inspector.columnInfo('teams');
      expect(columnInfo.sort(sortFn)).toEqual([
        {
          name: 'id',
          table: 'teams',
          data_type: 'integer',
          default_value: "nextval('teams_id_seq'::regclass)",
          max_length: null,
          numeric_precision: 32,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: true,
          has_auto_increment: true,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'uuid',
          table: 'teams',
          data_type: 'character',
          default_value: null,
          max_length: 36,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: false,
          is_unique: true,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'name',
          table: 'teams',
          data_type: 'character varying',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'name_upper',
          table: 'teams',
          data_type: 'character varying',
          default_value: null,
          max_length: 100,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: true,
          generation_expression: 'upper((name)::text)',
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'description',
          table: 'teams',
          data_type: 'text',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'credits',
          table: 'teams',
          data_type: 'integer',
          default_value: null,
          max_length: null,
          numeric_precision: 32,
          numeric_scale: 0,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: 'Remaining usage credits',
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'created_at',
          table: 'teams',
          data_type: 'timestamp without time zone',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
        {
          name: 'activated_at',
          table: 'teams',
          data_type: 'date',
          default_value: null,
          max_length: null,
          numeric_precision: null,
          numeric_scale: null,
          is_generated: false,
          generation_expression: null,
          is_nullable: true,
          is_unique: false,
          is_primary_key: false,
          has_auto_increment: false,
          foreign_key_column: null,
          foreign_key_table: null,
          comment: null,
          schema: 'public',
          foreign_key_schema: null,
          enum_values: null,
        },
      ].sort(sortFn));
    });

    it('returns information for a specific column in a specific table', async () => {
      expect(await inspector.columnInfo('teams', 'uuid')).toEqual({
        schema: 'public',
        name: 'uuid',
        table: 'teams',
        data_type: 'character',
        default_value: null,
        max_length: 36,
        numeric_precision: null,
        numeric_scale: null,
        is_generated: false,
        generation_expression: null,
        is_nullable: false,
        is_unique: true,
        is_primary_key: false,
        has_auto_increment: false,
        foreign_key_schema: null,
        enum_values: null,
        foreign_key_column: null,
        foreign_key_table: null,
        comment: null,
      });
    });
  });

  describe('.primary', () => {
    it('returns primary key for a table', async () => {
      expect(await inspector.primary('users')).toEqual('id');
      expect(await inspector.primary('page_visits')).toEqual(null);
    });
  });

  describe('.transaction', () => {
    it('works with transactions transaction', async () => {
      database.transaction(async (trx) => {
        expect(await postgresInspector(trx).primary('teams')).toEqual('id');
      });
    });
  });
});

describe('postgres-with-search-path', () => {
  let database: AnyQueryBuilder;
  let inspector: SchemaInspector;

  beforeAll(async () => {
    sutando.addConnection({
      searchPath: ['public', 'test'],
      client: 'pg',
      connection: connection,
    }, 'postgres-with-search-path');
    database = sutando.connection('postgres-with-search-path');
    inspector = postgresInspector(database);

    await database.schema.dropTableIfExists('page_visits');
    await database.schema.dropTableIfExists('users');
    await database.schema.dropTableIfExists('teams');
    await database.schema.dropTableIfExists('camelCase');
    await database.schema.withSchema('test').dropTableIfExists('test');
    await database.schema.dropSchemaIfExists('test');
    await database.raw('DROP TYPE IF EXISTS user_roles CASCADE;');

    await database.raw(seed);
  });

  afterAll(async () => {
    await database.destroy();
  });

  describe('.primary', () => {
    it('returns primary key for a table', async () => {
      expect(await inspector.primary('users')).toEqual('id');
    });
  });

  describe('.transaction', () => {
    it('works with transactions transaction', async () => {
      database.transaction(async (trx) => {
        expect(await postgresInspector(trx).primary('test')).toEqual('id');
      });
    });
  });

  describe('.foreignKeys', () => {
    it('returns foreign keys for all tables', async () => {
      expect(await inspector.foreignKeys()).toEqual([
        {
          table: 'users',
          column: 'team_id',
          foreign_key_schema: 'public',
          foreign_key_table: 'teams',
          foreign_key_column: 'id',
          constraint_name: 'fk_team_id',
          on_delete: 'CASCADE',
          on_update: 'CASCADE',
        },
      ]);
    });

    it('filters based on table param', async () => {
      expect(await inspector.foreignKeys('teams')).toEqual([]);
    });
  });
});
