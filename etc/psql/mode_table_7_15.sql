alter table users add username text default null;
alter table users add password text default null;
create table quest_completion (uuid text not null, quest_id numeric not null);
alter table quests add pwd text;
create unique index on users (username);
