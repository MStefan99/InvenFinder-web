create database invenfinder;
use invenfinder;

create table items (
	id          int unsigned auto_increment
		primary key,
	name        varchar(200) not null,
	description text         null default null,
	link        text         null default null,
	location    varchar(50)  not null,
	amount      int unsigned not null
);

create fulltext index items_search_index
	on invenfinder.items (name, description);

create table users (
	id            int unsigned auto_increment
		primary key,
	username      varchar(50)            not null,
	password_salt varchar(100)           not null,
	password_hash varchar(100)           not null,
	permissions   int unsigned default 0 not null,
	constraint users_username_uindex
		unique (username)
);

create table sessions (
	id        int unsigned auto_increment
		primary key,
	public_id varchar(80)  not null,
	user_id   int unsigned not null,
	ip        varchar(20)  not null,
	ua        varchar(200) not null,
	time      datetime     not null,
	constraint sessions_public_id_uindex
		unique (public_id),
	constraint sessions_users_id_fk
		foreign key (user_id) references users (id)
			on update cascade on delete cascade
);
