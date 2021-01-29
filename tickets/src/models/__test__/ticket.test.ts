import { Ticket } from '../ticket';

it('implements optimistic concurrency control', async (done) => {
  // Create an instance of a ticket
  const ticket = Ticket.build({
    title: 'Music event',
    price: 5,
    userId: '1234',
  });

  // Save to DB
  await ticket.save();

  // Fetch ticket twice
  const instance1 = await Ticket.findById(ticket.id);
  const instance2 = await Ticket.findById(ticket.id);

  // Make two separate changes to the tickets we fetched
  instance1!.set({ price: 10 });
  instance2!.set({ price: 15 });

  // Save the first ticket
  await instance1!.save();

  // Save the second ticket
  try {
    await instance2!.save();
  } catch (error) {
    return done();
  }

  throw new Error('Should not reach this point');
});

it('increments the version number on multiple saves', async () => {
  // Create an instance of a ticket
  const ticket = Ticket.build({
    title: 'Music event',
    price: 5,
    userId: '1234',
  });

  // Save to DB
  await ticket.save();

  // Check version #
  expect(ticket.version).toEqual(0);

  // Save to DB
  await ticket.save();

  // Check version #
  expect(ticket.version).toEqual(1);

  // Save to DB
  await ticket.save();

  // Check version #
  expect(ticket.version).toEqual(2);
});
