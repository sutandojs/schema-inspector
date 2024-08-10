import { sutando, AnyQueryBuilder } from 'sutando';
import { mysqlInspector } from '../src';
import { SchemaInspector } from '../src/types/schema-inspector';

for (const clientName of ['mysql', 'mysql2']) {
  describe(clientName, () => {
    let database: AnyQueryBuilder;
    let inspector: SchemaInspector;

    beforeAll(async () => {
      sutando.addConnection({
        client: clientName,
        connection: {
          host: process.env.MYSQL_HOST || 'localhost',
          port: process.env.MYSQL_PORT || 3306,
          user: 'root',
          password: process.env.MYSQL_PASSWORD || 'password',
          database: 'sutando_test',
        },
      }, clientName)
      database = sutando.connection(clientName);
      inspector = mysqlInspector(database);

      await database.schema.dropTableIfExists('page_visits');
      await database.schema.dropTableIfExists('users');
      await database.schema.dropTableIfExists('teams');

      await database.schema.createTable('page_visits', (table) => {
        table.string('request_path', 100);
        table.string('user_agent', 200);
        table.dateTime('created_at');
      });

      await database.schema.createTable('teams', (table) => {
        table.increments('id');
        table.string('uuid', 36).unique().notNullable();
        table.string('name', 100);
        table.text('description');
        table.integer('credits');
        table.dateTime('created_at');
        table.date('activated_at');
      });

      await database.schema.createTable('users', (table) => {
        table.increments('id');
        table.integer('team_id').unsigned().notNullable();
        table.string('email', 100);
        table.string('password', 60);
        table.string('status', 60).defaultTo('active');
        table.enum('role', ['admin', 'user', 'guest']);
        table.foreign('team_id').references('teams.id').onDelete('cascade').onUpdate('cascade');
      });
    });

    afterAll(async () => {
      await database.destroy();
    });

    describe('.tables', () => {
      const tables = ['page_visits', 'users', 'teams'];
      it('returns tables', async () => {
        expect(tables.sort()).toEqual([
          'page_visits',
          'users',
          'teams',
        ].sort());
      });
    });

    describe('.tableInfo', () => {
      it('returns information for all tables', async () => {
        const tableInfo = await inspector.tableInfo();
        expect(tableInfo.map(item => item.name).sort()).toEqual([
          {
            name: 'page_visits',
            // sql:
            //   'CREATE TABLE page_visits (' +
            //   '  request_path varchar(100)' +
            //   ',  user_agent varchar(200)' +
            //   ',  created_at datetime' +
            //   ')',
          },
          {
            name: 'users',
            // sql:
            //   'CREATE TABLE "users" (\n' +
            //   '\t"id"\tINT NOT NULL PRIMARY KEY AUTOINCREMENT,\n' +
            //   '\t"team_id"\tint NOT NULL,\n' +
            //   '\t"email"\tvarchar(100),\n' +
            //   '\t"password"\tvarchar(60),\n' +
            //   `\t"status"\tvarchar(60) DEFAULT 'active',\n` +
            //   '\tFOREIGN KEY("team_id") REFERENCES "teams"("id") ' +
            //   'ON UPDATE CASCADE ' +
            //   'ON DELETE CASCADE\n' +
            //   ')',
          },
          {
            name: 'teams',
            // sql:
            //   'CREATE TABLE "teams" (\n' +
            //   '\t"id"\tINT NOT NULL PRIMARY KEY AUTOINCREMENT,\n' +
            //   '\t"uuid"\tvarchar(36) NOT NULL UNIQUE,\n' +
            //   '\t"name"\tvarchar(100) DEFAULT NULL,\n' +
            //   '\t"description"\ttext,\n' +
            //   '\t"credits"\tint,\n' +
            //   '\t"created_at"\tdatetime,\n' +
            //   '\t"activated_at"\tdate\n' +
            //   ')',
          },
        ].map(item => item.name).sort());
      });

      it('returns information for specific table', async () => {
        const tableInfo = await inspector.tableInfo('teams');
        expect({
          name: tableInfo.name
        }).toEqual({
          name: 'teams',
          // sql:
          //   'CREATE TABLE "teams" (\n' +
          //   '\t"id"\tINT NOT NULL PRIMARY KEY AUTOINCREMENT,\n' +
          //   '\t"uuid"\tvarchar(36) NOT NULL UNIQUE,\n' +
          //   '\t"name"\tvarchar(100) DEFAULT NULL,\n' +
          //   '\t"description"\ttext,\n' +
          //   '\t"credits"\tint,\n' +
          //   '\t"created_at"\tdatetime,\n' +
          //   '\t"activated_at"\tdate\n' +
          //   ')',
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
      it('returns information for all tables', async () => {
        const columns = await inspector.columns();
        const sortFn = (a: any, b: any) => {
          if (`${a.table}${a.column}` < `${b.table}${b.column}`) {
            return -1;
          }
          if (`${a.table}${a.column}` > `${b.table}${b.column}`) {
            return 1;
          }
          return 0;
        };
        expect(columns.sort(sortFn)).toEqual([
          { table: 'page_visits', column: 'request_path' },
          { table: 'page_visits', column: 'user_agent' },
          { table: 'page_visits', column: 'created_at' },
          { table: 'teams', column: 'id' },
          { table: 'teams', column: 'uuid' },
          { table: 'teams', column: 'name' },
          { table: 'teams', column: 'description' },
          { table: 'teams', column: 'credits' },
          { table: 'teams', column: 'created_at' },
          { table: 'teams', column: 'activated_at' },
          { table: 'users', column: 'id' },
          { table: 'users', column: 'team_id' },
          { table: 'users', column: 'email' },
          { table: 'users', column: 'password' },
          { table: 'users', column: 'status' },
          { table: 'users', column: 'role' },
        ].sort(sortFn));
      });

      it('returns information for specific table', async () => {
        const columns = await inspector.columns('teams');
        const sortFn = (a: any, b: any) => {
          if (`${a.table}${a.column}` < `${b.table}${b.column}`) {
            return -1;
          }
          if (`${a.table}${a.column}` > `${b.table}${b.column}`) {
            return 1;
          }
          return 0;
        };
        expect(columns.sort(sortFn)).toEqual([
          { column: 'id', table: 'teams' },
          { column: 'uuid', table: 'teams' },
          { column: 'name', table: 'teams' },
          { column: 'description', table: 'teams' },
          { column: 'credits', table: 'teams' },
          { column: 'created_at', table: 'teams' },
          { column: 'activated_at', table: 'teams' },
        ].sort(sortFn));
      });
    });

    describe('.columnInfo', () => {
      it('returns information for all columns in all tables', async () => {
        const columnInfo = await inspector.columnInfo();
        const sortFn = (a: any, b: any) => {
          if (`${a.table}${a.name}` < `${b.table}${b.name}`) {
            return -1;
          }
          if (`${a.table}${a.name}` > `${b.table}${b.name}`) {
            return 1;
          }
          return 0;
        };
        expect(columnInfo.sort(sortFn)).toEqual([
          {
            name: 'request_path',
            table: 'page_visits',
            data_type: 'varchar',
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'user_agent',
            table: 'page_visits',
            data_type: 'varchar',
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'created_at',
            table: 'page_visits',
            data_type: 'datetime',
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'id',
            table: 'teams',
            data_type: 'int unsigned',
            default_value: null,
            max_length: null,
            numeric_precision: 10,
            numeric_scale: 0,
            is_generated: false,
            generation_expression: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: true,
            has_auto_increment: true,
            foreign_key_column: null,
            foreign_key_table: null,
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'uuid',
            table: 'teams',
            data_type: 'varchar',
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'name',
            table: 'teams',
            data_type: 'varchar',
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'description',
            table: 'teams',
            data_type: 'text',
            default_value: null,
            max_length: 65535,
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'credits',
            table: 'teams',
            data_type: 'int',
            default_value: null,
            max_length: null,
            numeric_precision: 10,
            numeric_scale: 0,
            is_generated: false,
            generation_expression: null,
            is_nullable: true,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'created_at',
            table: 'teams',
            data_type: 'datetime',
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
            enum_values: null,
            set_values: null,
            comment: '',
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'id',
            table: 'users',
            data_type: 'int unsigned',
            default_value: null,
            max_length: null,
            numeric_precision: 10,
            numeric_scale: 0,
            is_generated: false,
            generation_expression: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: true,
            has_auto_increment: true,
            foreign_key_column: null,
            foreign_key_table: null,
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'team_id',
            table: 'users',
            data_type: 'int unsigned',
            default_value: null,
            max_length: null,
            numeric_precision: 10,
            numeric_scale: 0,
            is_generated: false,
            generation_expression: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: 'id',
            foreign_key_table: 'teams',
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'email',
            table: 'users',
            data_type: 'varchar',
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'password',
            table: 'users',
            data_type: 'varchar',
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'status',
            table: 'users',
            data_type: 'varchar',
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
            enum_values: null,
            set_values: null,
            comment: '',
          },
          {
            name: 'role',
            table: 'users',
            data_type: 'enum',
            default_value: null,
            max_length: 5,
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
            enum_values: ['admin', 'user', 'guest'],
            set_values: null,
            comment: '',
          },
        ].sort(sortFn));
      });

      it('returns information for all columns in specific table', async () => {
        const columnInfo = await inspector.columnInfo('teams');
        const sortFn = (a: any, b: any) => {
          if (`${a.name}` < `${b.name}`) {
            return -1;
          }
          if (`${a.name}` > `${b.name}`) {
            return 1;
          }
          return 0;
        };
        expect(columnInfo.sort(sortFn)).toEqual([
          {
            name: 'id',
            table: 'teams',
            data_type: 'int unsigned',
            default_value: null,
            max_length: null,
            numeric_precision: 10,
            numeric_scale: 0,
            is_generated: false,
            generation_expression: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: true,
            has_auto_increment: true,
            foreign_key_column: null,
            foreign_key_table: null,
            enum_values: null,
            set_values: null,
            comment: "",
          },
          {
            name: 'uuid',
            table: 'teams',
            data_type: 'varchar',
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
            enum_values: null,
            set_values: null,
            comment: "",
          },
          {
            name: 'name',
            table: 'teams',
            data_type: 'varchar',
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
            enum_values: null,
            set_values: null,
            comment: "",
          },
          {
            name: 'description',
            table: 'teams',
            data_type: 'text',
            default_value: null,
            max_length: 65535,
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
            enum_values: null,
            set_values: null,
            comment: "",
          },
          {
            name: 'credits',
            table: 'teams',
            data_type: 'int',
            default_value: null,
            max_length: null,
            numeric_precision: 10,
            numeric_scale: 0,
            is_generated: false,
            generation_expression: null,
            is_nullable: true,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_column: null,
            foreign_key_table: null,
            enum_values: null,
            set_values: null,
            comment: "",
          },
          {
            name: 'created_at',
            table: 'teams',
            data_type: 'datetime',
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
            enum_values: null,
            set_values: null,
            comment: "",
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
            enum_values: null,
            set_values: null,
            comment: "",
          },
        ].sort(sortFn));
      });

      it('returns information for a specific column in a specific table', async () => {
        expect(await inspector.columnInfo('teams', 'uuid')).toEqual({
          name: 'uuid',
          table: 'teams',
          data_type: 'varchar',
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
          enum_values: null,
          set_values: null,
          comment: "",
        });
      });
    });

    describe('.primary', () => {
      it('returns primary key for a table', async () => {
        expect(await inspector.primary('teams')).toEqual('id');
        expect(await inspector.primary('page_visits')).toEqual(null);
      });
    });

    describe('.foreignKeys', () => {
      it('returns foreign keys for all tables', async () => {
        expect(await inspector.foreignKeys()).toEqual([
          {
            table: 'users',
            column: 'team_id',
            foreign_key_table: 'teams',
            foreign_key_column: 'id',
            constraint_name: 'users_team_id_foreign',
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
}
