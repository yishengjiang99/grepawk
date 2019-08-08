 create table link(from_node varchar(255), to_node varchar(255), meta jsonb);
 create table node (xpath varchar(255) not null, data jsonb);
 create index on node(xpath);
 create index on link(from_node);
 create index on link(to_node);
 alter table node add column created_at timestamp;
 alter table node add column modified_at timestamp;
