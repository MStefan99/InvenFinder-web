create table invenfinder.sessions (
	id        int auto_increment
		primary key,
	public_id text   not null,
	user_id   int    not null,
	ip        text   not null,
	ua        text   not null,
	time      bigint not null,
	constraint sessions_id_uindex
		unique (id),
	constraint sessions_public_id_uindex
		unique (public_id) using hash,
	constraint sessions_users_id_fk
		foreign key (user_id) references invenfinder.users (id)
			on update cascade on delete cascade
);

