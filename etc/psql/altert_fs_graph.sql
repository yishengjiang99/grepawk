create index on fs_graph(parent_node);
create index on fs_graph(uri);
alter table fs_graph add column level numeric;
create unique index on fs_graph(uri);
