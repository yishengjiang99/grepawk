create table fs_graph (id serial primary key, parent_node varchar(255), name varchar(255) not null, description text, type varchar(255), uri text, meta jsonb); 
create index on fs_graph(parent_node);
create index on fs_graph(uri);
alter table fs_graph add column level numeric;
create unique index on fs_graph(uri);
