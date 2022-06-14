import {Client} from 'https://deno.land/x/mysql@v2.10.2/mod.ts';


const conn = await new Client().connect({
	hostname: Deno.env.get('DB_URL'),
	username: Deno.env.get('DB_USER'),
	password: Deno.env.get('DB_PASSWORD'),
	db: 'invenfinder'
});


export default conn;
