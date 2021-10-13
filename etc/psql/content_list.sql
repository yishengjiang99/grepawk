create table content_listing(id serial primary key, title varchar(255) not null default '', pricing numeric not null default 0, author_uuid varchar(64), created_at timestamp, updated_at timestamp);
create table content_list_tags(list_id numeric, tag varchar(255) not null);
create table content_sold(id serial primary key, content_id numeric, buyer_uuid varchar(64), seller_uuid varchar(64), price_sold_for numeric, created_at timestamp);
