import request from 'supertest';
import { app } from '../../app';

it('clears the cookie when signing out', async () => {
  await global.signin();

  const signoutResponse = await request(app)
    .post('/api/users/signout')
    .send({})
    .expect(200);

  expect(signoutResponse.get('Set-Cookie')).toBeDefined();
});
