create or replace table invenfinder.components (
	id          int auto_increment
		primary key,
	name        text          not null,
	description text          null,
	drawer      int default 0 not null,
	col         int           not null,
	row         int           not null,
	amount      int           not null,
	constraint components_id_uindex
		unique (id),
	constraint components_location
		unique (drawer, col, row),
	constraint components_name_uindex
		unique (name) using hash
);
