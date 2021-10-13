insert into quests (name, description, pre_req, xp_reward, points_reward) values ('type ls', 'type ls', 0, 10,0);
insert into quests (name, description, pre_req, xp_reward, points_reward, pwd) values ('get out of starting zone', 'type cd ..', 0, 15, 0, '/startzone');
insert into quests (name, description, pre_req, xp_reward, points_reward, pwd) values ('open data folder', 'cd data', 0, 15, 0, '');
 create unique index on users (username);
drop index users_username_idx;