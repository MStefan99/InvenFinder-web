create database invenfinder;
use invenfinder;

create table items (
	id          int unsigned auto_increment
		primary key,
	name        varchar(200) not null,
	description text         null default null,
	link        text         null default null,
	location    varchar(50)  not null,
	amount      int          not null
);

create fulltext index items_search_index
	on items (name, description);

create table `groups` (
	id          int unsigned auto_increment
		primary key,
	name        text         not null,
	permissions int unsigned not null default 0,
	constraint groups_name_pk
		unique (name)
);

create table users (
	id            int unsigned auto_increment
		primary key,
	username      varchar(50)  not null,
	password_salt varchar(100) not null,
	password_hash varchar(100) not null,
	permissions   int unsigned not null default 0,
	group_id      int unsigned          default null,
	constraint users_username_pk
		unique (username),
	constraint users_group_id_fk
		foreign key (group_id) references `groups` (id)
			on update cascade on delete set null
);

create table sessions (
	id            int unsigned auto_increment
		primary key,
	token         varchar(80)  not null,
	user_id       int unsigned not null,
	ip            varchar(20)  not null,
	ua            varchar(200) not null,
	time          datetime     not null,
	sso_provider  varchar(80),
	last_verified datetime,
	revoked       boolean default false,
	constraint sessions_token_pk
		unique (token),
	constraint sessions_users_id_fk
		foreign key (user_id) references users (id)
			on update cascade on delete cascade
);

create table loans (
	id       int unsigned auto_increment
		primary key,
	user_id  int unsigned not null,
	item_id  int unsigned not null,
	amount   int          not null,
	approved bool         not null default false,
	constraint loans_items_id_fk
		foreign key (item_id) references invenfinder.items (id)
			on update cascade on delete cascade,
	constraint loans_users_id_fk
		foreign key (user_id) references invenfinder.users (id)
			on update cascade on delete restrict
);
