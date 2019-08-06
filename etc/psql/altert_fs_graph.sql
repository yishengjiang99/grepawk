 alter table fs_graph add column parent_node varchar(255);
 create index on fs_graph(parent_node);
create index on fs_graph(uri);
