create table invenfinder.users (
	id            int auto_increment
		primary key,
	username      text          not null,
	password_salt text          not null,
	password_hash text          not null,
	permissions   int default 0 not null,
	constraint users_id_uindex
		unique (id),
	constraint users_pk_username
		unique (username) using hash,
	constraint users_username_uindex
		unique (username) using hash
);

