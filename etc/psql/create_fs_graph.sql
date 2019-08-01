create table fs_graph (id serial primary key, parent_node numeric, name varchar(255) not null, description text, type varchar(255), uri text, meta jsonb); 
