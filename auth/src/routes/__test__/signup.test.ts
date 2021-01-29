import request from 'supertest';
import { app } from '../../app';

it('return a 201 on successful signup', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);
});

it('return a 400 with an invalid email', async () => {
  return request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test',
      password: 'password',
    })
    .expect(400);
});

it('return a 400 with an invalid password', async () => {
  // Too short
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'prd',
    })
    .expect(400);

  // Too long
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: '123456789123456789001234',
    })
    .expect(400);
});

it('return a 400 with an empty email or password', async () => {
  // Missing password property
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
    })
    .expect(400);

  //Missing email property
  await request(app)
    .post('/api/users/signup')
    .send({
      password: 'asdfasdf',
    })
    .expect(400);

  //Missing both email and password property
  await request(app).post('/api/users/signup').send({}).expect(400);
});

it('disallows duplicate emails signing up', async () => {
  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);

  await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(400);
});

it('sets a cookie after successful signup', async () => {
  const response = await request(app)
    .post('/api/users/signup')
    .send({
      email: 'test@test.com',
      password: 'password',
    })
    .expect(201);

  expect(response.get('Set-Cookie')).toBeDefined();
});
