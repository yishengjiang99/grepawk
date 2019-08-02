create table users (uuid varchar(64) not null primary key, cwd text, xp integer not null default 0, points integer not null default 0); 
create table quests (id serial primary key, name text not null, description text not null, 
pre_req integer not null default 0, 
xp_reward integer not null default 0, points_reward integer not null default 0);
