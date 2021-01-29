import request from 'supertest';
import { app } from '../../app';

it('fails when an email that does not exist is supplied', async () => {
  await request(app)
    .post('/api/users/signin')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(400);
});

it('fails when an incorrect password is supplied', async () => {
  const auth = await global.signin();

  await request(app)
    .post('/api/users/signin')
    .send({
      email: auth.email,
      password: '1',
    })
    .expect(400);
});

it('responds with a cookie when given valid credentials', async () => {
  const auth = await global.signin();

  const response = await request(app)
    .post('/api/users/signin')
    .send({
      email: auth.email,
      password: auth.password,
    })
    .expect(200);

  expect(response.get('Set-Cookie')).toBeDefined();
});

it('return a 400 with an invalid email', async () => {
  return request(app)
    .post('/api/users/signin')
    .send({
      email: 'test@test',
      password: 'password',
    })
    .expect(400);
});

it('return a 400 with an empty email or password', async () => {
  // Missing password property
  await request(app)
    .post('/api/users/signin')
    .send({
      email: 'test@test.com',
    })
    .expect(400);

  //Missing email property
  await request(app)
    .post('/api/users/signin')
    .send({
      password: 'asdfasdf',
    })
    .expect(400);

  //Missing both email and password property
  await request(app).post('/api/users/signin').send({}).expect(400);
});
