create table invenfinder.items
(
	id          int auto_increment
		primary key,
	name        varchar(200)  not null,
	description text          null,
	cabinet     int default 0 not null,
	col         int           not null,
	row         int           not null,
	amount      int           not null,
	constraint components_id_uindex
		unique (id),
	constraint components_location
		unique (cabinet, col, row),
	constraint components_name_uindex
		unique (name)
)
	engine = InnoDB;

create table invenfinder.users
(
	id            int auto_increment
		primary key,
	username      varchar(50)   not null,
	password_salt varchar(100)  not null,
	password_hash varchar(100)  not null,
	permissions   int default 0 not null,
	constraint users_id_uindex
		unique (id),
	constraint users_pk_username
		unique (username),
	constraint users_username_uindex
		unique (username)
)
	engine = InnoDB;

create table invenfinder.sessions
(
	id        int auto_increment
		primary key,
	public_id varchar(80)  not null,
	user_id   int          not null,
	ip        varchar(20)  not null,
	ua        varchar(200) not null,
	time      bigint       not null,
	constraint sessions_id_uindex
		unique (id),
	constraint sessions_public_id_uindex
		unique (public_id),
	constraint sessions_users_id_fk
		foreign key (user_id) references invenfinder.users (id)
			on update cascade on delete cascade
)
	engine = InnoDB;
