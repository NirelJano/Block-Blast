import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: '19dqhpFEW3f79r5PXidm8K1CDsa206uf',
    socket: {
        host: 'redis-10687.c270.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 10687
    }
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

await client.set('foo', 'bar');
const result = await client.get('foo');
console.log(result)  // >>> bar

